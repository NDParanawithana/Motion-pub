import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongoDB, checkMongoStatus, disconnectFromMongoDB } from './db.js';

dotenv.config();

// Express App Initialization
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Attempt initial MongoDB connection
connectToMongoDB().catch((err) => {
  console.warn('⚠️ MongoDB initial connection notice:', err.message);
  console.log('👉 Please ensure your password is set in mp_backend/.env');
});

// MongoDB Connection Check Endpoint
app.get('/api/db-status', async (req, res) => {
  const status = await checkMongoStatus();
  if (status.connected) {
    return res.status(200).json(status);
  } else {
    return res.status(200).json(status); // Return 200 with connected: false so UI can show details
  }
});

// Sample Services Endpoint
app.get('/api/services', (req, res) => {
  res.json([
    { id: 1, title: 'Motion Design & 3D', icon: '✨' },
    { id: 2, title: 'Web Development', icon: '💻' },
    { id: 3, title: 'Brand Identity', icon: '🔮' }
  ]);
});

// Sample Contact Endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Received submission:', { name, email, message });
  res.status(201).json({ success: true, message: 'Message received!' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await disconnectFromMongoDB();
  server.close(() => {
    process.exit(0);
  });
});
