import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.config.js';



const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
});
