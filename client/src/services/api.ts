import axios from 'axios';
import type { RecommendationResponse, UserMetrics } from '../types/api';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskApi = {
  // Get recommendations
  getRecommendations: async (): Promise<RecommendationResponse> => {
    const response = await api.get('/recommendations');
    return response.data;
  },

  // Complete a task
  completeTask: async (taskId: string): Promise<void> => {
    await api.post('/actions/complete', { task_id: taskId });
  },

  // Dismiss a task
  dismissTask: async (taskId: string): Promise<void> => {
    await api.post('/actions/dismiss', { task_id: taskId });
  },

  // Get current metrics
  getMetrics: async (): Promise<{
    metrics: UserMetrics;
    timestamp: string;
  }> => {
    const response = await api.get('/metrics');
    return response.data;
  },

  // Update metrics
  updateMetrics: async (
    metrics: Partial<UserMetrics>
  ): Promise<{ success: boolean; metrics: UserMetrics; timestamp: string }> => {
    const response = await api.post('/metrics', metrics);
    return response.data;
  },

  // Daily reset (admin)
  dailyReset: async (): Promise<void> => {
    await api.post('/admin/daily-reset');
  },

  // Set test scenario (admin)
  setTestScenario: async (
    metrics: UserMetrics,
    taskIgnores?: Record<string, number>
  ): Promise<void> => {
    await api.post('/admin/test-scenario', {
      metrics,
      task_ignores: taskIgnores,
    });
  },
};

export default api;
