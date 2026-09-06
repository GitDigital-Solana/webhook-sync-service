import axios from 'axios';
import { Database } from '../storage/database';
import { WebhookEvent, SyncLog } from '../storage/models';
import { config } from '../config';

export class SyncProcessor {
  constructor(private db: Database) {}

  async processBatch(events: WebhookEvent[]): Promise<void> {
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      const response = await axios.post(
        `${config.targetApiUrl}/webhooks/sync`,
        {
          eventId: event.id,
          source: event.source,
          eventType: event.eventType,
          payload: event.payload,
          receivedAt: event.receivedAt,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.targetApiKey}`,
          },
          timeout: 30000,
        }
      );

      await this.db.saveSyncLog({
        eventId: event.id,
        targetEndpoint: `${config.targetApiUrl}/webhooks/sync`,
        status: 'success',
        responseCode: response.status,
        responseBody: JSON.stringify(response.data),
        syncedAt: new Date(),
      });

      await this.db.markEventSynced(event.id, 'completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseCode = axios.isAxiosError(error) ? error.response?.status : undefined;

      await this.db.saveSyncLog({
        eventId: event.id,
        targetEndpoint: `${config.targetApiUrl}/webhooks/sync`,
        status: 'failed',
        responseCode,
        responseBody: axios.isAxiosError(error) ? JSON.stringify(error.response?.data) : undefined,
        syncedAt: new Date(),
        error: errorMessage,
      });

      await this.db.markEventSynced(event.id, 'failed', errorMessage);
    }
  }
}