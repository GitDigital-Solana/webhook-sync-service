import express from 'express';
import cors from 'cors';
import { createWebhookRoutes } from './webhook/routes';
import { Database } from './storage/database';
import { SyncEngine } from './sync/engine';
import { config } from './config';

export class Server {
  private app: express.Application;
  private db: Database;
  private syncEngine: SyncEngine;

  constructor() {
    this.app = express();
    this.db = new Database();
    this.syncEngine = new SyncEngine(this.db);
  }

  async start(): Promise<void> {
    // Initialize database
    await this.db.init();
    console.log('Database initialized');

    // Middleware
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));

    // Routes
    this.app.use('/', createWebhookRoutes(this.db));

    // Start sync engine
    this.syncEngine.start();

    // Start server
    this.app.listen(config.port, () => {
      console.log(`Webhook sync service running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Sync interval: ${config.syncIntervalMs}ms`);
    });
  }

  async stop(): Promise<void> {
    this.syncEngine.stop();
    await this.db.close();
    console.log('Server stopped');
  }
}