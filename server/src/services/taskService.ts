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
      title: 'Walk 300 steps',
      category: 'movement',
      impact_weight: 3,
      effort_min: 5,
      ignores: 0,
      completedToday: false,
    },
    // {
    //   id: 'workout-40',
    //   title: 'Do a 40-min workout',
    //   category: 'movement',
    //   impact_weight: 5,
    //   effort_min: 40,
    //   micro_alt: 'workout-20',
    //   time_gate: 'morning',
    //   ignores: 0,
    //   completedToday: false,
    // },
    // {
    //   id: 'workout-20',
    //   title: 'Do a 20-min workout',
    //   category: 'movement',
    //   impact_weight: 4,
    //   effort_min: 20,
    //   time_gate: 'morning',
    //   ignores: 0,
    //   completedToday: false,
    // },
    // {
    //   id: 'screen-break-20',
    //   title: 'Take a 20-min screen break',
    //   category: 'screen',
    //   impact_weight: 5,
    //   effort_min: 20,
    //   micro_alt: 'screen-break-10',
    //   ignores: 0,
    //   completedToday: false,
    // },
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

  // Track tasks that should be temporarily hidden after dismiss (cool-down period)
  private static dismissCooldown: Map<string, number> = new Map();
  private static recommendationCount: number = 0;

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
    const substituted = new Set<string>(); // Track which micro alternatives were substituted

    for (const task of candidateTasks) {
      if (task.ignores >= 3 && task.micro_alt) {
        const microTask = this.tasks.find((t) => t.id === task.micro_alt);
        if (microTask && !microTask.completedToday) {
          result.push(microTask);
          substituted.add(task.micro_alt); // Mark this micro alt as substituted
        }
      } else if (!substituted.has(task.id)) {
        // Only add the task if it wasn't already substituted in
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
   * Filter out micro alternatives that shouldn't appear unless their parent is completed or ignored 3+ times
   * @param candidateTasks List of candidate tasks
   * @returns Filtered list with only eligible micro alternatives
   */
  static filterIneligibleMicroAlternatives(candidateTasks: Task[]): Task[] {
    return candidateTasks.filter((task) => {
      // Find if this task is a micro alternative of another task
      const parentTask = this.tasks.find((t) => t.micro_alt === task.id);

      // If this is not a micro alternative, it's always eligible
      if (!parentTask) {
        return true;
      }

      // This is a micro alternative - only show it if:
      // 1. Parent task is completed today, OR
      // 2. Parent task has been ignored 3+ times
      return parentTask.completedToday || parentTask.ignores >= 3;
    });
  }

  /**
   * Get top 4 task recommendations based on scoring algorithm
   * @param metrics Current user metrics
   * @param currentHour Current hour (0-23) for time window calculation
   * @returns Array of top 4 TaskScore objects
   */
  static getRecommendations(
    metrics: UserMetrics,
    currentHour?: number
  ): TaskScore[] {
    // Check for daily reset on first request
    if (DailyResetService.checkAndPerformDailyReset()) {
      this.performDailyReset();
    }

    // Increment recommendation count for cool-down tracking
    this.recommendationCount++;

    const currentTimeWindow = ScoringEngine.getCurrentTimeWindow(currentHour);

    // Get all eligible tasks (not completed today)
    let candidateTasks = this.tasks.filter((task) => !task.completedToday);

    // Filter out micro alternatives unless their parent task is completed or ignored 3+ times
    candidateTasks = this.filterIneligibleMicroAlternatives(candidateTasks);

    // Apply substitution rules - replace parent tasks with micro alternatives if ignored 3+ times
    candidateTasks = this.applySubstitutionRules(candidateTasks);

    // Filter out tasks in cool-down period (temporarily hidden)
    let cooledDownTasks = candidateTasks.filter((task) => {
      if (task.ignores >= 3) {
        return true;
      }

      const cooldownUntil = this.dismissCooldown.get(task.id);
      return !cooldownUntil || this.recommendationCount > cooldownUntil;
    });

    // If fewer than 4 tasks after cool-down filtering then relax cool-down to ensure 4 tasks
    if (cooledDownTasks.length < 4) {
      cooledDownTasks = candidateTasks;
    }

    // Filter tasks based on time gating - prefer tasks matching current time window
    let timeFilteredTasks = cooledDownTasks.filter((task) =>
      task.time_gate ? task.time_gate === currentTimeWindow : true
    );

    // Determine if we need to relax time gates
    const relaxTimeGates = timeFilteredTasks.length < 4;

    // Relax time gates for tasks
    if (relaxTimeGates) {
      timeFilteredTasks = cooledDownTasks;
    }

    // Calculate scores
    const scoredTasks: TaskScore[] = timeFilteredTasks.map((task) => {
      const score = ScoringEngine.calculateScore(
        task,
        metrics,
        relaxTimeGates ? undefined : currentTimeWindow
      );
      const rationale = ScoringEngine.generateRationale(
        task,
        metrics,
        score,
        relaxTimeGates ? undefined : currentTimeWindow
      );

      return {
        task,
        score,
        rationale,
      };
    });

    // Sort by score (desc), then impact_weight (desc), then effort_min (asc), then id (asc)
    scoredTasks.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.task.impact_weight !== a.task.impact_weight)
        return b.task.impact_weight - a.task.impact_weight;
      if (a.task.effort_min !== b.task.effort_min)
        return a.task.effort_min - b.task.effort_min;
      return a.task.id.localeCompare(b.task.id);
    });

    // Filter to ensure no task and its micro alternative appear together
    const filteredTasks = this.filterMicroAlternatives(scoredTasks);

    // Return top 4 unique tasks
    const result = filteredTasks.slice(0, 4);
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

      this.updateMetricsForCompletedTask(task);

      return true;
    }
    return false;
  }

  /**
   * Dismiss a task (apply cool-down period)
   * @param taskId Task ID
   * @returns True if task was marked dismissed, else false
   */
  static dismissTask(taskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (task) {
      task.ignores += 1;

      // Add cool-down period for the task, it will be hidden for the next 2 recommendation cycles
      if (task.ignores < 3) {
        this.dismissCooldown.set(taskId, this.recommendationCount + 2);
      }

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
    console.log('Performing daily reset of tasks');
    this.tasks.forEach((task) => {
      task.ignores = 0;
      task.completedToday = false;
    });
    this.dismissCooldown.clear();
    this.recommendationCount = 0;

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
        // For screen break, we don't directly update metrics coz it's a break
        break;

      case 'sleep':
        // Sleep tasks don't directly update sleep hours coz they are wind-down routines
        break;

      case 'mood':
        // It's a quick mood check-in reminder for user to input his mood level on scale 1-5
        break;
    }

    // Update metrics if there are changes
    if (Object.keys(updates).length > 0) {
      UserService.updateMetrics(updates);
      console.log(`Updated metrics for completed task ${task.id}:`, updates);
    }
  }

  /**
   * Set ignores count for a task (for testing purposes)
   * @param taskId Task ID
   * @param ignores Number of ignores
   */
  static setTaskIgnores(taskId: string, ignores: number): void {
    const task = this.getTaskById(taskId);
    if (task) {
      task.ignores = ignores;
    }
  }
}
