import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import type { Response } from 'supertest';

describe('Routing Table Query Validation (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation pipe globally
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    // Get auth token (mock or real)
    authToken = process.env.TEST_AUTH_TOKEN || 'mock-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /routing (listRoutingEntries) - Query Validation', () => {
    it('should accept valid routingId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing?routingId=EEBL-ENERGYLINE-MAIN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          // May return 200 or 401 depending on auth setup
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should accept valid companyProjectId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing?companyProjectId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should reject negative companyProjectId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing?companyProjectId=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('companyProjectId must be at least 1');
        });
    });

    it('should reject non-integer companyProjectId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing?companyProjectId=abc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('companyProjectId must be an integer');
        });
    });

    it('should reject zero companyProjectId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing?companyProjectId=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('companyProjectId must be at least 1');
        });
    });
  });

  describe('GET /routing/entries (listEntries) - Query Validation', () => {
    it('should accept valid routingId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/entries?routingId=EEBL-ENERGYLINE-MAIN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should reject empty routingId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/entries?routingId=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('routingId');
        });
    });

    it('should reject missing routingId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('routingId is required');
        });
    });
  });

  describe('GET /routing/lookup (lookup) - Query Validation', () => {
    it('should accept valid sourceId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/lookup?sourceId=%2B3212345678')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          // May return 200, 404, or 401 depending on data/auth
          expect([200, 404, 401]).toContain(res.status);
        });
    });

    it('should reject empty sourceId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/lookup?sourceId=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('sourceId');
        });
    });

    it('should reject missing sourceId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/lookup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('sourceId is required');
        });
    });
  });

  describe('GET /routing/history (listVersionHistory) - Query Validation', () => {
    it('should accept valid routingId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/history?routingId=EEBL-ENERGYLINE-MAIN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should reject empty routingId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/history?routingId=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('routingId');
        });
    });

    it('should reject missing routingId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('routingId is required');
        });
    });
  });

  describe('Query Parameter Edge Cases', () => {
    it('should handle URL-encoded special characters in sourceId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing/lookup?sourceId=%2B32%20123%20456%2078')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          // Should not fail validation (may fail with 404 if not found)
          expect([200, 404, 401]).toContain(res.status);
        });
    });

    it('should handle very long routingId', () => {
      const longRoutingId = 'A'.repeat(200); // Exceeds reasonable length

      return request(app.getHttpServer())
        .get(`/api/v1/routing?routingId=${longRoutingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          // Should not fail validation (no max length on routingId)
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should handle special characters in routingId', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing?routingId=EEBL-MAIN-TEST%2FSPECIAL')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          expect([200, 401]).toContain(res.status);
        });
    });
  });

  describe('Authorization & Authentication', () => {
    it('should reject request without authorization header', () => {
      return request(app.getHttpServer()).get('/api/v1/routing').expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/routing')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
