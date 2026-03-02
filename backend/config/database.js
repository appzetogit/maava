import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export const connectDB = async () => {
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // 30 sec timeout (was 5 - too short for DNS retries)
    socketTimeoutMS: 75000,          // 75 sec socket timeout
    connectTimeoutMS: 30000,         // 30 sec initial connect timeout
    heartbeatFrequencyMS: 10000,     // Check server health every 10 sec
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10,                 // Connection pool
    minPoolSize: 2,
    family: 4,                       // Use IPv4, skip IPv6 (avoids DNS issues)
  };

  let retryCount = 0;
  const RETRY_DELAY_MS = 5000;

  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
      retryCount = 0; // Reset on success
      return conn;
    } catch (error) {
      retryCount++;
      const isNetworkError = error.message?.includes('ENOTFOUND') ||
        error.message?.includes('EAI_AGAIN') ||
        error.message?.includes('ENOENT') ||
        error.message?.includes('getaddrinfo');

      if (isNetworkError) {
        logger.warn(`⚠️ MongoDB DNS/Network error (attempt ${retryCount}): ${error.message}`);
        logger.warn('💡 Check: 1) Internet connection  2) MongoDB Atlas IP Whitelist (0.0.0.0/0)');
      } else {
        logger.error(`❌ MongoDB connection error: ${error.message}`);
      }

      const delay = Math.min(RETRY_DELAY_MS * retryCount, 30000); // Max 30 sec delay
      logger.info(`🔄 Retrying MongoDB connection in ${delay / 1000} seconds...`);
      setTimeout(connectWithRetry, delay);
    }
  };

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    const isNetworkError = err.message?.includes('ENOTFOUND') ||
      err.message?.includes('EAI_AGAIN') ||
      err.message?.includes('getaddrinfo');
    if (!isNetworkError) {
      logger.error(`🔴 MongoDB error event: ${err}`);
    }
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('🟠 MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('🟢 MongoDB reconnected');
  });

  mongoose.connection.on('connected', () => {
    logger.info('🟢 MongoDB connected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      logger.error(`Error during MongoDB closure: ${err.message}`);
      process.exit(1);
    }
  });

  return await connectWithRetry();
};

export default connectDB;

