import { ScoringEngine } from '../services/scoringEngine';
import { Task, UserMetrics } from '../types/index';

describe('ScoringEngine', () => {
  // Sample task for testing
  const sampleTask: Task = {
    id: 'test-task',
    title: 'Test Task',
    category: 'hydration',
    impact_weight: 4,
    effort_min: 5,
    ignores: 0,
    completedToday: false,
  };

  describe('urgencyContribution', () => {
    it('should calculate hydration urgency correctly', () => {
      const metrics: UserMetrics = {
        water_ml: 900,
        steps: 0,
        sleep_hours: 8,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'hydration' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      // (2000 - 900) / 2000 = 1100 / 2000 = 0.55
      expect(urgency).toBeCloseTo(0.55, 4);
    });

    it('should return 0 for hydration when goal is met', () => {
      const metrics: UserMetrics = {
        water_ml: 2000,
        steps: 0,
        sleep_hours: 8,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'hydration' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(0);
    });

    it('should calculate movement urgency correctly', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 4000,
        sleep_hours: 8,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'movement' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      // (8000 - 4000) / 8000 = 4000 / 8000 = 0.5
      expect(urgency).toBeCloseTo(0.5, 4);
    });

    it('should return 0 for movement when goal is met', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 8000,
        sleep_hours: 8,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'movement' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(0);
    });

    it('should return 1 for sleep when under 7 hours', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 0,
        sleep_hours: 6,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'sleep' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(1);
    });

    it('should return 0 for sleep when 7+ hours', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 0,
        sleep_hours: 7,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'sleep' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(0);
    });

    it('should return 1 for screen time when over 120 minutes', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 0,
        sleep_hours: 8,
        screen_time_min: 150,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'screen' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(1);
    });

    it('should return 0 for screen time when under 120 minutes', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 0,
        sleep_hours: 8,
        screen_time_min: 100,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'screen' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(0);
    });

    it('should return 1 for mood when rating is 2 or below', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 0,
        sleep_hours: 8,
        screen_time_min: 60,
        mood_1to5: 2,
      };

      const task: Task = { ...sampleTask, category: 'mood' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(1);
    });

    it('should return 0.3 for mood when rating is above 2', () => {
      const metrics: UserMetrics = {
        water_ml: 0,
        steps: 0,
        sleep_hours: 8,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const task: Task = { ...sampleTask, category: 'mood' };
      const urgency = ScoringEngine.urgencyContribution(task, metrics);

      expect(urgency).toBe(0.3);
    });
  });

  describe('inverseEffort', () => {
    it('should yield expected values for specific minute inputs', () => {
      // Test specific values from requirement
      expect(ScoringEngine.inverseEffort(3)).toBeCloseTo(0.4307, 4);
      expect(ScoringEngine.inverseEffort(5)).toBeCloseTo(0.3562, 4);
      expect(ScoringEngine.inverseEffort(10)).toBeCloseTo(0.2789, 4);
      expect(ScoringEngine.inverseEffort(15)).toBeCloseTo(0.2447, 4);
    });

    it('should handle edge cases', () => {
      // Test minimum effort (should not crash with 0 or negative)
      expect(ScoringEngine.inverseEffort(0)).toBeCloseTo(0.6309, 4); // 1/log2(1+2)
      expect(ScoringEngine.inverseEffort(1)).toBeCloseTo(0.6309, 4); // 1/log2(1+2)
    });

    it('should decrease as effort increases', () => {
      const effort3 = ScoringEngine.inverseEffort(3);
      const effort10 = ScoringEngine.inverseEffort(10);
      const effort20 = ScoringEngine.inverseEffort(20);

      expect(effort3).toBeGreaterThan(effort10);
      expect(effort10).toBeGreaterThan(effort20);
    });
  });

  describe('timeOfDayFactor', () => {
    it('should return 1 when task time gate matches current window', () => {
      expect(ScoringEngine.timeOfDayFactor('morning', 'morning')).toBe(1);
      expect(ScoringEngine.timeOfDayFactor('day', 'day')).toBe(1);
      expect(ScoringEngine.timeOfDayFactor('evening', 'evening')).toBe(1);
    });

    it('should return 0.2 when task time gate does not match current window', () => {
      expect(ScoringEngine.timeOfDayFactor('morning', 'day')).toBe(0.2);
      expect(ScoringEngine.timeOfDayFactor('evening', 'morning')).toBe(0.2);
      expect(ScoringEngine.timeOfDayFactor('day', 'evening')).toBe(0.2);
    });

    it('should return 1 when task has no time gate', () => {
      expect(ScoringEngine.timeOfDayFactor(undefined, 'morning')).toBe(1);
      expect(ScoringEngine.timeOfDayFactor(undefined, 'day')).toBe(1);
      expect(ScoringEngine.timeOfDayFactor(undefined, 'evening')).toBe(1);
    });
  });

  describe('getCurrentTimeWindow', () => {
    it('should return correct time windows for different hours', () => {
      // Morning: 5-11
      expect(ScoringEngine.getCurrentTimeWindow(5)).toBe('morning');
      expect(ScoringEngine.getCurrentTimeWindow(8)).toBe('morning');
      expect(ScoringEngine.getCurrentTimeWindow(11)).toBe('morning');

      // Day: 12-17
      expect(ScoringEngine.getCurrentTimeWindow(12)).toBe('day');
      expect(ScoringEngine.getCurrentTimeWindow(15)).toBe('day');
      expect(ScoringEngine.getCurrentTimeWindow(17)).toBe('day');

      // Evening: 18-4
      expect(ScoringEngine.getCurrentTimeWindow(18)).toBe('evening');
      expect(ScoringEngine.getCurrentTimeWindow(22)).toBe('evening');
      expect(ScoringEngine.getCurrentTimeWindow(2)).toBe('evening');
      expect(ScoringEngine.getCurrentTimeWindow(4)).toBe('evening');
    });
  });

  describe('calculateScore', () => {
    it('should calculate scores with correct precision (4 decimal places)', () => {
      const task: Task = {
        id: 'test-score',
        title: 'Test Score Task',
        category: 'hydration',
        impact_weight: 4,
        effort_min: 5,
        ignores: 0,
        completedToday: false,
      };

      const metrics: UserMetrics = {
        water_ml: 900,
        steps: 4000,
        sleep_hours: 6,
        screen_time_min: 150,
        mood_1to5: 2,
      };

      const score = ScoringEngine.calculateScore(task, metrics, 'day');

      // Score should be rounded to 4 decimal places
      expect(score.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(
        4
      );
    });

    it('should apply time gating factor correctly', () => {
      const eveningTask: Task = {
        id: 'evening-task',
        title: 'Evening Task',
        category: 'sleep',
        impact_weight: 5,
        effort_min: 15,
        time_gate: 'evening',
        ignores: 0,
        completedToday: false,
      };

      const metrics: UserMetrics = {
        water_ml: 2000,
        steps: 8000,
        sleep_hours: 6,
        screen_time_min: 60,
        mood_1to5: 3,
      };

      const scoreInEvening = ScoringEngine.calculateScore(
        eveningTask,
        metrics,
        'evening'
      );
      const scoreInDay = ScoringEngine.calculateScore(
        eveningTask,
        metrics,
        'day'
      );

      // Score should be higher in evening (time gate match) than in day
      expect(scoreInEvening).toBeGreaterThan(scoreInDay);

      // The difference should be exactly the time factor difference: 0.15 * (1 - 0.2) = 0.12
      expect(scoreInEvening - scoreInDay).toBeCloseTo(0.12, 4);
    });

    it('should apply penalty correctly for ignored tasks', () => {
      const task: Task = {
        id: 'penalty-task',
        title: 'Penalty Task',
        category: 'hydration',
        impact_weight: 4,
        effort_min: 5,
        ignores: 0,
        completedToday: false,
      };

      const taskWithIgnores: Task = {
        ...task,
        ignores: 2,
      };

      const metrics: UserMetrics = {
        water_ml: 900,
        steps: 4000,
        sleep_hours: 6,
        screen_time_min: 150,
        mood_1to5: 2,
      };

      const scoreNoIgnores = ScoringEngine.calculateScore(task, metrics, 'day');
      const scoreWithIgnores = ScoringEngine.calculateScore(
        taskWithIgnores,
        metrics,
        'day'
      );

      // Score with ignores should be lower by penalty amount: 0.2 * 2 = 0.4
      expect(scoreNoIgnores - scoreWithIgnores).toBeCloseTo(0.4, 4);
    });
  });

  describe('generateRationale', () => {
    it('should include actual metric values, not placeholders', () => {
      const task: Task = {
        id: 'rationale-task',
        title: 'Rationale Task',
        category: 'hydration',
        impact_weight: 4,
        effort_min: 5,
        ignores: 1,
        completedToday: false,
      };

      const metrics: UserMetrics = {
        water_ml: 900,
        steps: 4000,
        sleep_hours: 6,
        screen_time_min: 150,
        mood_1to5: 2,
      };

      const score = ScoringEngine.calculateScore(task, metrics, 'day');
      const rationale = ScoringEngine.generateRationale(
        task,
        metrics,
        score,
        'day'
      );

      // Should contain actual values, not placeholders
      expect(rationale).toContain('Score:');
      expect(rationale).toContain('Urgency:');
      expect(rationale).toContain('Impact: 4');
      expect(rationale).toContain('Effort:');
      expect(rationale).toContain('Time: 1');
      expect(rationale).toContain('Ignores: 1');

      // Should not contain placeholders
      expect(rationale).not.toContain('{{');
      expect(rationale).not.toContain('}}');
      expect(rationale).not.toContain('placeholder');
    });
  });
});
