import React from 'react';

interface TestScenariosPanelProps {
  onSetScenario: (scenario: string) => void;
  isLoading?: boolean;
}

const TestScenariosPanel: React.FC<TestScenariosPanelProps> = ({
  onSetScenario,
  isLoading = false,
}) => {
  const scenarios = [
    {
      name: 'Scenario A (Reference)',
      description:
        'Water: 900ml, Steps: 4000, Sleep: 6h, Screen: 150min, Mood: 2',
      id: 'scenario-a',
    },
    {
      name: 'Scenario B (Hydration Focus)',
      description: 'Low water, good other metrics',
      id: 'scenario-b',
    },
    {
      name: 'Scenario C (All Good)',
      description: 'All metrics at or above goals',
      id: 'scenario-c',
    },
    {
      name: 'Scenario D (Sleep Urgent)',
      description: 'Very low sleep, other metrics okay',
      id: 'scenario-d',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Test Scenarios</h2>
      <p className="text-sm text-gray-600 mb-4">
        Quick test scenarios to verify the scoring algorithm works correctly.
      </p>

      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSetScenario(scenario.id)}
            disabled={isLoading}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <div className="font-medium text-gray-800">{scenario.name}</div>
            <div className="text-sm text-gray-600 mt-1">
              {scenario.description}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => onSetScenario('daily-reset')}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
        >
          Daily Reset (Reset All Tasks)
        </button>
      </div>
    </div>
  );
};

export default TestScenariosPanel;
