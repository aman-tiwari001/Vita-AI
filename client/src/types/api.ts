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
  user_metrics: UserMetrics;
  timestamp: string;
}

export interface ActionRequest {
  task_id: string;
  action: 'complete' | 'dismiss';
}
