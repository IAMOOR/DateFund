import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.ts';
import { setCustomTokenVerifierForTesting } from '../server/auth.ts';
import { MemoryQuotaStore, setCustomQuotaStoreForTesting } from '../server/rateLimit.ts';

describe('AI Endpoints Security & Rate Limiting', () => {
  let app: any;

  beforeEach(() => {
    setCustomQuotaStoreForTesting(new MemoryQuotaStore());
    app = createApp();
  });

  describe('Authentication & Identity Verification', () => {
    it('rejects requests without Authorization header with 401', async () => {
      const res = await request(app)
        .post('/api/ai/suggest-date')
        .send({ goals: [], events: [] });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects requests with malformed Authorization header with 401', async () => {
      const res = await request(app)
        .post('/api/ai/suggest-date')
        .set('Authorization', 'Basic invalid-creds')
        .send({ goals: [], events: [] });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects invalid or forged Firebase ID tokens with 401', async () => {
      setCustomTokenVerifierForTesting(async () => {
        throw new Error('Firebase ID token has invalid signature');
      });

      const res = await request(app)
        .post('/api/ai/suggest-date')
        .set('Authorization', 'Bearer forged-token-abc')
        .send({ goals: [], events: [] });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('rejects anonymous or guest accounts from AI routes with 403', async () => {
      setCustomTokenVerifierForTesting(async () => ({
        uid: 'anon_user_123',
        firebase: {
          sign_in_provider: 'anonymous'
        }
      } as any));

      const res = await request(app)
        .post('/api/ai/suggest-date')
        .set('Authorization', 'Bearer anon-token')
        .send({ goals: [], events: [] });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ANONYMOUS_NOT_ALLOWED');
    });
  });

  describe('Request Schema & Body Constraints', () => {
    beforeEach(() => {
      setCustomTokenVerifierForTesting(async () => ({
        uid: 'user_authenticated_1',
        email: 'user@example.com',
        firebase: { sign_in_provider: 'password' }
      } as any));
    });

    it('rejects request exceeding body size limit with 413', async () => {
      // 64kb limit in server.ts
      const largePayload = { goals: [], events: [], largeData: 'x'.repeat(70000) };

      const res = await request(app)
        .post('/api/ai/suggest-date')
        .set('Authorization', 'Bearer valid-token')
        .send(largePayload);

      expect(res.status).toBe(413);
    });

    it('rejects stream request with empty prompt with 400', async () => {
      const res = await request(app)
        .post('/api/ai/stream')
        .set('Authorization', 'Bearer valid-token')
        .send({ prompt: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('EMPTY_PROMPT');
    });

    it('rejects stream request with non-string prompt with 400', async () => {
      const res = await request(app)
        .post('/api/ai/stream')
        .set('Authorization', 'Bearer valid-token')
        .send({ prompt: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_PROMPT');
    });

    it('rejects invalid mood for romantic tips with 400', async () => {
      const res = await request(app)
        .post('/api/ai/romantic-tips')
        .set('Authorization', 'Bearer valid-token')
        .send({ mood: 'InvalidMoodCategory' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_SCHEMA');
    });
  });

  describe('Rate Limiting & Quotas', () => {
    it('enforces per-minute user rate limit and returns 429 with Retry-After', async () => {
      setCustomTokenVerifierForTesting(async () => ({
        uid: 'rate_limited_user',
        firebase: { sign_in_provider: 'password' }
      } as any));

      const quotaStore = new MemoryQuotaStore();
      setCustomQuotaStoreForTesting(quotaStore);

      // Simulate reaching the per-minute limit (15 requests/min)
      for (let i = 0; i < 15; i++) {
        await quotaStore.incrementUserCount('rate_limited_user', 60);
      }

      const res = await request(app)
        .post('/api/ai/suggest-date')
        .set('Authorization', 'Bearer valid-token')
        .send({ goals: [], events: [] });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('USER_RATE_LIMIT');
      expect(res.headers['retry-after']).toBe('60');
    });
  });

  describe('Security Headers', () => {
    it('sets protective security headers on all responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Google Maps AI Concierge & Weather Endpoints', () => {
    beforeEach(() => {
      setCustomTokenVerifierForTesting(async () => ({
        uid: 'user_authenticated_maps',
        email: 'maps@example.com',
        firebase: { sign_in_provider: 'password' }
      } as any));
    });

    it('protects /api/ai/map-concierge from unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/ai/map-concierge')
        .send({ prompt: 'Sunset wine & dinner in Stellenbosch' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('returns a structured multi-stop map itinerary for authenticated /api/ai/map-concierge requests', async () => {
      const res = await request(app)
        .post('/api/ai/map-concierge')
        .set('Authorization', 'Bearer valid-token')
        .send({
          prompt: 'Cozy rainy day cafes and fireplace bistro in Cape Town',
          provinceName: 'Western Cape'
        });

      expect(res.status).toBe(200);
      expect(res.body.itineraryTitle).toBeTruthy();
      expect(Array.isArray(res.body.stops)).toBe(true);
      expect(res.body.stops.length).toBeGreaterThan(0);
      expect(typeof res.body.estimatedTotalRand).toBe('number');
    });

    it('validates coordinates on /api/maps/weather and returns weather + SAST sunset times', async () => {
      const badRes = await request(app)
        .post('/api/maps/weather')
        .send({ lat: 195, lng: 18.42 });
      expect(badRes.status).toBe(400);
      expect(badRes.body.code).toBe('INVALID_COORDINATES');

      const okRes = await request(app)
        .post('/api/maps/weather')
        .send({ lat: -33.9249, lng: 18.4241 });
      expect(okRes.status).toBe(200);
      expect(typeof okRes.body.temperatureC).toBe('number');
      expect(typeof okRes.body.sunsetTime).toBe('string');
      expect(typeof okRes.body.goldenHourTime).toBe('string');
      expect(typeof okRes.body.dateSuitabilityNote).toBe('string');
    });
  });
});

