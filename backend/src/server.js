import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.config.js';

const PORT = process.env.PORT || 8000;

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Keep the process alive but log the error
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    // Keep the process alive but log the error
});

const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();
        
        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        // Attempt to restart in case of failure
        setTimeout(startServer, 5000);
    }
};

startServer();
