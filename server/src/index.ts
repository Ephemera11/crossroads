import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import sessionRoutes from './routes/sessions';
import { healthCheck } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', healthCheck);

// Session routes
app.use('/api/sessions', sessionRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Crossroads server running on http://localhost:${PORT}`);
});