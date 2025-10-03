import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import TaskCard from './components/TaskCard';
import MetricsPanel from './components/MetricsPanel';
import { taskApi } from './services/api';
import type { TaskScore, UserMetrics } from './types/api';
import Topbar from './components/Topbar';
import { debounce } from 'lodash';
import Footer from './components/Footer';
import { BiRefresh } from 'react-icons/bi';

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

  // Fetch initial data - recommendations and user metrics
  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await taskApi.getRecommendations();
      const responseMetrics = await taskApi.getMetrics();
      setRecommendations(response.recommendations);
      setMetrics(responseMetrics.metrics);
    } catch (error) {
      console.error('Error fetching recommendations or user metrics:', error);
      toast.error('Failed to load recommendations or user metrics');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Loading screen
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 shadow-2xl border-pink-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold flex items-center text-pink-700 text-shadow-lg">
            <img
              src="/logo.png"
              alt="Vita AI Logo"
              className="inline-block w-10 h-10 mr-2 shadow-2xl bg-pink-100 rounded-full p-1"
            />
            Vita AI
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-pink-100">
      <Toaster position="top-center" />

      {/* Navigation bar */}
      <Topbar />

      <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Cards Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex gap-2 items-center justify-between my-5">
              <div className="text-left">
                <h2 className="text-xl font-bold text-pink-600">Your Tasks</h2>
                <p className="text-gray-600 text-left text-sm text-wrap">
                  Personalized wellness tasks based on your daily metrics
                </p>
              </div>
              <button
                onClick={fetchRecommendations}
                disabled={isLoading}
                className="p-2 flex gap-1 items-center bg-gradient-to-l from-pink-500 to-pink-600 hover:bg-gradient-to-bl hover:scale-105 transition-all duration-300 hover:cursor-pointer disabled:bg-gray-300 text-white text-sm font-medium rounded-md"
              >
                <BiRefresh size={27}/>{isLoading ? 'Refreshing...' : 'Refresh'}
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

        {/* Metrics Panel */}
        <div className="my-12">
          <MetricsPanel
            metrics={metrics}
            onUpdateMetrics={handleUpdateMetrics}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer /> 
    </div>
  );
}

export default App;
