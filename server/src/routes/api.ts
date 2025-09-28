import { Router } from 'express';
import { TaskService } from '../services/taskService';
import { UserService } from '../services/userService';
import {
  RecommendationResponse,
  ActionRequest,
  UserMetrics,
} from '../types/index';

const router = Router();

/**
 * GET /api/recommendations
 * Returns top 4 task recommendations based on current user metrics
 * Response: { recommendations: TaskScore[], timestamp: string, user_metrics: UserMetrics }
 * Error: { error: string }
 */
router.get('/recommendations', (req, res) => {
  try {
    // Clear recently dismissed tasks for new request cycle
    TaskService.clearRecentlyDismissed();

    const currentMetrics = UserService.getCurrentMetrics();
    const currentHour = req.query.hour
      ? parseInt(req.query.hour as string)
      : undefined;

    const recommendations = TaskService.getRecommendations(
      currentMetrics,
      currentHour
    );

    const response: RecommendationResponse = {
      recommendations,
      timestamp: new Date().toISOString(),
      user_metrics: currentMetrics,
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * POST /api/actions/complete
 * Mark a task as completed
 * Request body: { task_id: string }
 * Response: { success: boolean, message: string, timestamp: string }
 * Error: { error: string }
 */
router.post('/actions/complete', (req, res) => {
  try {
    const { task_id }: ActionRequest = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'task_id is required' });
    }

    const success = TaskService.completeTask(task_id);

    if (success) {
      res.json({
        success: true,
        message: `Task ${task_id} completed successfully`,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({ error: 'Task not found or already completed' });
    }
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

/**
 * POST /api/actions/dismiss
 * Dismiss a task (increment ignore count)
 * Request body: { task_id: string }
 * Response: { success: boolean, message: string, timestamp: string }
 * Error: { error: string }
 */
router.post('/actions/dismiss', (req, res) => {
  try {
    const { task_id }: ActionRequest = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'task_id is required' });
    }

    const success = TaskService.dismissTask(task_id);

    if (success) {
      res.json({
        success: true,
        message: `Task ${task_id} dismissed successfully`,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error dismissing task:', error);
    res.status(500).json({ error: 'Failed to dismiss task' });
  }
});

/**
 * GET /api/metrics
 * Get current user metrics
 * Response: { metrics: UserMetrics, timestamp: string }
 * Error: { error: string }
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = UserService.getCurrentMetrics();
    res.json({
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * POST /api/metrics
 * Update user metrics
 * Request body: Partial<UserMetrics>
 * Response: { success: boolean, metrics: UserMetrics, timestamp: string }
 * Error: { error: string }
 */
router.post('/metrics', (req, res) => {
  try {
    const newMetrics: Partial<UserMetrics> = req.body;
    const updatedMetrics = UserService.updateMetrics(newMetrics);

    res.json({
      success: true,
      metrics: updatedMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
});

/**
 * POST /api/admin/daily-reset
 * Perform daily reset of tasks and metrics
 * Response: { success: boolean, message: string, timestamp: string }
 * Error: { error: string }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
 */
router.post('/admin/daily-reset', (req, res) => {
  try {
    TaskService.dailyReset();
    UserService.resetDailyMetrics();

    res.json({
      success: true,
      message: 'Daily reset completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error performing daily reset:', error);
    res.status(500).json({ error: 'Failed to perform daily reset' });
  }
});

/**
 * GET /api/admin/seed
 * Get seeded tasks
 * Response: { success: boolean, tasks: Task[], timestamp: string }
 * Error: { error: string }
 */
router.get('/admin/seed', (req, res) => {
  try {
    const tasks = TaskService.seedTasks();
    res.json({
      success: true,
      tasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting seeded tasks:', error);
    res.status(500).json({ error: 'Failed to get seeded tasks' });
  }
});

/**
 * POST /api/admin/test-scenario
 * Set test scenario metrics and optionally task ignores
 * Request body: { metrics: UserMetrics, task_ignores?: Record<string, number> }
 * Response: { success: boolean, message: string, current_metrics: UserMetrics, timestamp: string }
 * Error: { error: string }
 */
router.post('/admin/test-scenario', (req, res) => {
  try {
    const { metrics, task_ignores } = req.body;

    if (metrics) {
      UserService.setTestMetrics(metrics);
    }

    if (task_ignores) {
      Object.entries(task_ignores).forEach(([taskId, ignores]) => {
        TaskService.updateTaskIgnores(taskId, ignores as number);
      });
    }

    res.json({
      success: true,
      message: 'Test scenario set successfully',
      current_metrics: UserService.getCurrentMetrics(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting test scenario:', error);
    res.status(500).json({ error: 'Failed to set test scenario' });
  }
});

export default router;
