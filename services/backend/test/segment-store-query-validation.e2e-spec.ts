import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import type { Response } from 'supertest';

describe('SegmentStore Query Validation (e2e)', () => {
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

  describe('GET /segments/search - Query Validation', () => {
    it('should accept valid search query', () => {
      return request(app.getHttpServer())
        .get('/segments/search?q=menu&page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject search query too short', () => {
      return request(app.getHttpServer())
        .get('/segments/search?q=a')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('at least 2 characters');
        });
    });

    it('should reject invalid page number (negative)', () => {
      return request(app.getHttpServer())
        .get('/segments/search?page=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('Page must be at least 1');
        });
    });

    it('should reject invalid page number (non-integer)', () => {
      return request(app.getHttpServer())
        .get('/segments/search?page=abc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('must be an integer');
        });
    });

    it('should reject limit exceeding maximum', () => {
      return request(app.getHttpServer())
        .get('/segments/search?limit=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body.message).toContain('cannot exceed 100');
        });
    });

    it('should cap limit to maximum (100)', () => {
      return request(app.getHttpServer())
        .get('/segments/search?limit=150')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Should reject, not cap
    });

    it('should use default values when not provided', () => {
      return request(app.getHttpServer())
        .get('/segments/search?q=menu')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(50);
        });
    });
  });

  describe('GET /segments/flows/:routingId/export - Boolean Validation', () => {
    it('should accept includeMessages=true', () => {
      return request(app.getHttpServer())
        .get('/segments/flows/TEST-ROUTING/export?includeMessages=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should accept includeMessages=false', () => {
      return request(app.getHttpServer())
        .get('/segments/flows/TEST-ROUTING/export?includeMessages=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should default to false when not provided', () => {
      return request(app.getHttpServer())
        .get('/segments/flows/TEST-ROUTING/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should treat invalid boolean as false', () => {
      return request(app.getHttpServer())
        .get('/segments/flows/TEST-ROUTING/export?includeMessages=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should not reject, just defaults to false
    });
  });

  describe('POST /segments/flows/:routingId/import - Boolean Validation', () => {
    const validFlowData = {
      routingId: 'TEST-ROUTING',
      flowData: {
        version: '1.0.0',
        routingId: 'TEST-ROUTING',
        segments: [],
      },
    };

    it('should accept overwrite=true', () => {
      return request(app.getHttpServer())
        .post('/segments/flows/TEST-ROUTING/import?overwrite=true')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validFlowData)
        .expect(200);
    });

    it('should accept validateOnly=true', () => {
      return request(app.getHttpServer())
        .post('/segments/flows/TEST-ROUTING/import?validateOnly=true')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validFlowData)
        .expect(200);
    });

    it('should default to false when not provided', () => {
      return request(app.getHttpServer())
        .post('/segments/flows/TEST-ROUTING/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validFlowData)
        .expect(200);
    });
  });

  describe('Route Ordering - No Conflicts', () => {
    it('should match /segments/search (not /:id)', () => {
      return request(app.getHttpServer())
        .get('/segments/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should match search endpoint
    });

    it('should match /segments/types/all (not /:id)', () => {
      return request(app.getHttpServer())
        .get('/segments/types/all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should match types endpoint
    });

    it('should match /segments/:id for valid UUID', () => {
      return request(app.getHttpServer())
        .get('/segments/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res: Response) => {
          // Should match :id endpoint (404 if not exists, not 200 from search)
          expect([200, 404]).toContain(res.status);
        });
    });
  });
});
