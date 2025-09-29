import { Task, UserMetrics, TaskScore } from '../types/index';
import { ScoringEngine } from './scoringEngine';
import { UserService } from './userService';
import { DailyResetService } from './dailyResetService';

export class TaskService {
  private static tasks: Task[] = [
    {
      id: 'water-500',
      title: 'Drink 500 ml water',
      category: 'hydration',
      impact_weight: 4,
      effort_min: 5,
      micro_alt: 'water-250',
      ignores: 0,
      completedToday: false,
    },
    {
      id: 'water-250',
      title: 'Drink 250 ml water',
      category: 'hydration',
      impact_weight: 3,
      effort_min: 3,
      ignores: 0,
      completedToday: false,
    },
    {
      id: 'steps-1k',
      title: 'Walk 1,000 steps',
      category: 'movement',
      impact_weight: 4,
      effort_min: 10,
      micro_alt: 'steps-300',
      ignores: 0,
      completedToday: false,
    },
    {
      id: 'steps-300',
      title: 'Walk 300 steps (indoors ok)',
      category: 'movement',
      impact_weight: 3,
      effort_min: 5,
      ignores: 0,
      completedToday: false,
    },
    {
      id: 'screen-break-10',
      title: 'Take a 10-min screen break',
      category: 'screen',
      impact_weight: 4,
      effort_min: 10,
      ignores: 0,
      completedToday: false,
    },
    {
      id: 'sleep-winddown-15',
      title: '15-min wind-down routine',
      category: 'sleep',
      impact_weight: 5,
      effort_min: 15,
      time_gate: 'evening',
      ignores: 0,
      completedToday: false,
    },
    {
      id: 'mood-check-quick',
      title: 'Quick mood check-in',
      category: 'mood',
      impact_weight: 2,
      effort_min: 3,
      ignores: 0,
      completedToday: false,
    },
  ];

  private static recentlyDismissed: Set<string> = new Set();

  /**
   * Get all tasks
   * @returns Task or undefined
   */
  static getAllTasks(): Task[] {
    return [...this.tasks];
  }

  /**
   * Get task by ID
   * @param taskId Task ID
   * @returns Task or undefined
   */
  static getTaskById(taskId: string): Task | undefined {
    return this.tasks.find((task) => task.id === taskId);
  }

  /**
   * Apply substitution logic - replace parent task with micro alternative if ignored 3+ times
   * @param candidateTasks List of candidate tasks
   * @returns Updated list with substitutions applied
   */
  static applySubstitutionRules(candidateTasks: Task[]): Task[] {
    const result: Task[] = [];

    for (const task of candidateTasks) {
      if (task.ignores >= 3 && task.micro_alt) {
        const microTask = this.tasks.find((t) => t.id === task.micro_alt);
        if (microTask && !microTask.completedToday) {
          result.push(microTask);
        }
      } else {
        result.push(task);
      }
    }

    return result;
  }

  /**
   * Filter out micro alternatives to ensure no task and its micro alt appear together
   * Prefers the higher-scoring task when there's a conflict
   * @param scoredTasks List of scored tasks (should be sorted by score desc)
   * @returns Filtered list without micro alternative conflicts
   */
  static filterMicroAlternatives(scoredTasks: TaskScore[]): TaskScore[] {
    const result: TaskScore[] = [];
    const usedTasks = new Set<string>();

    for (const taskScore of scoredTasks) {
      const task = taskScore.task;

      // Skip if this task or its related task is already included
      if (usedTasks.has(task.id)) {
        continue;
      }

      // Check if this task has a micro alternative
      if (task.micro_alt && usedTasks.has(task.micro_alt)) {
        continue;
      }

      // Check if this task is a micro alternative of an already included task
      const parentTask = this.tasks.find((t) => t.micro_alt === task.id);
      if (parentTask && usedTasks.has(parentTask.id)) {
        continue;
      }

      // Add this task and mark both it and its alternative as used
      result.push(taskScore);
      usedTasks.add(task.id);
      if (task.micro_alt) {
        usedTasks.add(task.micro_alt);
      }
    }

    return result;
  }

  /**
   * Get top 4 task recommendations based on scoring algorithm
   * @param metrics Current user metrics
   * @param currentHour Current hour (0-23) for time window calculation (optional)
   * @returns Array of top 4 TaskScore objects
   */
  static getRecommendations(
    metrics: UserMetrics,
    currentHour?: number
  ): TaskScore[] {
    // Check for daily reset on first request of new day
    if (DailyResetService.checkAndPerformDailyReset()) {
      this.performDailyReset();
    }

    const currentTimeWindow = ScoringEngine.getCurrentTimeWindow(currentHour);

    // Step 1: Get all eligible tasks (not completed today)
    let candidateTasks = this.tasks.filter((task) => !task.completedToday);

    // Step 2: Apply substitution rules
    candidateTasks = this.applySubstitutionRules(candidateTasks);

    // Step 3: Remove recently dismissed tasks in this request cycle
    candidateTasks = candidateTasks.filter(
      (task) => !this.recentlyDismissed.has(task.id)
    );

    // Step 4: Calculate scores
    const scoredTasks: TaskScore[] = candidateTasks.map((task) => {
      const score = ScoringEngine.calculateScore(
        task,
        metrics,
        currentTimeWindow
      );
      const rationale = ScoringEngine.generateRationale(
        task,
        metrics,
        score,
        currentTimeWindow
      );

      return {
        task,
        score,
        rationale,
      };
    });

    // Step 5: Sort by score (desc), then impact_weight (desc), then effort_min (asc), then id (asc)
    scoredTasks.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.task.impact_weight !== a.task.impact_weight)
        return b.task.impact_weight - a.task.impact_weight;
      if (a.task.effort_min !== b.task.effort_min)
        return a.task.effort_min - b.task.effort_min;
      return a.task.id.localeCompare(b.task.id);
    });

    // Step 6: Filter to ensure no task and its micro alternative appear together
    const filteredTasks = this.filterMicroAlternatives(scoredTasks);

    // Step 7: Return top 4 unique tasks
    let result = filteredTasks.slice(0, 4);

    // Step 8: If less than 4 tasks, relax time gates and try again (but don't duplicate IDs)
    if (result.length < 4) {
      const usedIds = new Set(result.map((item: TaskScore) => item.task.id));
      const remainingTasks = candidateTasks.filter(
        (task) => !usedIds.has(task.id)
      );

      const relaxedScores = remainingTasks.map((task) => {
        // Treat timeOfDayFactor as 1 for all tasks
        const score = ScoringEngine.calculateScore(
          task,
          metrics,
          currentTimeWindow,
          {
            W_urgency: 0.5,
            W_impact: 0.3,
            W_effort: 0.15,
            W_tod: 0.15, // But calculate with factor 1
            W_penalty: 0.2,
          }
        );

        // Manually override time factor to 1
        const adjustedScore =
          score -
          0.15 *
            ScoringEngine.timeOfDayFactor(task.time_gate, currentTimeWindow) +
          0.15 * 1;
        const rationale = ScoringEngine.generateRationale(
          task,
          metrics,
          adjustedScore,
          currentTimeWindow
        );

        return {
          task,
          score: adjustedScore,
          rationale,
        };
      });

      relaxedScores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.task.impact_weight !== a.task.impact_weight)
          return b.task.impact_weight - a.task.impact_weight;
        if (a.task.effort_min !== b.task.effort_min)
          return a.task.effort_min - b.task.effort_min;
        return a.task.id.localeCompare(b.task.id);
      });

      // Filter relaxed scores to avoid micro alternative conflicts
      const filteredRelaxedScores = this.filterMicroAlternatives([
        ...result,
        ...relaxedScores,
      ]);
      result = filteredRelaxedScores.slice(0, 4);
    }

    return result;
  }

  /**
   * Complete a task and update user metrics automatically
   * @param taskId Task ID
   * @returns True if task was marked completed, else false
   */
  static completeTask(taskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (task && !task.completedToday) {
      task.completedToday = true;

      // Auto-update user metrics based on completed task
      this.updateMetricsForCompletedTask(task);

      return true;
    }
    return false;
  }

  /**
   * Dismiss a task (increment ignore count and add to recently dismissed)
   * @param taskId Task ID
   * @returns True if task was marked dismissed, else false
   */
  static dismissTask(taskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (task) {
      task.ignores += 1;
      this.recentlyDismissed.add(taskId);
      return true;
    }
    return false;
  }

  /**
   * Daily reset - reset ignores and completedToday for all tasks
   */
  static dailyReset(): void {
    this.performDailyReset();
    DailyResetService.forceDailyReset();
  }

  /**
   * Internal method to perform the actual reset
   */
  private static performDailyReset(): void {
    console.log('🔄 Performing daily reset of tasks');
    this.tasks.forEach((task) => {
      task.ignores = 0;
      task.completedToday = false;
    });
    this.recentlyDismissed.clear();

    // Also reset user metrics
    UserService.resetDailyMetrics();
  }

  /**
   * Update user metrics when a task is completed
   */
  private static updateMetricsForCompletedTask(task: Task): void {
    const currentMetrics = UserService.getCurrentMetrics();
    const updates: Partial<UserMetrics> = {};

    // Extract numeric values from task titles and update metrics accordingly
    switch (task.category) {
      case 'hydration':
        if (task.id === 'water-500') {
          updates.water_ml = currentMetrics.water_ml + 500;
        } else if (task.id === 'water-250') {
          updates.water_ml = currentMetrics.water_ml + 250;
        }
        break;

      case 'movement':
        if (task.id === 'steps-1k') {
          updates.steps = currentMetrics.steps + 1000;
        } else if (task.id === 'steps-300') {
          updates.steps = currentMetrics.steps + 300;
        }
        break;

      case 'screen':
        // For screen break, we don't directly update metrics
        // but we could track break completion
        break;

      case 'sleep':
        // Sleep tasks don't directly update sleep hours
        // (those are from previous night's sleep)
        break;

      case 'mood':
        // Mood check-in could potentially improve mood score slightly
        if (currentMetrics.mood_1to5 < 5) {
          updates.mood_1to5 = Math.min(currentMetrics.mood_1to5 + 0.5, 5);
        }
        break;
    }

    // Update metrics if there are changes
    if (Object.keys(updates).length > 0) {
      UserService.updateMetrics(updates);
      console.log(
        `📊 Auto-updated metrics for completed task ${task.id}:`,
        updates
      );
    }
  }

  /**
   * Clear recently dismissed tasks (for new request cycle)
   */
  static clearRecentlyDismissed(): void {
    this.recentlyDismissed.clear();
  }

  /**
   * Seed tasks (for admin endpoint)
   */
  static seedTasks(): Task[] {
    // Tasks are already seeded in the static array
    return this.getAllTasks();
  }

  /**
   * Update task ignores (for testing)
   * @param taskId Task ID
   * @param ignores New ignore count
   * @returns True if task was found and updated, else false
   */
  static updateTaskIgnores(taskId: string, ignores: number): boolean {
    const task = this.getTaskById(taskId);
    if (task) {
      task.ignores = ignores;
      return true;
    }
    return false;
  }
}
