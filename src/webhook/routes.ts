import { Router } from 'express';
import { WebhookHandler } from './handler';
import { Database } from '../storage/database';

export function createWebhookRoutes(db: Database): Router {
  const router = Router();
  const handler = new WebhookHandler(db);

  router.post('/webhook', (req, res) => handler.handleWebhook(req, res));
  router.get('/health', (req, res) => handler.healthCheck(req, res));

  return router;
}