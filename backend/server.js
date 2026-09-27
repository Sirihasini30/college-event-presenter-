require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const presenterRoutes = require('./routes/presenterRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const resultRoutes = require('./routes/resultRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Body Parser & URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all origins (supports http://localhost:5000, Live Server, and file://)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve Frontend Static Assets
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'College Event Presenter Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/presenters', presenterRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback to index.html for Frontend Single Page Routing
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl}`
    });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async (customPort) => {
  try {
    const portToUse = customPort || process.env.PORT || 5000;

    const server = app.listen(portToUse, () => {
      console.log('===========================================================');
      console.log(` COLLEGE EVENT PRESENTER MANAGEMENT SYSTEM`);
      console.log(` Server is running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(` URL: http://localhost:${portToUse}`);
      console.log(` API Docs: http://localhost:${portToUse}/api/health`);
      console.log('===========================================================');
    });

    // Connect to database
    try {
      await connectDB();
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Auto-Seed] Database is empty. Running initial dataset generation...');
        const seedData = require('./seed/seedData');
        await seedData();
      }
    } catch (dbErr) {
      console.error('[Database Startup Error]', dbErr.message);
    }

    return server;
  } catch (err) {
    console.error('[Server Error] Startup failed:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
