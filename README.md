# Vita-AI Smart Task Manager

A full-stack application that provides personalized wellness task recommendations based on user metrics and a sophisticated scoring algorithm. Built as a backend-heavy solution with intelligent task prioritization and adaptive user behavior analysis.

## 🎯 Project Overview

Vita-AI is a smart wellness task manager that helps users maintain healthy daily habits by providing contextual, prioritized task recommendations. The system uses a deterministic scoring algorithm to recommend exactly 4 tasks at any time, adapting to user behavior and preferences through intelligent substitution mechanisms.

### Key Philosophy

- **Backend-Heavy Architecture**: Core intelligence resides in the backend
- **Deterministic Behavior**: Same inputs always produce same outputs
- **Anti-Nag Design**: Smart substitution prevents user frustration
- **Real-time Adaptation**: Metrics and task completion drive recommendations

## 🏗️ Project Architecture

### Backend Architecture (Node.js + TypeScript + Express)

```
server/
├── src/
│   ├── services/               # Core Business Logic
│   │   ├── scoringEngine.ts   # Deterministic task scoring algorithm
│   │   ├── taskService.ts     # Task lifecycle management
│   │   ├── userService.ts     # User metrics management
│   │   └── dailyResetService.ts # Automatic daily reset
│   ├── routes/
│   │   └── api.ts             # RESTful API endpoints
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── index.ts               # Express server setup
├── tests/                     # Jest unit tests
└── package.json
```

### Frontend Architecture (React + TypeScript + Tailwind CSS)

```
client/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── TaskCard.tsx      # Individual task display/interaction
│   │   ├── MetricsPanel.tsx  # Real-time metrics with debouncing
|   |   └── Topbar.tsx        # Header with app title and status
│   │
│   ├── services/
│   │   └── api.ts            # HTTP client with type safety
│   ├── types/
│   │   └── api.ts            # Shared TypeScript interfaces
│   └── App.tsx               # Main application component
└── package.json
```

## 🚀 Core Features & Functionality

### 1. **Intelligent Task Scoring Algorithm**

- **Deterministic Scoring**: Consistent results for identical inputs
- **Multi-Factor Analysis**: Urgency, impact, effort, time-of-day, and penalty factors
- **Reference Compliance**: Matches specification test scenarios (4+ decimal precision)

```typescript
score(task) =
	W_urgency * urgencyContribution(task, metrics) +
	W_impact * task.impact_weight +
	W_effort * inverseEffort(task.effort_min) +
	W_tod * timeOfDayFactor(task.time_gate) -
	W_penalty * task.ignores;
```

### 2. **Adaptive Task Substitution**

- **Anti-Nag Mechanism**: Tasks automatically substitute after 3 dismissals
- **Micro-Task Alternatives**: Smaller, more achievable versions (e.g., 500ml → 250ml)
- **Progressive Difficulty**: Reduces barrier to entry when users resist tasks

### 3. **Real-Time Metric Updates**

- **Auto-Update on Completion**: Task completion automatically updates user metrics
- **Debounced Input**: 500ms debouncing prevents API spam while providing instant UI feedback
- **Visual Progress Tracking**: Real-time progress bars for all wellness metrics

### 4. **Daily Reset Automation**

- **Date-Change Detection**: Automatic reset on first request after midnight
- **No Scheduler Required**: Simple, reliable implementation
- **Complete State Reset**: Clears ignores, completions, and dismissals

### 5. **Time-Aware Task Gating**

- **Contextual Recommendations**: Morning/day/evening appropriate tasks
- **Soft Time Gates**: Reduced scoring outside time windows (not exclusion)
- **Dynamic Adaptation**: System relaxes constraints when few tasks available

### 6. **Comprehensive Testing Interface**

- **Reference Scenarios**: Built-in test cases matching specification
- **One-Click Testing**: Easy verification of algorithm behavior
- **Debug Information**: Detailed scoring rationale for development

## 💻 Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Testing**: Jest
- **Development**: Nodemon, ts-node
- **Code Quality**: ESLint, Prettier

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **UI Libraries**: React Icons, React Hot Toast
- **Utilities**: Lodash (debouncing)

### Development Tools

- **Package Manager**: npm
- **Type Safety**: Full TypeScript coverage
- **Hot Reloading**: Both frontend and backend
- **Cross-Platform**: Windows/Mac/Linux compatible

## 🎨 Design Patterns & Architectural Decisions

### 1. **Service Layer Pattern**

```typescript
// Clear separation of concerns
export class TaskService {
	static getRecommendations() {
		/* business logic */
	}
	static completeTask() {
		/* state management */
	}
}
```

**Benefits**: Testable, modular, maintainable code

### 2. **Pure Functions for Scoring**

```typescript
export class ScoringEngine {
	static calculateScore(task, metrics, timeWindow) {
		// No side effects, deterministic output
	}
}
```

**Benefits**: Predictable, testable, cacheable

### 3. **Strategy Pattern for Urgency Calculation**

```typescript
// Different urgency strategies per category
switch (task.category) {
	case 'hydration':
		return (2000 - water_ml) / 2000;
	case 'movement':
		return (8000 - steps) / 8000;
	// ...
}
```

**Benefits**: Extensible, category-specific logic

### 4. **Observer Pattern (React State)**

```typescript
// Automatic UI updates when state changes
const [metrics, setMetrics] = useState();
useEffect(() => fetchRecommendations(), [metrics]);
```

**Benefits**: Reactive UI, automatic synchronization

## ⚖️ Trade-offs & Design Decisions

### 1. **In-Memory Storage vs Database**

**Decision**: In-memory storage  
**Pros**: Zero setup, fast access, simple deployment  
**Cons**: Data loss on restart, no persistence  
**Rationale**: Assessment requirement, prototype-focused

### 2. **Monolithic vs Microservices**

**Decision**: Monolithic Express app  
**Pros**: Simpler deployment, no network overhead  
**Cons**: Less scalable, single point of failure  
**Rationale**: Appropriate for prototype scale

### 3. **Real-time Updates vs Polling**

**Decision**: Manual refresh + auto-refresh on actions  
**Pros**: Simple implementation, lower server load  
**Cons**: Not truly real-time  
**Rationale**: Matches assessment scope

### 4. **Client-side vs Server-side Validation**

**Decision**: Primarily client-side with server backup  
**Pros**: Better UX, reduced server load  
**Cons**: Potential security gaps (acceptable for prototype)

### 5. **Fixed Weights vs Machine Learning**

**Decision**: Fixed algorithmic weights  
**Pros**: Predictable, deterministic, testable  
**Cons**: Less personalized than ML approach  
**Rationale**: Assessment requirements, deterministic scoring

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: For cloning the repository

### 1. Clone Repository

```bash
git clone https://github.com/aman-tiwari001/Vita-AI.git
cd Vita-AI
```

### 2. Backend Setup

```bash
cd server
npm install
npm run dev  # Starts server on http://localhost:5000
```

**Available Scripts:**

```bash
npm run dev      # Development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm run start    # Production server (requires build first)
npm run test     # Run Jest unit tests
npm run lint     # ESLint code analysis
```

### 3. Frontend Setup (New Terminal)

```bash
cd client
npm install
npm run dev  # Starts client on http://localhost:5173
```

**Available Scripts:**

```bash
npm run dev      # Vite development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint analysis
```

### 4. Verify Installation

1. Backend health check: `http://localhost:5000/api/health`
2. Frontend app: `http://localhost:5173`
3. Test API: `http://localhost:5000/api/recommendations`

## 🧪 Testing & Validation

### Automated Testing

```bash
cd server
npm test  # Run Jest unit tests
```

### Manual Testing Scenarios

1. **Algorithm Verification**: Use built-in test scenarios
2. **Metric Updates**: Complete tasks, watch auto-updates
3. **Debouncing**: Rapidly change metrics, observe API batching
4. **Daily Reset**: Use admin panel to trigger reset

### API Testing

```bash
# Get recommendations
curl http://localhost:5000/api/recommendations

# Complete a task
curl -X POST http://localhost:5000/api/actions/complete \
  -H "Content-Type: application/json" \
  -d '{"task_id": "water-500"}'

# Update metrics
curl -X POST http://localhost:5000/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"water_ml": 1000}'
```

## 📊 Core Algorithms

### Urgency Calculation by Category

| Category      | Goal          | Urgency Formula           |
| ------------- | ------------- | ------------------------- |
| **Hydration** | 2000ml        | `(2000 - current) / 2000` |
| **Movement**  | 8000 steps    | `(8000 - current) / 8000` |
| **Sleep**     | 7 hours       | `current < 7 ? 1 : 0`     |
| **Screen**    | 120 min limit | `current > 120 ? 1 : 0`   |
| **Mood**      | 3+ rating     | `current ≤ 2 ? 1 : 0.3`   |

### Scoring Weights

```typescript
const DEFAULT_WEIGHTS = {
	W_urgency: 0.5, // How critical is the need?
	W_impact: 0.3, // How important is this task?
	W_effort: 0.15, // Preference for quick wins
	W_tod: 0.15, // Time appropriateness
	W_penalty: 0.2, // Reduce score for ignored tasks
};
```

## 🎯 API Endpoints

### Core Endpoints

```
GET  /api/recommendations     # Get top 4 task recommendations
POST /api/actions/complete    # Mark task as completed
POST /api/actions/dismiss     # Dismiss task (increment ignores)
GET  /api/metrics            # Get current user metrics
POST /api/metrics            # Update user metrics
GET  /api/health             # Server health check
```

## 🔮 Future Enhancements

### Potential Improvements

1. **Persistent Storage**: Database integration for data persistence
2. **User Accounts**: Multi-user support with authentication
3. **Machine Learning**: Personalized impact weights based on user behavior
4. **Real-time Updates**: WebSocket integration for live updates
5. **Mobile App**: React Native companion app
6. **Analytics Dashboard**: Usage patterns and success metrics
7. **Integration APIs**: Connect with fitness trackers and health apps

## 📝 Assessment Compliance

This implementation fully meets the assessment requirements:

✅ **Deterministic scoring engine** returning exactly 4 tasks  
✅ **Reference scenario accuracy** (4+ decimal places)  
✅ **Task substitution** after 3 dismissals  
✅ **Daily reset** of volatile state  
✅ **Time-of-day gating** with soft constraints  
✅ **No immediate repeats** after dismissal  
✅ **Clean code architecture** with separation of concerns  
✅ **Comprehensive testing** with unit tests and scenarios  
✅ **Detailed documentation** with setup instructions

_Built by Aman Tiwari with ❤️_
