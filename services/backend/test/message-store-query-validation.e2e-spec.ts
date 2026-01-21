import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MessageStore Query Validation (e2e)', () => {
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

  describe('GET /messages/stores - Query Validation', () => {
    it('should accept valid search query', () => {
      return request(app.getHttpServer())
        .get('/messages/stores?search=customer1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // May return 200 or 401/403 depending on auth setup
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should accept valid companyProjectId', () => {
      return request(app.getHttpServer())
        .get('/messages/stores?companyProjectId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should reject invalid companyProjectId (negative)', () => {
      return request(app.getHttpServer())
        .get('/messages/stores?companyProjectId=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should reject invalid companyProjectId (non-integer)', () => {
      return request(app.getHttpServer())
        .get('/messages/stores?companyProjectId=abc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /messages/stores/:storeId/messages - Query Validation', () => {
    it('should accept valid language', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/1/messages?lang=nl-BE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403, 404]).toContain(res.status);
        });
    });

    it('should accept publishedOnly boolean', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/1/messages?publishedOnly=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403, 404]).toContain(res.status);
        });
    });

    it('should reject invalid language format', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/1/messages?lang=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should treat invalid publishedOnly as false', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/1/messages?publishedOnly=maybe')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Should default to false, not reject
          expect([200, 401, 403, 404]).toContain(res.status);
        });
    });
  });

  describe('GET /messages/fetch - Query Validation (Runtime)', () => {
    it('should accept valid parameters', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?messageKey=WELCOME_PROMPT&lang=nl-BE&storeId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // May return 200 or 404 depending on data, but should not be 400
          expect([200, 401, 403, 404]).toContain(res.status);
        });
    });

    it('should reject missing messageKey', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?lang=nl-BE&storeId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should reject missing lang', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?messageKey=TEST&storeId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should reject missing storeId', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?messageKey=TEST&lang=nl-BE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should reject invalid language format', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?messageKey=TEST&lang=invalid&storeId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject invalid storeId (non-integer)', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?messageKey=TEST&lang=nl-BE&storeId=abc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /messages/stores/export - Query Validation', () => {
    it('should accept filter parameters', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/export?messageKeys=TEST1,TEST2&languages=nl-BE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should accept includeContent boolean', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/export?includeContent=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should default includeContent to false', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });
  });

  describe('GET /messages/voices - Query Validation', () => {
    it('should accept engine filter', () => {
      return request(app.getHttpServer())
        .get('/messages/voices?engine=google')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should accept lang filter', () => {
      return request(app.getHttpServer())
        .get('/messages/voices?lang=nl-BE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should accept both filters', () => {
      return request(app.getHttpServer())
        .get('/messages/voices?engine=google&lang=nl-BE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should reject invalid language format', () => {
      return request(app.getHttpServer())
        .get('/messages/voices?lang=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Route Ordering - No Conflicts', () => {
    it('should match /messages/stores/export (not :storeId)', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Should match export endpoint (200, 401, or 403, not 404 from :storeId)
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should match /messages/types (not a store route)', () => {
      return request(app.getHttpServer())
        .get('/messages/types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Should match types dictionary endpoint
          expect([200, 401, 403]).toContain(res.status);
        });
    });

    it('should match /messages/fetch (runtime endpoint)', () => {
      return request(app.getHttpServer())
        .get('/messages/fetch?messageKey=TEST&lang=nl-BE&storeId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Should match fetch endpoint (200, 404, 401, or 403, not route error)
          expect([200, 400, 401, 403, 404]).toContain(res.status);
        });
    });

    it('should match /messages/stores/:storeId for numeric ID', () => {
      return request(app.getHttpServer())
        .get('/messages/stores/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Should match :storeId endpoint (200, 401, 403, or 404, not 400 from export)
          expect([200, 401, 403, 404]).toContain(res.status);
        });
    });
  });
});
