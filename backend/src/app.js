import express from 'express';
import cors from 'cors'
import influencerRoutes from './api/influencer.routes.js'; 

const app = express();

//middlewar setup
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/influencers', influencerRoutes);

export default app;