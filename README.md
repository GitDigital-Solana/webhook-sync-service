
# Webhook Sync Service

Integration and Ecosystem team core repo webhook-sync-service.

## Features

- Webhook ingestion with signature verification
- Persistent storage of webhook events
- Asynchronous sync to target API
- Retry logic for failed events
- Health checks and monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (optional)

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
```

Development

```bash
npm run dev
```

Production

```bash
npm run build
npm start
```

API Endpoints

· POST /webhook - Ingest a webhook event
· GET /health - Health check

Environment Variables

See .env.example for all configuration options.

Architecture

The service receives webhook events, stores them in PostgreSQL, and periodically syncs them to a configured target API. Failed events are retried up to 3 times with exponential backoff.

```

### 14. `tests/webhook.test.ts` (basic example)

```typescript
import request from 'supertest';
import express from 'express';
import { createWebhookRoutes } from '../src/webhook/routes';
import { Database } from '../src/storage/database';

// Mock database
jest.mock('../src/storage/database');

describe('Webhook Routes', () => {
  let app: express.Application;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    app = express();
    app.use(express.json());
    app.use('/', createWebhookRoutes(mockDb));
  });

  it('should accept a valid webhook', async () => {
    mockDb.saveEvent.mockResolvedValue({
      id: 'test-id',
      source: 'github',
      eventType: 'push',
      payload: { ref: 'main' },
      receivedAt: new Date(),
      processed: false,
      retryCount: 0,
      status: 'pending',
    });

    const response = await request(app)
      .post('/webhook')
      .set('x-webhook-signature', process.env.WEBHOOK_SECRET || '')
      .send({
        source: 'github',
        eventType: 'push',
        payload: { ref: 'main' },
      });

    expect(response.status).toBe(202);
    expect(response.body.status).toBe('accepted');
  });
});
# webhook-sync-service
Integration and Ecosystem team core repo webhook-sync-service  
