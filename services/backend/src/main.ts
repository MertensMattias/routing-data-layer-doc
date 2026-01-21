import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { HttpExceptionFilter } from './core/common/filters/http-exception.filter';

/**
 * Validate security-critical environment variables
 */
function validateSecurityConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development mode');
  }

  // Production checks
  if (process.env.NODE_ENV === 'production') {
    // Must have JWT secret
    if (!process.env.AZURE_AD_CLIENT_SECRET && !process.env.JWT_SECRET) {
      errors.push('Production requires AZURE_AD_CLIENT_SECRET or JWT_SECRET');
    }

    // Must NOT have mock auth enabled
    if (process.env.USE_MOCK_AUTH === 'true') {
      errors.push(
        '🚨 CRITICAL: USE_MOCK_AUTH=true in production! This is a security vulnerability!',
      );
    }

    // Should have Azure AD configured
    if (!process.env.AZURE_AD_CLIENT_ID || !process.env.AZURE_AD_TENANT_ID) {
      warnings.push('Azure AD not configured. Using JWT_SECRET for authentication.');
    }

    // Check for default secrets
    if (process.env.JWT_SECRET === 'change-this-to-a-secure-random-string-in-production') {
      errors.push('🚨 CRITICAL: Using default JWT_SECRET in production!');
    }
  }

  // Development checks
  if (process.env.NODE_ENV === 'development') {
    if (process.env.USE_MOCK_AUTH === 'true') {
      console.log('ℹ️  Mock authentication enabled for development');
    }
  }

  // Log warnings
  warnings.forEach((warning) => console.warn(`⚠️  ${warning}`));

  // Fail on errors
  if (errors.length > 0) {
    console.error('❌ Security configuration errors:');
    errors.forEach((error) => console.error(`   ${error}`));
    throw new Error('Application startup blocked due to security configuration errors');
  }
}

async function bootstrap() {
  // Validate security configuration before starting
  validateSecurityConfig();
  const app = await NestFactory.create(AppModule);

  // Security headers (configured to allow Swagger CDN)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
        },
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for import compatibility
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Root route - redirect to API documentation
  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/api/docs');
  });

  // Favicon handler - return 204 No Content to prevent 404 errors
  app.getHttpAdapter().get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });

  // Global API prefix for all routes except Swagger docs
  // Note: Configuration controllers use explicit 'api/v1/config/*' paths
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json', 'api/docs-yaml'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('IVR Routing Data Layer API')
    .setDescription('API for managing IVR routing tables, call flow segments, and messages')
    .setVersion('1.0')
    .addServer('/api/v1', 'API v1')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints (dev mode)')
    .addTag('company-project', 'Company project configuration management')
    .addTag('config-language', 'System-wide language configuration (global-admin only)')
    .addTag('config-voice', 'TTS voice configuration (global-admin only)')
    .addTag('config-message-category', 'Message category configuration (global-admin only)')
    .addTag('config-message-type', 'Message type configuration (global-admin only)')
    .addTag('config-segment-type', 'Segment type configuration (global-admin only)')
    .addTag('config-key-type', 'Configuration key type definitions (global-admin only)')
    .addTag('routing-table', 'Routing table entry point resolution and ChangeSet workflow')
    .addTag('segment-store', 'Call flow segment definitions and graph management')
    .addTag('message-store', 'Multi-language versioned message management')
    .addTag('audit', 'Audit log querying and export (admin only)')
    .addTag('admin', 'System administration endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'IVR Routing Data Layer API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
    },
    // Use CDN for Swagger UI assets (best practice for production)
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js',
    ],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
