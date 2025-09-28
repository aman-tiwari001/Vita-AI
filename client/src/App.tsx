import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import TaskCard from './components/TaskCard';
import MetricsPanel from './components/MetricsPanel';
import { taskApi } from './services/api';
import type { TaskScore, UserMetrics } from './types/api';
import Topbar from './components/Topbar';
import { debounce } from 'lodash';

function App() {
  const [recommendations, setRecommendations] = useState<TaskScore[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    water_ml: 0,
    steps: 0,
    sleep_hours: 0,
    screen_time_min: 0,
    mood_1to5: 3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch initial data
  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await taskApi.getRecommendations();
      setRecommendations(response.recommendations);
      setMetrics(response.user_metrics);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    if (!isInitialized) {
      fetchRecommendations().then(() => setIsInitialized(true));
    }
  }, [isInitialized]);

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      await taskApi.completeTask(taskId);
      toast.success('Task completed! 🎉');
      await fetchRecommendations();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task dismissal
  const handleDismissTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      await taskApi.dismissTask(taskId);
      toast.success('Task dismissed');
      await fetchRecommendations();
    } catch (error) {
      console.error('Error dismissing task:', error);
      toast.error('Failed to dismiss task');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle metrics update
  const handleUpdateMetrics = async (newMetrics: Partial<UserMetrics>) => {
    try {
      await debounce(async () => {
        const response = await taskApi.updateMetrics(newMetrics);
        setMetrics(response.metrics);
        setIsLoading(true);
        await fetchRecommendations();
        toast.success('Metrics updated');
      }, 500)();
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast.error('Failed to update metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Vita-AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-pink-100">
      <Toaster position="top-center" />

      {/* Header */}
      <Topbar />

      <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task Cards Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center justify-between my-5">
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Your Tasks</h2>
                <p className="text-gray-600 text-left text-sm">
                  Personalized wellness tasks based on your daily metrics
                </p>
              </div>
              <button
                onClick={fetchRecommendations}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-l from-pink-500 to-pink-600 hover:bg-gradient-to-bl hover:scale-105 transition-all duration-300 hover:cursor-pointer disabled:bg-gray-300 text-white text-sm font-medium rounded-md"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  All Done for Today!
                </h3>
                <p className="text-gray-600">
                  You've crushed today's wellness goals. Take a moment to
                  celebrate your achievements!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((taskScore) => (
                  <TaskCard
                    key={taskScore.task.id}
                    taskScore={taskScore}
                    onComplete={handleCompleteTask}
                    onDismiss={handleDismissTask}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="my-12">
          {/* Metrics Panel */}
          <MetricsPanel
            metrics={metrics}
            onUpdateMetrics={handleUpdateMetrics}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-sm text-gray-500">
        <p>Vita AI v1 - Smart Wellness Application</p>
        <p>
          Developed by{' '}
          <a
            href="https://www.linkedin.com/in/aman-tiwari001/"
            className="text-blue-500 font-bold underline"
          >
            Aman Tiwari
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;
