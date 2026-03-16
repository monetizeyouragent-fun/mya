import db from '@/lib/db';

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000; // 1s, 2s, 4s

interface WebhookPayload {
  type: string;
  [key: string]: unknown;
}

/** Deliver a webhook with retry logic and tracking */
export async function deliverWebhook(
  applicationId: number,
  webhookUrl: string,
  payload: WebhookPayload
): Promise<{ success: boolean; statusCode: number }> {
  const payloadStr = JSON.stringify(payload);
  let lastStatusCode = 0;
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr,
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      lastStatusCode = res.status;
      const isSuccess = res.status >= 200 && res.status < 300;

      // Log delivery
      try {
        let responseBody = '';
        try { responseBody = (await res.text()).slice(0, 500); } catch {}
        await db.execute({
          sql: `INSERT INTO webhook_deliveries (application_id, webhook_url, payload, attempt, status_code, response_body, success) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [applicationId, webhookUrl, payloadStr, attempt, lastStatusCode, responseBody, isSuccess ? 1 : 0],
        });
      } catch {
        // Logging is non-critical
      }

      if (isSuccess) {
        return { success: true, statusCode: lastStatusCode };
      }

      // Server error — retry
      if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
        continue;
      }

      // Client error (4xx) — don't retry
      return { success: false, statusCode: lastStatusCode };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error';
      lastStatusCode = 0;

      // Log failed attempt
      try {
        await db.execute({
          sql: `INSERT INTO webhook_deliveries (application_id, webhook_url, payload, attempt, status_code, success, error) VALUES (?, ?, ?, ?, 0, 0, ?)`,
          args: [applicationId, webhookUrl, payloadStr, attempt, lastError],
        });
      } catch {
        // Non-critical
      }

      if (attempt < MAX_ATTEMPTS) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
        continue;
      }
    }
  }

  return { success: false, statusCode: lastStatusCode };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
