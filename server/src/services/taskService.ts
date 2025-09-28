import { Task, UserMetrics, TaskScore, TimeWindow } from '../types/index';
import { ScoringEngine } from './scoringEngine';

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
   * Get top 4 task recommendations based on scoring algorithm
   * @param metrics Current user metrics
   * @param currentHour Current hour (0-23) for time window calculation (optional)
   * @returns Array of top 4 TaskScore objects
   */
  static getRecommendations(
    metrics: UserMetrics,
    currentHour?: number
  ): TaskScore[] {
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

    // Step 6: Return top 4 unique tasks
    let result = scoredTasks.slice(0, 4);

    // Step 7: If less than 4 tasks, relax time gates and try again (but don't duplicate IDs)
    if (result.length < 4) {
      const usedIds = new Set(result.map((item) => item.task.id));
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

      result = [...result, ...relaxedScores].slice(0, 4);
    }

    return result;
  }

  /**
   * Complete a task
   * @param taskId Task ID
   * @returns True if task was marked completed, else false
   */
  static completeTask(taskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (task && !task.completedToday) {
      task.completedToday = true;
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
    this.tasks.forEach((task) => {
      task.ignores = 0;
      task.completedToday = false;
    });
    this.recentlyDismissed.clear();
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
