import React from 'react';
import type { TaskScore } from '../types/api';
import {
  FaWater,
  FaWalking,
  FaDesktop,
  FaBed,
  FaHeart,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';

interface TaskCardProps {
  taskScore: TaskScore;
  onComplete: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  isLoading?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  taskScore,
  onComplete,
  onDismiss,
  isLoading = false,
}) => {
  const { task, score, rationale } = taskScore;

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'hydration':
        return <FaWater className="w-5 h-5 text-blue-500" />;
      case 'movement':
        return <FaWalking className="w-5 h-5 text-green-500" />;
      case 'screen':
        return <FaDesktop className="w-5 h-5 text-orange-500" />;
      case 'sleep':
        return <FaBed className="w-5 h-5 text-purple-500" />;
      case 'mood':
        return <FaHeart className="w-5 h-5 text-pink-500" />;
      default:
        return <FaHeart className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryColor = () => {
    switch (task.category) {
      case 'hydration':
        return 'border-blue-200 bg-blue-50';
      case 'movement':
        return 'border-green-200 bg-green-50';
      case 'screen':
        return 'border-orange-200 bg-orange-50';
      case 'sleep':
        return 'border-purple-200 bg-purple-50';
      case 'mood':
        return 'border-pink-200 bg-pink-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg ${getCategoryColor()} ${isLoading ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getCategoryIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-600">
                {task.effort_min} min
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-700">
                Score: {score.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Gate Indicator */}
      {task.time_gate && (
        <div className="mb-3">
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600 capitalize">
            {task.time_gate}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onComplete(task.id)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-pink-400 cursor-pointer hover:bg-pink-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors"
        >
          <FaCheck className="w-3 h-3" />
          Complete
        </button>
        <button
          onClick={() => onDismiss(task.id)}
          disabled={isLoading}
          className="flex items-center justify-center px-3 py-2 bg-pink-600 cursor-pointer hover:bg-pink-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>

      {/* Debug Info (can be removed in production) */}
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Info
        </summary>
        <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>
            <strong>ID:</strong> {task.id}
          </div>
          <div>
            <strong>Impact:</strong> {task.impact_weight}
          </div>
          <div>
            <strong>Ignores:</strong> {task.ignores}
          </div>
          <div>
            <strong>Rationale:</strong> {rationale}
          </div>
        </div>
      </details>
    </div>
  );
};

export default TaskCard;
