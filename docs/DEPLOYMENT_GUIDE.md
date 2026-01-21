# Deployment Guide

Production deployment guide for the IVR Routing Data Layer.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Build Process](#build-process)
- [Docker Deployment](#docker-deployment)
- [Azure Deployment](#azure-deployment)
- [Database Migrations](#database-migrations)
- [Monitoring](#monitoring)

## Environment Setup

### Production Environment Variables

#### Backend (.env.production)

```env
# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Database
DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=routing_data_layer;user=admin;password=<strong-password>;encrypt=true"

# Authentication (Azure AD/Okta)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_SECRET=your-client-secret
JWT_SECRET=<generate-strong-secret-key>

# CRITICAL: Disable mock auth in production
USE_MOCK_AUTH=false

# Logging
LOG_LEVEL=info
```

#### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend-domain.com/api/v1
VITE_AUTH_MODE=production
```

### Security Configuration Checklist

- ✅ Strong JWT secret (min 32 characters, random)
- ✅ `USE_MOCK_AUTH=false`
- ✅ HTTPS enabled
- ✅ Azure AD credentials configured
- ✅ Database password is strong
- ✅ CORS limited to frontend domain
- ✅ Rate limiting enabled
- ✅ Helmet security headers active

## Build Process

### Backend Build

```bash
cd services/backend

# Install dependencies
npm install --production=false

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Output: services/backend/dist/
```

### Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output: frontend/dist/
```

### Build Verification

```bash
# Verify backend
cd services/backend
npm run build
npm run verify

# Verify frontend
cd frontend
npm run build
npm run type-check
```

## Docker Deployment

### Docker Compose

[infrastructure/docker-compose.yml](../infrastructure/docker-compose.yml):

```yaml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: routing-data-sqlserver
    ports:
      - "54321:1433"
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: YourStrong@Password123
      MSSQL_PID: Developer
    volumes:
      - sqlserver-data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Password123 -Q "SELECT 1"
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ../services/backend
      dockerfile: ../../infrastructure/Dockerfile.backend
    container_name: routing-data-backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: "sqlserver://sqlserver:1433;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=true;trustServerCertificate=true"
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      AZURE_AD_CLIENT_ID: ${AZURE_AD_CLIENT_ID}
      AZURE_AD_TENANT_ID: ${AZURE_AD_TENANT_ID}
      AZURE_AD_CLIENT_SECRET: ${AZURE_AD_CLIENT_SECRET}
    depends_on:
      sqlserver:
        condition: service_healthy

  frontend:
    build:
      context: ../frontend
      dockerfile: ../infrastructure/Dockerfile.frontend
    container_name: routing-data-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  sqlserver-data:

networks:
  default:
    name: app-network
```

### Backend Dockerfile

[infrastructure/Dockerfile.backend](../infrastructure/Dockerfile.backend):

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Run migrations and start
CMD npx prisma migrate deploy && node dist/main.js
```

### Frontend Dockerfile

[infrastructure/Dockerfile.frontend](../infrastructure/Dockerfile.frontend):

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f infrastructure/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f

# Stop services
docker-compose -f infrastructure/docker-compose.yml down

# Rebuild after changes
docker-compose -f infrastructure/docker-compose.yml up -d --build
```

## Azure Deployment

### Azure Resources

Required Azure resources:
- **Azure App Service** (2x): Backend and Frontend
- **Azure SQL Database**: SQL Server database
- **Azure Key Vault**: Store secrets
- **Azure Application Insights**: Monitoring

### Azure SQL Database Setup

```bash
# Create resource group
az group create --name rg-routing-data-layer --location westeurope

# Create SQL Server
az sql server create \
  --name sql-routing-data-layer \
  --resource-group rg-routing-data-layer \
  --location westeurope \
  --admin-user sqladmin \
  --admin-password <strong-password>

# Create database
az sql db create \
  --name routing_data_layer \
  --server sql-routing-data-layer \
  --resource-group rg-routing-data-layer \
  --service-objective S1

# Configure firewall (allow Azure services)
az sql server firewall-rule create \
  --server sql-routing-data-layer \
  --resource-group rg-routing-data-layer \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Backend App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name asp-routing-data-backend \
  --resource-group rg-routing-data-layer \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name app-routing-data-backend \
  --resource-group rg-routing-data-layer \
  --plan asp-routing-data-backend \
  --runtime "NODE:18-lts"

# Configure environment variables
az webapp config appsettings set \
  --name app-routing-data-backend \
  --resource-group rg-routing-data-layer \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="<connection-string>" \
    JWT_SECRET="<secret>" \
    AZURE_AD_CLIENT_ID="<client-id>" \
    AZURE_AD_TENANT_ID="<tenant-id>" \
    AZURE_AD_CLIENT_SECRET="<client-secret>"

# Deploy code
cd services/backend
npm run build
az webapp deployment source config-zip \
  --name app-routing-data-backend \
  --resource-group rg-routing-data-layer \
  --src dist.zip
```

### CI/CD Pipeline (GitHub Actions)

[.github/workflows/deploy.yml](.github/workflows/deploy.yml):

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd services/backend
          npm ci

      - name: Build
        run: |
          cd services/backend
          npx prisma generate
          npm run build

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: app-routing-data-backend
          publish-profile: ${{ secrets.AZURE_BACKEND_PUBLISH_PROFILE }}
          package: services/backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install and Build
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: app-routing-data-frontend
          publish-profile: ${{ secrets.AZURE_FRONTEND_PUBLISH_PROFILE }}
          package: frontend/dist
```

## Database Migrations

### Production Migration Strategy

**CRITICAL**: Always backup before migration!

```bash
# 1. Backup database
az sql db export \
  --server sql-routing-data-layer \
  --name routing_data_layer \
  --admin-user sqladmin \
  --admin-password <password> \
  --storage-key-type StorageAccessKey \
  --storage-key <key> \
  --storage-uri https://<storage-account>.blob.core.windows.net/backups/backup.bacpac

# 2. Run migrations
cd services/backend
npx prisma migrate deploy

# 3. Verify migrations
npx prisma migrate status
```

### Safe Migration Process

1. **Test on Staging First**
2. **Schedule Maintenance Window** (if schema changes are breaking)
3. **Backup Database**
4. **Run Migration**
5. **Verify Application**
6. **Monitor Errors**

### Rollback Procedure

If migration fails:

```bash
# Restore from backup
az sql db import \
  --server sql-routing-data-layer \
  --name routing_data_layer \
  --admin-user sqladmin \
  --admin-password <password> \
  --storage-key-type StorageAccessKey \
  --storage-key <key> \
  --storage-uri https://<storage-account>.blob.core.windows.net/backups/backup.bacpac
```

## Monitoring

### Health Check Endpoints

```http
GET /health
GET /health/ready
```

### Application Insights (Azure)

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app ai-routing-data-layer \
  --location westeurope \
  --resource-group rg-routing-data-layer

# Get instrumentation key
az monitor app-insights component show \
  --app ai-routing-data-layer \
  --resource-group rg-routing-data-layer \
  --query instrumentationKey
```

Add to backend environment:

```env
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=<key>
```

### Logging

Backend logs to stdout (captured by Azure/Docker):

```typescript
console.log('INFO:', message);
console.error('ERROR:', error);
```

### Metrics to Monitor

- **API Response Time**: p50, p95, p99
- **Error Rate**: 4xx and 5xx responses
- **Database Query Time**: Slow query detection
- **Active Connections**: Database connection pool
- **Memory Usage**: Node.js heap size
- **CPU Usage**: Process CPU percentage

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development setup
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database migrations
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Backend architecture
- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Frontend build
