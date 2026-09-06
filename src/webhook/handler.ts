import { Request, Response } from 'express';
import { Database } from '../storage/database';
import { config } from '../config';

export class WebhookHandler {
  constructor(private db: Database) {}

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook secret
      const signature = req.headers['x-webhook-signature'];
      if (!signature || signature !== config.webhookSecret) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const { source, eventType, payload } = req.body;
      if (!source || !eventType) {
        res.status(400).json({ error: 'Missing source or eventType' });
        return;
      }

      const event = await this.db.saveEvent({
        source,
        eventType,
        payload: payload || {},
        processed: false,
        retryCount: 0,
        status: 'pending',
      });

      res.status(202).json({ 
        status: 'accepted', 
        id: event.id,
        message: 'Webhook event queued for sync'
      });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({ status: 'ok', service: 'webhook-sync-service' });
  }
}