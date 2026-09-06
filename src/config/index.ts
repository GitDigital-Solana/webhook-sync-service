import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  targetApiUrl: process.env.TARGET_API_URL || '',
  targetApiKey: process.env.TARGET_API_KEY || '',
  syncIntervalMs: parseInt(process.env.SYNC_INTERVAL_MS || '5000', 10),
  batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
};