export interface Env {
  // Secrets
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  SUPER_ADMINS: string; // comma-separated user IDs

  // Vars
  BOT_USERNAME: string;
  LOG_LEVEL: string;

  // Bindings
  DB: D1Database;
  KV: KVNamespace;
  TASK_QUEUE: Queue<import('./types').TaskPayload>;
}
