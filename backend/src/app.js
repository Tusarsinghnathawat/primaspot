import express from 'express';
import cors from 'cors'

const app = express();

//middlewar setup
app.use(cors());
app.use(express.json());

app.use('/api/influencers', influencerRoutes);

export default app;