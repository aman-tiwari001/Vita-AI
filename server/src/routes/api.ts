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
 * Response: { recommendations: TaskScore[], user_metrics: UserMetrics, timestamp: string }
 * Error: { error: string }
 */
router.get('/recommendations', (req, res) => {
  try {
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
      user_metrics: currentMetrics,
      timestamp: new Date().toISOString(),
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
 * Response: { success: boolean, message: string }
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
 * Response: { success: boolean, message: string }
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
 * Response: { metrics: UserMetrics }
 * Error: { error: string }
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = UserService.getCurrentMetrics();
    res.json({
      metrics,
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
 * Response: { success: boolean, metrics: UserMetrics }
 * Error: { error: string }
 */
router.post('/metrics', (req, res) => {
  try {
    const newMetrics: Partial<UserMetrics> = req.body;
    const updatedMetrics = UserService.updateMetrics(newMetrics);

    res.json({
      success: true,
      metrics: updatedMetrics,
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
});

export default router;
