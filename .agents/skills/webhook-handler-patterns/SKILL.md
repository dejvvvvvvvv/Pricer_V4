# Webhook Handler Patterns

Patterns for implementing webhook receivers (preparation for future Variant B).

## When to Use
When implementing webhook endpoints for e-commerce platforms (Shopify, WooCommerce, Stripe).

## Key Patterns

### HMAC Verification
```javascript
import crypto from 'crypto';

function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}
```

### Idempotency
- Store webhook ID (X-Shopify-Webhook-Id) in processed set
- Check before processing: if already seen, return 200 OK immediately
- Use TTL-based storage (24h) to prevent unbounded growth

### Retry Handling
- Shopify retries failed webhooks (non-2xx) up to 19 times over 48 hours
- Always return 200 OK quickly, process async
- Queue webhook payload for background processing

### Error Handling
- Return 200 even if processing fails (to prevent retry storms)
- Log errors for manual investigation
- Dead letter queue for repeatedly failing webhooks

### Security
- Always verify HMAC before processing
- Use timing-safe comparison for HMAC
- Validate webhook topic matches expected handler
- Rate limit webhook endpoint
