import express from 'express';
import cors from 'cors'
import mongoose from 'mongoose';
import influencerRoutes from './api/influencer.routes.js'; 

const app = express();

//middlewar setup
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({ 
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

app.use('/api/influencers', influencerRoutes);

export default app;