import { db } from '@/lib/db';
import crypto from 'crypto';

export async function triggerWebhook(event: string, payload: Record<string, unknown>) {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { isActive: true, events: { contains: event } },
  });

  const results = [];
  for (const endpoint of endpoints) {
    const result = await deliverWebhook(endpoint.id, event, payload, endpoint.secret);
    results.push(result);
  }
  return results;
}

export async function deliverWebhook(
  endpointId: string,
  event: string,
  payload: Record<string, unknown>,
  secret?: string
) {
  const endpoint = await db.webhookEndpoint.findUnique({ where: { id: endpointId } });
  if (!endpoint) throw new Error('Endpoint not found');

  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
  const signature = secret ? verifySignature(body, secret) : '';

  let statusCode = 0;
  let responseText = '';
  let success = false;
  let retries = 0;

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-ID': endpointId,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    statusCode = res.status;
    responseText = await res.text().catch(() => '');
    success = statusCode >= 200 && statusCode < 300;

    if (!success && endpoint.failureCount < 3) {
      retries = 1;
    }
  } catch (err) {
    statusCode = 0;
    responseText = String(err);
    success = false;
  }

  await db.webhookDelivery.create({
    data: {
      endpointId,
      event,
      payload: body,
      statusCode,
      response: responseText.slice(0, 1000),
      success,
      retries,
      deliveredAt: success ? new Date() : null,
    },
  });

  // Update endpoint stats
  await db.webhookEndpoint.update({
    where: { id: endpointId },
    data: {
      lastTriggered: new Date(),
      failureCount: success ? 0 : { increment: 1 },
      isActive: endpoint.failureCount >= 4 && !success ? false : true,
    },
  });

  return { endpointId, success, statusCode };
}

export function verifySignature(payload: string, secret: string, signature?: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = `sha256=${hmac.digest('hex')}`;
  if (signature) {
    return computed === signature ? 'valid' : 'invalid';
  }
  return computed;
}
