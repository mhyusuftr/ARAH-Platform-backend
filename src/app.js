import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Routes
import assessmentRoutes from './routes/assessment.js';
import adminRoutes from './routes/admin.js';
import { supabase } from './utils/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assessment', assessmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Platform ARAH API is running' });
});

// Start server (no MongoDB dependency)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Using Supabase as database backend');
});

export default app;
