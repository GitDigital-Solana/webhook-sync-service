import { Database } from '../storage/database';
import { SyncProcessor } from './processor';
import { config } from '../config';

export class SyncEngine {
  private processor: SyncProcessor;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(private db: Database) {
    this.processor = new SyncProcessor(db);
  }

  start(): void {
    if (this.intervalId) {
      return;
    }

    console.log('Sync engine started');
    this.intervalId = setInterval(async () => {
      await this.runSync();
    }, config.syncIntervalMs);

    // Run immediately on start
    this.runSync();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Sync engine stopped');
    }
  }

  private async runSync(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const events = await this.db.getPendingEvents(config.batchSize);
      if (events.length > 0) {
        console.log(`Processing ${events.length} pending events`);
        await this.processor.processBatch(events);
      }
    } catch (error) {
      console.error('Sync engine error:', error);
    } finally {
      this.isRunning = false;
    }
  }
}