const mongoose = require('mongoose');

let memoryMongoServer = null;

const connectDB = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_event_db';
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 1200,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB Warning] Primary MongoDB not reachable at ${mongoUri}`);
    
    if (process.env.USE_MEMORY_DB_FALLBACK === 'true' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      try {
        console.log('[MongoDB Fallback] Starting embedded In-Memory MongoDB engine...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        if (!memoryMongoServer) {
          memoryMongoServer = await MongoMemoryServer.create();
        }
        const inMemoryUri = memoryMongoServer.getUri('college_event_db');
        
        const conn = await mongoose.connect(inMemoryUri);
        console.log(`[MongoDB] In-Memory Database connected at: ${inMemoryUri}`);
        return conn;
      } catch (fallbackErr) {
        console.error('[MongoDB Error] Failed to start fallback MongoDB:', fallbackErr.message);
        throw fallbackErr;
      }
    } else {
      console.error('[MongoDB Error] Connection failed:', err.message);
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (memoryMongoServer) {
    await memoryMongoServer.stop();
  }
};

module.exports = { connectDB, closeDB };
