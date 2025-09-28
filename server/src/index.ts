import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Vita-AI Smart Task Manager API',
    version: '1.0.0',
    endpoints: {
      recommendations: 'GET /api/recommendations',
      complete_task: 'POST /api/actions/complete',
      dismiss_task: 'POST /api/actions/dismiss',
      metrics: 'GET/POST /api/metrics',
      admin: '/api/admin/*',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Vita-AI Server is running on port ${PORT}`);
});
