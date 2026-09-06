export interface WebhookEvent {
  id: string;
  source: string;
  eventType: string;
  payload: Record<string, any>;
  receivedAt: Date;
  processed: boolean;
  syncedAt?: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface SyncLog {
  id: string;
  eventId: string;
  targetEndpoint: string;
  status: 'success' | 'failed';
  responseCode?: number;
  responseBody?: string;
  syncedAt: Date;
  error?: string;
}