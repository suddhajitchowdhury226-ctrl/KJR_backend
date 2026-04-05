const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const apiRoutes = require('./routes/api');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:3000',
      'null', // file:// pages send "null" as origin string
    ];
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { MongoMemoryServer } = require('mongodb-memory-server');

// Connect to MongoDB with Atlas → in-memory fallback
async function connectDB() {
  const atlasUri = process.env.MONGODB_URI;

  // First try: Atlas (with 8-second connection timeout)
  if (atlasUri && !atlasUri.includes('YOUR_USER')) {
    try {
      console.log('Attempting to connect to MongoDB Atlas...');
      await mongoose.connect(atlasUri, {
        serverSelectionTimeoutMS: 8000,  // fail fast if Atlas unreachable
        socketTimeoutMS: 10000
      });
      console.log('✅ MongoDB Atlas connected successfully');
      return;
    } catch (err) {
      console.warn('⚠️  Atlas connection failed:', err.message);
      console.warn('⚡ Falling back to in-memory MongoDB for local development...');
      // Disconnect any partial connection
      try { await mongoose.disconnect(); } catch {}
    }
  }

  // Fallback: In-memory MongoDB (works offline, data resets on restart)
  try {
    const mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅ In-memory MongoDB connected successfully (data resets on restart)');
    console.log('   → To persist data, fix your MONGODB_URI in .env and ensure your IP is whitelisted on Atlas.');
  } catch (memErr) {
    console.error('❌ In-memory MongoDB also failed:', memErr.message);
  }
}

connectDB();

// Routes
app.use('/api', apiRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 KJR Backend running on http://localhost:${PORT}`);
});
