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

app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Image URL is required');
    }
    const response = await fetch(imageUrl, {
      // Some CDNs require a browser-like UA and referer
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/'
      },
      redirect: 'follow'
    });
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }
    const buffer = await response.arrayBuffer();
    
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy image error:', error);
    res.status(500).send('Failed to fetch image');
  }
});

app.use('/api/influencers', influencerRoutes);

export default app;