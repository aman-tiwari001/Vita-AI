# Vita-AI Smart Task Manager

A full-stack application that provides personalized wellness task recommendations based on user metrics and a sophisticated scoring algorithm. Built as a backend-heavy solution with intelligent task prioritization and adaptive user behavior analysis.


**📌 Frontend:** [View Live](https://vita-ai-hub.vercel.app/) | **Backend (API Server):** [Access Live](https://vita-ai-server.vercel.app/)  


<img width="1919" height="864" alt="image" src="https://github.com/user-attachments/assets/6a89bd29-b209-4907-a957-de86f686a027" />


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
│   ├── services/                 # Core app logic
│   │   ├── scoringEngine.ts      # Deterministic task scoring algorithm
│   │   ├── taskService.ts        # Task lifecycle management service
│   │   ├── userService.ts        # User metrics management service
│   │   └── dailyResetService.ts 	# Automatic daily reset service
│   ├── routes/
│   │   └── api.ts                # RESTful API endpoints
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── index.ts                  # Express server setup
└──  tests/                       # Unit tests (Jest)
	├── api.test.ts                 # API endpoint tests
	├── scoringEngine.test.ts       # Scoring engine tests
	└── taskService.test.ts         # Task service tests

```

### Frontend Architecture (React + TypeScript + Tailwind CSS)

```
client/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── TaskCard.tsx      # Individual task card
│   │   ├── MetricsPanel.tsx  # User metrics panel with status
|   |   └── Topbar.tsx        # Navbar with app logo and title
│   │
│   ├── services/
│   │   └── api.ts            # HTTP client
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
npm run format   # Format code with Prettier
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
4. **Daily Reset**: Automatic reset on date change

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
✅ **Comprehensive testing** with unit tests using Jest
✅ **Detailed documentation** with setup instructions

_Built by Aman Tiwari with ❤️_
