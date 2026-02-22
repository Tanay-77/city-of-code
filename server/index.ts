import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { repoRouter } from './routes/repo';
import { errorHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET'],
  credentials: true,
}));
app.use(express.json());
app.use(globalRateLimiter);

// Routes
app.use('/api', repoRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Codebase City API running on http://localhost:${PORT}`);
});

export default app;
