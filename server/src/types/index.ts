export interface UserMetrics {
  water_ml: number;
  steps: number;
  sleep_hours: number;
  screen_time_min: number;
  mood_1to5: number;
}

export interface Task {
  id: string;
  title: string;
  category: 'hydration' | 'movement' | 'screen' | 'sleep' | 'mood';
  impact_weight: number;
  effort_min: number;
  time_gate?: 'morning' | 'day' | 'evening';
  micro_alt?: string;
  ignores: number;
  completedToday: boolean;
}

export interface TaskScore {
  task: Task;
  score: number;
  rationale: string;
}

export interface RecommendationResponse {
  recommendations: TaskScore[];
  timestamp: string;
  user_metrics: UserMetrics;
}

export interface ActionRequest {
  task_id: string;
  action: 'complete' | 'dismiss';
}

export interface ScoringWeights {
  W_urgency: number;
  W_impact: number;
  W_effort: number;
  W_tod: number;
  W_penalty: number;
}

export type TimeWindow = 'morning' | 'day' | 'evening';

export interface TaskHistory {
  user_id: string;
  task_id: string;
  date: string;
  completion_status: 'completed' | 'dismissed' | 'ignored';
  timestamp: string;
}
