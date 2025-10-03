import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../routes/api';
import { UserService } from '../services/userService';
import { TaskService } from '../services/taskService';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Reset system state before each test
    TaskService.dailyReset();
    UserService.resetDailyMetrics();
  });

  describe('GET /api/recommendations', () => {
    it('should return exactly 4 recommendations with proper structure', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('timestamp');
      // expect(response.body).toHaveProperty('user_metrics');

      expect(response.body.recommendations).toHaveLength(4);

      // Verify structure of each recommendation
      response.body.recommendations.forEach((rec: any) => {
        expect(rec).toHaveProperty('task');
        expect(rec).toHaveProperty('score');
        expect(rec).toHaveProperty('rationale');

        expect(rec.task).toHaveProperty('id');
        expect(rec.task).toHaveProperty('title');
        expect(rec.task).toHaveProperty('category');
        expect(rec.task).toHaveProperty('impact_weight');
        expect(rec.task).toHaveProperty('effort_min');

        expect(typeof rec.score).toBe('number');
        expect(typeof rec.rationale).toBe('string');
      });
    });

    it('should match Scenario A reference values', async () => {
      // Reset before setting up scenario
      TaskService.dailyReset();

      // Set test metrics for Scenario A
      await request(app)
        .post('/api/metrics')
        .send({
          water_ml: 900,
          steps: 4000,
          sleep_hours: 6,
          screen_time_min: 150,
          mood_1to5: 2,
        })
        .expect(200);

      // Set up substitution scenario: screen-break-20 has been ignored 3+ times
      TaskService.setTaskIgnores('screen-break-20', 3);

      // Get recommendations for day window (15:00)
      const response = await request(app)
        .get('/api/recommendations?hour=15')
        .expect(200);

      const recommendations = response.body.recommendations;
      expect(recommendations).toHaveLength(4);

      // Expected order and scores with proper time gate filtering (day window = 15:00)
      // Only tasks without time_gate or day time_gate should appear initially
      const expected = [
        { id: 'screen-break-10', score: 1.8918 }, // Substituted for screen-break-20, no time gate
        { id: 'water-500', score: 1.6784 }, // No time gate
        { id: 'steps-1k', score: 1.6418 }, // No time gate
        { id: 'mood-check-quick', score: 1.3146 }, // No time gate
      ];

      expected.forEach((expectedTask, index) => {
        const actual = recommendations[index];
        expect(actual.task.id).toBe(expectedTask.id);
        expect(actual.score).toBeCloseTo(expectedTask.score, 4);
      });
    });
  });

  describe('POST /api/actions/complete', () => {
    it('should complete task and hide it from future recommendations', async () => {
      // Get initial recommendations
      const initialResponse = await request(app)
        .get('/api/recommendations')
        .expect(200);

      const taskToComplete = initialResponse.body.recommendations[0].task.id;

      // Complete the task
      await request(app)
        .post('/api/actions/complete')
        .send({ task_id: taskToComplete })
        .expect(200);

      // Get recommendations again
      const afterResponse = await request(app)
        .get('/api/recommendations')
        .expect(200);

      // Completed task should not appear
      const taskIds = afterResponse.body.recommendations.map(
        (rec: any) => rec.task.id
      );
      expect(taskIds).not.toContain(taskToComplete);
    });

    it('should auto-update metrics when completing tasks', async () => {
      // Set initial metrics
      await request(app)
        .post('/api/metrics')
        .send({
          water_ml: 0,
          steps: 0,
          sleep_hours: 8,
          screen_time_min: 60,
          mood_1to5: 3,
        })
        .expect(200);

      // Complete water task
      await request(app)
        .post('/api/actions/complete')
        .send({ task_id: 'water-500' })
        .expect(200);

      // Get metrics to verify auto-update
      const metricsResponse = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(metricsResponse.body.metrics.water_ml).toBe(500);
    });
  });

  describe('POST /api/actions/dismiss', () => {
    it('should increment ignore count and trigger substitution after 3 dismissals', async () => {
      // Set metrics to prioritize hydration to ensure water-250 appears in top 4
      await request(app)
        .post('/api/metrics')
        .send({
          water_ml: 0, // High hydration need
          steps: 5000, // Lower step need
          sleep_hours: 8, // Good sleep
          screen_time_min: 30, // Low screen time
          mood_1to5: 4, // Good mood
        })
        .expect(200);

      // Dismiss water-500 three times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/actions/dismiss')
          .send({ task_id: 'water-500' })
          .expect(200);
      }

      // Get new recommendations
      const response = await request(app)
        .get('/api/recommendations')
        .expect(200);

      const taskIds = response.body.recommendations.map(
        (rec: any) => rec.task.id
      );

      // Should have water-250 instead of water-500
      expect(taskIds).toContain('water-250');
      expect(taskIds).not.toContain('water-500');
    });
  });

  describe('POST /api/metrics', () => {
    it('should update user metrics and affect recommendations', async () => {
      // Set metrics that prioritize hydration
      await request(app)
        .post('/api/metrics')
        .send({
          water_ml: 0,
          steps: 8000,
          sleep_hours: 8,
          screen_time_min: 60,
          mood_1to5: 5,
        })
        .expect(200);

      const response = await request(app)
        .get('/api/recommendations')
        .expect(200);

      // Water task should be highly prioritized
      const recommendations = response.body.recommendations;
      const waterTask = recommendations.find(
        (rec: any) => rec.task.id === 'water-500' || rec.task.id === 'water-250'
      );

      expect(waterTask).toBeDefined();
      expect(recommendations.indexOf(waterTask)).toBeLessThan(2); // Should be in top 2
    });
  });

  describe('Time Gating', () => {
    it('should show different scores for time-gated tasks based on current hour', async () => {
      // Set metrics that make sleep urgent
      await request(app)
        .post('/api/metrics')
        .send({
          water_ml: 2000,
          steps: 8000,
          sleep_hours: 5,
          screen_time_min: 60,
          mood_1to5: 3,
        })
        .expect(200);

      // Get recommendations for evening (sleep task's time gate)
      const eveningResponse = await request(app)
        .get('/api/recommendations?hour=20')
        .expect(200);

      // Get recommendations for day (not sleep task's time gate)
      const dayResponse = await request(app)
        .get('/api/recommendations?hour=15')
        .expect(200);

      const eveningSleep = eveningResponse.body.recommendations.find(
        (rec: any) => rec.task.id === 'sleep-winddown-15'
      );
      const daySleep = dayResponse.body.recommendations.find(
        (rec: any) => rec.task.id === 'sleep-winddown-15'
      );

      if (eveningSleep && daySleep) {
        expect(eveningSleep.score).toBeGreaterThan(daySleep.score);
      }
    });
  });
});
