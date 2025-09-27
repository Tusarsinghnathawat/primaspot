import express from 'express';
import cors from 'cors'
import influencerRoutes from './api/influencer.routes.js'; 

const app = express();

//middlewar setup
app.use(cors());
app.use(express.json());

app.use('/api/influencers', influencerRoutes);

export default app;