export class DailyResetService {
  private static lastResetDate: string = new Date().toDateString();

  /**
   * Check if daily reset is needed and perform it
   * Called on first request of each new day
   */
  static checkAndPerformDailyReset(): boolean {
    const currentDate = new Date().toDateString();

    if (currentDate !== this.lastResetDate) {
      console.log(
        `Performing daily reset - Date changed from ${this.lastResetDate} to ${currentDate}`
      );

      // Update the last reset date
      this.lastResetDate = currentDate;

      return true;
    }

    return false;
  }

  /**
   * Force daily reset
   */
  static forceDailyReset(): void {
    this.lastResetDate = new Date().toDateString();
  }

  /**
   * Get last reset date
   */
  static getLastResetDate(): string {
    return this.lastResetDate;
  }
}
