import { UserMetrics } from '../types/index';

export class UserService {
  private static currentMetrics: UserMetrics = {
    water_ml: 0,
    steps: 0,
    sleep_hours: 0,
    screen_time_min: 0,
    mood_1to5: 3,
  };

  /**
   * Get current user metrics
   * @return Current user metrics
   */
  static getCurrentMetrics(): UserMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Update user metrics
   * @param newMetrics Partial metrics to update
   * @returns Updated metrics
   */
  static updateMetrics(newMetrics: Partial<UserMetrics>): UserMetrics {
    this.currentMetrics = {
      ...this.currentMetrics,
      ...newMetrics,
    };
    return this.getCurrentMetrics();
  }

  /**
   * Reset daily metrics
   */
  static resetDailyMetrics(): void {
    this.currentMetrics = {
      water_ml: 0,
      steps: 0,
      sleep_hours: 0,
      screen_time_min: 0,
      mood_1to5: 3,
    };
  }

  /**
   * Set specific test scenario metrics (for testing purposes)
   * @param metrics Metrics to set
   * @returns Updated metrics
   */
  static setTestMetrics(metrics: UserMetrics): UserMetrics {
    this.currentMetrics = { ...metrics };
    return this.getCurrentMetrics();
  }
}
