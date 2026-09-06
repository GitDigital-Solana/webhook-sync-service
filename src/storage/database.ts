import { Pool } from 'pg';
import { config } from '../config';
import { WebhookEvent, SyncLog } from './models';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export class Database {
  async init(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id VARCHAR(36) PRIMARY KEY,
          source VARCHAR(255) NOT NULL,
          event_type VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          received_at TIMESTAMP NOT NULL,
          processed BOOLEAN DEFAULT FALSE,
          synced_at TIMESTAMP,
          retry_count INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          error TEXT
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS sync_logs (
          id VARCHAR(36) PRIMARY KEY,
          event_id VARCHAR(36) REFERENCES webhook_events(id),
          target_endpoint VARCHAR(500) NOT NULL,
          status VARCHAR(50) NOT NULL,
          response_code INTEGER,
          response_body TEXT,
          synced_at TIMESTAMP NOT NULL,
          error TEXT
        );
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
        CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
      `);
    } finally {
      client.release();
    }
  }

  async saveEvent(event: Omit<WebhookEvent, 'id' | 'receivedAt'>): Promise<WebhookEvent> {
    const id = crypto.randomUUID();
    const receivedAt = new Date();
    const result = await pool.query(
      `INSERT INTO webhook_events (id, source, event_type, payload, received_at, processed, retry_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, event.source, event.eventType, event.payload, receivedAt, false, 0, 'pending']
    );
    return this.mapRowToEvent(result.rows[0]);
  }

  async getPendingEvents(limit: number): Promise<WebhookEvent[]> {
    const result = await pool.query(
      `SELECT * FROM webhook_events 
       WHERE status = 'pending' OR (status = 'failed' AND retry_count < 3)
       ORDER BY received_at ASC LIMIT $1`,
      [limit]
    );
    return result.rows.map(this.mapRowToEvent);
  }

  async markEventSynced(id: string, status: 'completed' | 'failed', error?: string): Promise<void> {
    await pool.query(
      `UPDATE webhook_events 
       SET status = $1, processed = $2, synced_at = $3, error = $4, retry_count = retry_count + 1
       WHERE id = $5`,
      [status, status === 'completed', new Date(), error || null, id]
    );
  }

  async saveSyncLog(log: Omit<SyncLog, 'id'>): Promise<SyncLog> {
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO sync_logs (id, event_id, target_endpoint, status, response_code, response_body, synced_at, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, log.eventId, log.targetEndpoint, log.status, log.responseCode || null, log.responseBody || null, log.syncedAt, log.error || null]
    );
    return result.rows[0];
  }

  private mapRowToEvent(row: any): WebhookEvent {
    return {
      id: row.id,
      source: row.source,
      eventType: row.event_type,
      payload: row.payload,
      receivedAt: row.received_at,
      processed: row.processed,
      syncedAt: row.synced_at,
      retryCount: row.retry_count,
      status: row.status,
      error: row.error,
    };
  }

  async close(): Promise<void> {
    await pool.end();
  }
}