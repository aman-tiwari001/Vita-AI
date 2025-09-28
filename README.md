# Vita-AI
Smart Task Manager

## Project Structure

### Client
- **Location**: `/client`
- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **Additional packages**: axios, react-router-dom, react-icons, react-hot-toast
- **Tools**: ESLint, Prettier

#### Client Scripts
```bash
cd client
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

### Server
- **Location**: `/server`
- **Framework**: Node.js + Express + TypeScript
- **Database**: MongoDB (with Mongoose)
- **Additional packages**: cors, morgan, dotenv, nodemon
- **Tools**: ESLint, Prettier

#### Server Scripts
```bash
cd server
npm run dev         # Start development server with nodemon
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

## Getting Started

1. **Client setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

2. **Server setup**:
   ```bash
   cd server
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the server directory with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vita-ai
NODE_ENV=development
```
