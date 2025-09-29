#!/usr/bin/env node

/**
 * Quick Test Runner for Vita-AI Scoring Engine
 * Verifies all acceptance criteria are met
 */

const { TaskService } = require('../../dist/services/taskService');
const { UserService } = require('../../dist/services/userService');
const { ScoringEngine } = require('../../dist/services/scoringEngine');

function runScenarioA() {
  console.log('\n🧪 Testing Scenario A...');

  // Reset state
  TaskService.dailyReset();

  // Set Scenario A metrics
  const scenarioAMetrics = {
    water_ml: 900,
    steps: 4000,
    sleep_hours: 6,
    screen_time_min: 150,
    mood_1to5: 2,
  };

  UserService.setTestMetrics(scenarioAMetrics);

  // Get recommendations for day window (15:00)
  const recommendations = TaskService.getRecommendations(scenarioAMetrics, 15);

  console.log('Recommendations (top 4):');
  recommendations.forEach((rec, index) => {
    console.log(
      `${index + 1}. ${rec.task.id} - Score: ${rec.score.toFixed(4)}`
    );
    console.log(`   ${rec.rationale}`);
  });

  // Verify exactly 4 recommendations
  if (recommendations.length === 4) {
    console.log('✅ Returns exactly 4 recommendations');
  } else {
    console.log('❌ Should return exactly 4 recommendations');
  }

  // Verify deterministic behavior
  const recommendations2 = TaskService.getRecommendations(scenarioAMetrics, 15);
  const identical = recommendations.every(
    (rec, i) =>
      rec.task.id === recommendations2[i].task.id &&
      rec.score === recommendations2[i].score
  );

  if (identical) {
    console.log('✅ Deterministic behavior verified');
  } else {
    console.log('❌ Results should be deterministic');
  }

  return recommendations;
}

function testSubstitution() {
  console.log('\n🔄 Testing Task Substitution...');

  TaskService.dailyReset();
  UserService.setTestMetrics({
    water_ml: 0,
    steps: 0,
    sleep_hours: 8,
    screen_time_min: 60,
    mood_1to5: 3,
  });

  // Dismiss water-500 three times
  console.log('Dismissing water-500 three times...');
  for (let i = 0; i < 3; i++) {
    TaskService.dismissTask('water-500');
    TaskService.clearRecentlyDismissed();
  }

  const recommendations = TaskService.getRecommendations({
    water_ml: 0,
    steps: 0,
    sleep_hours: 8,
    screen_time_min: 60,
    mood_1to5: 3,
  });

  const hasWater250 = recommendations.some((r) => r.task.id === 'water-250');
  const hasWater500 = recommendations.some((r) => r.task.id === 'water-500');

  if (hasWater250 && !hasWater500) {
    console.log('✅ Substitution working: water-500 → water-250');
  } else {
    console.log('❌ Substitution failed');
  }
}

function testCompletion() {
  console.log('\n✔️ Testing Task Completion...');

  TaskService.dailyReset();
  UserService.setTestMetrics({
    water_ml: 0,
    steps: 0,
    sleep_hours: 8,
    screen_time_min: 60,
    mood_1to5: 3,
  });

  // Complete water-500
  console.log('Completing water-500...');
  const completed = TaskService.completeTask('water-500');

  if (completed) {
    console.log('✅ Task completed successfully');
  } else {
    console.log('❌ Task completion failed');
  }

  // Check if hidden from recommendations
  const recommendations = TaskService.getRecommendations({
    water_ml: 500,
    steps: 0,
    sleep_hours: 8,
    screen_time_min: 60,
    mood_1to5: 3,
  });

  const stillVisible = recommendations.some((r) => r.task.id === 'water-500');

  if (!stillVisible) {
    console.log('✅ Completed task hidden from recommendations');
  } else {
    console.log('❌ Completed task should be hidden');
  }
}

function testTimeGating() {
  console.log('\n🕐 Testing Time Gating...');

  TaskService.dailyReset();
  const metrics = {
    water_ml: 2000,
    steps: 8000,
    sleep_hours: 6,
    screen_time_min: 60,
    mood_1to5: 3,
  };

  UserService.setTestMetrics(metrics);

  // Get recommendations for evening vs day
  const eveningRecs = TaskService.getRecommendations(metrics, 20);
  const dayRecs = TaskService.getRecommendations(metrics, 15);

  const eveningSleep = eveningRecs.find(
    (r) => r.task.id === 'sleep-winddown-15'
  );
  const daySleep = dayRecs.find((r) => r.task.id === 'sleep-winddown-15');

  if (eveningSleep && daySleep && eveningSleep.score > daySleep.score) {
    const difference = (eveningSleep.score - daySleep.score).toFixed(4);
    console.log(
      `✅ Time gating working: Evening score (${eveningSleep.score.toFixed(4)}) > Day score (${daySleep.score.toFixed(4)})`
    );
    console.log(`   Score difference: ${difference} (expected: ~0.12)`);
  } else {
    console.log('❌ Time gating not working properly');
  }
}

function testNoMicroConflicts() {
  console.log('\n🚫 Testing No Micro Alternative Conflicts...');

  TaskService.dailyReset();
  UserService.setTestMetrics({
    water_ml: 0,
    steps: 0,
    sleep_hours: 8,
    screen_time_min: 60,
    mood_1to5: 3,
  });

  const recommendations = TaskService.getRecommendations({
    water_ml: 0,
    steps: 0,
    sleep_hours: 8,
    screen_time_min: 60,
    mood_1to5: 3,
  });

  const taskIds = recommendations.map((r) => r.task.id);

  const hasWater500 = taskIds.includes('water-500');
  const hasWater250 = taskIds.includes('water-250');
  const hasSteps1k = taskIds.includes('steps-1k');
  const hasSteps300 = taskIds.includes('steps-300');

  const hasWaterConflict = hasWater500 && hasWater250;
  const hasStepsConflict = hasSteps1k && hasSteps300;

  if (!hasWaterConflict && !hasStepsConflict) {
    console.log('✅ No micro alternative conflicts detected');
    console.log(`   Tasks: ${taskIds.join(', ')}`);
  } else {
    console.log('❌ Micro alternative conflicts detected');
  }
}

function testInverseEffortPrecision() {
  console.log('\n🔢 Testing Inverse Effort Precision...');

  const testCases = [
    { input: 3, expected: 0.4307 },
    { input: 5, expected: 0.3562 },
    { input: 10, expected: 0.2789 },
    { input: 15, expected: 0.2447 },
  ];

  let allPassed = true;

  testCases.forEach(({ input, expected }) => {
    const actual = ScoringEngine.inverseEffort(input);
    const difference = Math.abs(actual - expected);
    const passed = difference < 0.0001;

    console.log(
      `   inverseEffort(${input}): ${actual.toFixed(4)} (expected: ${expected}) ${passed ? '✅' : '❌'}`
    );

    if (!passed) allPassed = false;
  });

  if (allPassed) {
    console.log('✅ All inverse effort calculations precise');
  } else {
    console.log('❌ Some inverse effort calculations failed');
  }
}

function main() {
  console.log('🚀 Vita-AI Scoring Engine Test Suite');
  console.log('=====================================');

  try {
    runScenarioA();
    testSubstitution();
    testCompletion();
    testTimeGating();
    testNoMicroConflicts();
    testInverseEffortPrecision();

    console.log('\n🎉 All tests completed!');
    console.log('\nTo run comprehensive Jest tests, use: npm test');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runScenarioA,
  testSubstitution,
  testCompletion,
  testTimeGating,
  testNoMicroConflicts,
  testInverseEffortPrecision,
};
