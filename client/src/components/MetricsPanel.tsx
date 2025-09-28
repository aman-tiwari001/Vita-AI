import React from 'react';
import type { UserMetrics } from '../types/api';
import { FaWater, FaWalking, FaDesktop, FaBed, FaHeart } from 'react-icons/fa';

interface MetricsPanelProps {
  metrics: UserMetrics;
  onUpdateMetrics: (newMetrics: Partial<UserMetrics>) => void;
  isLoading?: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  onUpdateMetrics,
  isLoading = false,
}) => {
  const handleMetricChange = (key: keyof UserMetrics, value: number) => {
    onUpdateMetrics({ [key]: value });
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <div className="bg-pink-50 rounded-xl shadow-md p-6 -mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Daily Metrics</h2>

      <div className="space-y-8">
        {/* Water */}
        <div className="flex items-center gap-4">
          <FaWater className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Water (ml)
              </span>
              <span className="text-sm text-gray-600">
                {metrics.water_ml} / 2000
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${getProgressPercentage(metrics.water_ml, 2000)}%`,
                }}
              ></div>
            </div>
          </div>
          <input
            type="number"
            value={metrics.water_ml}
            onChange={(e) =>
              handleMetricChange('water_ml', parseInt(e.target.value) || 0)
            }
            disabled={isLoading}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100"
            min="0"
            max="5000"
          />
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4">
          <FaWalking className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Steps</span>
              <span className="text-sm text-gray-600">
                {metrics.steps} / 8000
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${getProgressPercentage(metrics.steps, 8000)}%`,
                }}
              ></div>
            </div>
          </div>
          <input
            type="number"
            value={metrics.steps}
            onChange={(e) =>
              handleMetricChange('steps', parseInt(e.target.value) || 0)
            }
            disabled={isLoading}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100"
            min="0"
            max="20000"
          />
        </div>

        {/* Sleep */}
        <div className="flex items-center gap-4">
          <FaBed className="w-5 h-5 text-purple-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Sleep (hours)
              </span>
              <span className="text-sm text-gray-600">
                {metrics.sleep_hours} / 7
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${getProgressPercentage(metrics.sleep_hours, 7)}%`,
                }}
              ></div>
            </div>
          </div>
          <input
            type="number"
            value={metrics.sleep_hours}
            onChange={(e) =>
              handleMetricChange('sleep_hours', parseFloat(e.target.value) || 0)
            }
            disabled={isLoading}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100"
            min="0"
            max="12"
            step="0.5"
          />
        </div>

        {/* Screen Time */}
        <div className="flex items-center gap-4">
          <FaDesktop className="w-5 h-5 text-orange-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Screen Time (min)
              </span>
              <span className="text-sm text-gray-600">
                {metrics.screen_time_min} / 120
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.screen_time_min > 120 ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${getProgressPercentage(metrics.screen_time_min, 120)}%`,
                }}
              ></div>
            </div>
          </div>
          <input
            type="number"
            value={metrics.screen_time_min}
            onChange={(e) =>
              handleMetricChange(
                'screen_time_min',
                parseInt(e.target.value) || 0
              )
            }
            disabled={isLoading}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100"
            min="0"
            max="1440"
          />
        </div>

        {/* Mood */}
        <div className="flex items-start gap-4">
          <FaHeart className="w-5 h-5 text-pink-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Mood (1 ~ 5) :{' '}
                <span className="text-sm text-gray-600">
                  {metrics.mood_1to5}
                </span>
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleMetricChange('mood_1to5', rating)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                    metrics.mood_1to5 >= rating
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
