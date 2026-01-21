# Infrastructure Configuration

This directory contains deployment and infrastructure configuration files.

## Docker Compose

### Local Development

For local development with Docker:

```bash
# Start all services (SQL Server, backend, frontend)
docker-compose up

# Or start only SQL Server
docker-compose up sqlserver -d
```

**Services:**

- **SQL Server** - Port 14330 (mapped from container port 1433)
- **Backend** - Port 3001
- **Frontend** - Port 3000

### SQL Server Container

The Docker Compose file includes a SQL Server 2022 container for local development:

- **Container name**: `routing-data-sqlserver`
- **Image**: `mcr.microsoft.com/mssql/server:2022-latest`
- **Port**: `14330:1433` (host:container)
- **Database**: `routing_data_layer`
- **Username**: `sa`
- **Password**: `YourStrong@Password123` (change in docker-compose.yml for production)
- **Data persistence**: Volume `sqlserver-data`

**Using npm scripts (recommended):**

```bash
# Start SQL Server
npm run db:start

# Check status
npm run db:status

# View logs
npm run db:logs

# Stop SQL Server
npm run db:stop
```

## Azure Deployment

### App Service

Use the ARM template in `azure/app-service.template.json` to deploy backend services.

### Environment Variables

Set these in Azure Portal or via Azure CLI:

**Backend:**

- `DATABASE_URL` - SQL Server connection string (Docker local or Azure SQL for production)
- `AZURE_AD_TENANT_ID` - Azure AD tenant
- `AZURE_AD_CLIENT_ID` - Azure AD app client ID
- `AZURE_AD_CLIENT_SECRET` - Azure AD app secret
- `PORT` - Set to 8080 for Azure App Service

**Frontend:**

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` - Azure AD client ID

### API Management Integration

Configure Azure API Management to route requests:

- Backend APIs: Route to App Service backend
- Frontend: Route to Static Web App or App Service frontend

## Database Migrations

For production deployments:

```bash
cd services/backend
npm run prisma:deploy
```

This runs migrations without creating new ones (for CI/CD).

