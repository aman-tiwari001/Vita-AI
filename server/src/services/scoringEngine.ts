import { Task, UserMetrics, ScoringWeights, TimeWindow } from '../types/index';

export class ScoringEngine {
  // Wt. values as per given in the assignment documentation
  private static readonly DEFAULT_WEIGHTS: ScoringWeights = {
    W_urgency: 0.5,
    W_impact: 0.3,
    W_effort: 0.15,
    W_tod: 0.15,
    W_penalty: 0.2,
  };

  /**
   * Calculate urgency contribution for a task based on current metrics
   * @param task Task to evaluate
   * @param metrics Current user metrics
   * @returns Urgency contribution (0 to 1)
   */
  static urgencyContribution(task: Task, metrics: UserMetrics): number {
    switch (task.category) {
      case 'hydration':
        return metrics.water_ml < 2000 ? (2000 - metrics.water_ml) / 2000 : 0;

      case 'movement':
        return metrics.steps < 8000 ? (8000 - metrics.steps) / 8000 : 0;

      case 'sleep':
        return metrics.sleep_hours < 7 ? 1 : 0;

      case 'screen':
        return metrics.screen_time_min > 120 ? 1 : 0;

      case 'mood':
        return metrics.mood_1to5 <= 2 ? 1 : 0.3;

      default:
        return 0;
    }
  }

  /**
   * Calculate inverse effort factor - smaller tasks get slight boost
   * @param effortMin Effort in minutes
   * @returns Inverse effort factor (higher for smaller efforts)
   */
  static inverseEffort(effortMin: number): number {
    const mins = Math.max(effortMin, 1);
    return 1 / Math.log2(mins + 2);
  }

  /**
   * Calculate time of day factor
   * @param taskTimeGate Task's time gate (if any)
   * @param currentWindow Current time window
   * @returns 1 if matches or no gate, else 0.2
   */
  static timeOfDayFactor(
    taskTimeGate: string | undefined,
    currentWindow: TimeWindow
  ): number {
    if (!taskTimeGate) return 1;
    return taskTimeGate === currentWindow ? 1 : 0.2;
  }

  /**
   * Get current time window based on hour (24-hour format)
   * @param hour Current hour (0-23), defaults to system hour
   * @returns 'morning' | 'day' | 'evening'
   */
  static getCurrentTimeWindow(
    hour: number = new Date().getHours()
  ): TimeWindow {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'day';
    return 'evening';
  }

  /**
   * Calculate final score for a task
   * @param task Task to score
   * @param metrics Current user metrics
   * @param currentTimeWindow Current time window (optional, defaults to now)
   * @param weights Scoring weights (optional, defaults to DEFAULT_WEIGHTS)
   * @returns Score rounded to 4 decimal places
   */
  static calculateScore(
    task: Task,
    metrics: UserMetrics,
    currentTimeWindow:
      | TimeWindow
      | undefined = ScoringEngine.getCurrentTimeWindow(),
    weights: ScoringWeights = ScoringEngine.DEFAULT_WEIGHTS
  ): number {
    const urgency = this.urgencyContribution(task, metrics);
    const impact = task.impact_weight;
    const effort = this.inverseEffort(task.effort_min);
    // If currentTimeWindow is undefined, treat as relaxed time gates (timeOfDayFactor = 1)
    const timeOfDay = currentTimeWindow
      ? this.timeOfDayFactor(task.time_gate, currentTimeWindow)
      : 1;
    const penalty = task.ignores;

    const score =
      weights.W_urgency * urgency +
      weights.W_impact * impact +
      weights.W_effort * effort +
      weights.W_tod * timeOfDay -
      weights.W_penalty * penalty;

    return Math.round(score * 10000) / 10000;
  }

  /**
   * Generate rationale string with actual metric values
   * @param task Task being scored
   * @param metrics Current user metrics
   * @param score Final calculated score
   * @param currentTimeWindow Current time window (optional, defaults to now)
   * @returns Rationale string
   */
  static generateRationale(
    task: Task,
    metrics: UserMetrics,
    score: number,
    currentTimeWindow:
      | TimeWindow
      | undefined = ScoringEngine.getCurrentTimeWindow()
  ): string {
    const urgency = this.urgencyContribution(task, metrics);
    // If currentTimeWindow is undefined, treat as relaxed time gates (timeOfDayFactor = 1)
    const timeOfDay = currentTimeWindow
      ? this.timeOfDayFactor(task.time_gate, currentTimeWindow)
      : 1;

    let rationale = `Score: ${score} | `;
    rationale += `Urgency: ${urgency.toFixed(3)} | `;
    rationale += `Impact: ${task.impact_weight} | `;
    rationale += `Effort: ${this.inverseEffort(task.effort_min).toFixed(3)} | `;
    rationale += `Time: ${timeOfDay} | `;
    rationale += `Ignores: ${task.ignores}`;

    return rationale;
  }
}
