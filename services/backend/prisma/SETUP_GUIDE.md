# SQL Server Setup Guide

Complete guide for configuring SQL Server on a new system using this repository.

## Prerequisites

Before setting up SQL Server, ensure you have:

- **Docker Desktop** (or Docker Engine) installed and running
- **Node.js 18+** and **npm 9+** installed
- **Git** to clone the repository

## Quick Start

From the project root, run:

```bash
# Install all dependencies
npm run install:all

# Complete database setup (starts Docker, generates Prisma client, runs migrations)
npm run db:setup
```

This single command will:
1. Start Docker SQL Server container
2. Wait for database to become healthy
3. Generate Prisma Client
4. Run all migrations
5. Create shadow database for future migrations

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# From project root
npm run install:all
```

This installs dependencies for:
- Root workspace
- Backend service (`services/backend`)
- Shared package (`services/shared`)
- Frontend (`frontend`)

### Step 2: Configure Environment Variables

Create `.env` file in `services/backend/` directory:

```bash
# Application
NODE_ENV=development
PORT=3001

# Database (Docker SQL Server - local development)
# Note: Port 54321 is the host port mapped from container port 1433
DATABASE_URL="sqlserver://localhost:54321;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=false;trustServerCertificate=true;connectionTimeout=30"

# Shadow database for Prisma migrations (REQUIRED)
# Prisma uses this to test migrations before applying them
SHADOW_DATABASE_URL="sqlserver://localhost:54321;database=routing_data_layer_shadow;user=sa;password=YourStrong@Password123;encrypt=false;trustServerCertificate=true;connectionTimeout=30"

# Security (development only)
JWT_SECRET=dev-secret-key-change-in-production
API_KEYS=dev-api-key

# CORS
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**

- **Port**: Docker maps container port `1433` to host port `54321` (see `infrastructure/docker-compose.yml`)
- **Password**: Default password is `YourStrong@Password123` (change in production)
- **Shadow Database**: Required for Prisma migrations - Prisma uses this to test migrations safely
- **Connection String Format**: SQL Server connection strings use semicolons (`;`) as separators

### Step 3: Start Docker SQL Server

```bash
# From project root
npm run db:start
```

This command:
- Starts the SQL Server 2022 container
- Maps port `54321` (host) to `1433` (container)
- Sets up health checks
- Creates persistent volume for data

**Verify container is running:**

```bash
npm run db:status
```

You should see the `routing-data-sqlserver` container in the output.

### Step 4: Wait for Database to be Healthy

```bash
npm run db:wait
```

This command polls the container health check until the database is ready (up to 3 minutes).

**Alternative - Check logs:**

```bash
npm run db:logs
```

Look for: `SQL Server is now ready for client connections`

### Step 5: Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client TypeScript types based on `schema.prisma`.

### Step 6: Run Migrations

```bash
npm run prisma:migrate
```

This command:
- Applies all pending migrations from `prisma/migrations/`
- Creates the shadow database if it doesn't exist
- Tests migrations against shadow database first
- Applies migrations to main database

**First-time setup will create:**
- All tables (30 total across cfg, rt, seg, msg schemas)
- All indexes and foreign keys
- Migration history table (`_prisma_migrations`)

## Database Connection Details

### Local Development (Docker)

| Setting | Value |
|---------|-------|
| **Host** | `localhost` |
| **Port** | `54321` (host) → `1433` (container) |
| **Database** | `routing_data_layer` |
| **Username** | `sa` |
| **Password** | `YourStrong@Password123` |
| **Shadow Database** | `routing_data_layer_shadow` |

### Connection String Format

```
sqlserver://HOST:PORT;database=DATABASE_NAME;user=USERNAME;password=PASSWORD;encrypt=false;trustServerCertificate=true;connectionTimeout=30
```

**Parameters:**
- `encrypt=false` - Disable encryption for local Docker (required)
- `trustServerCertificate=true` - Trust self-signed certificates (required for Docker)
- `connectionTimeout=30` - Connection timeout in seconds

### Production (Azure SQL)

For production environments, use Azure SQL connection string:

```bash
DATABASE_URL="sqlserver://SERVER.database.windows.net:1433;database=DB_NAME;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=false;connectionTimeout=30"
SHADOW_DATABASE_URL="sqlserver://SERVER.database.windows.net:1433;database=DB_NAME_shadow;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=false;connectionTimeout=30"
```

**Note:** For Azure SQL:
- Use `encrypt=true` (required)
- Use `trustServerCertificate=false` (use proper certificates)
- Port is always `1433`

## Database Management Commands

### Start/Stop Database

```bash
# Start SQL Server container
npm run db:start

# Stop container (keeps data)
npm run db:stop

# Remove container (deletes data)
npm run db:down

# Check container status
npm run db:status

# View container logs
npm run db:logs
```

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create and apply new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
cd services/backend && npm run prisma:studio

# Reset database (WARNING: deletes all data)
cd services/backend && npm run prisma:reset
```

### Complete Setup (All-in-One)

```bash
# Complete setup: start DB + generate client + run migrations
npm run db:setup
```

## Troubleshooting

### Issue: "Cannot connect to database"

**Symptoms:**
- Error: `Can't reach database server`
- Error: `Connection timeout`

**Solutions:**

1. **Verify Docker is running:**
   ```bash
   docker ps
   ```
   Should show `routing-data-sqlserver` container

2. **Check container status:**
   ```bash
   npm run db:status
   ```

3. **Check container logs:**
   ```bash
   npm run db:logs
   ```
   Look for errors or "SQL Server is now ready" message

4. **Verify port is correct:**
   - Check `infrastructure/docker-compose.yml` - should be `54321:1433`
   - Check `.env` file - should use port `54321`

5. **Restart container:**
   ```bash
   npm run db:stop
   npm run db:start
   npm run db:wait
   ```

### Issue: "Shadow database connection failed"

**Symptoms:**
- Error: `Can't reach shadow database server`
- Migration fails with shadow database error

**Solutions:**

1. **Verify SHADOW_DATABASE_URL is set:**
   ```bash
   # Check .env file in services/backend/
   cat services/backend/.env | grep SHADOW_DATABASE_URL
   ```

2. **Create shadow database manually (if needed):**
   ```sql
   -- Connect to SQL Server and run:
   CREATE DATABASE routing_data_layer_shadow;
   ```

3. **Use same connection string format:**
   - Shadow database should use same host/port as main database
   - Only database name should differ

### Issue: "Migration already applied"

**Symptoms:**
- Error: `Migration X already applied`
- Migration history mismatch

**Solutions:**

1. **Check migration status:**
   ```bash
   cd services/backend
   npx prisma migrate status
   ```

2. **Reset database (WARNING: deletes all data):**
   ```bash
   cd services/backend
   npm run prisma:reset
   ```

3. **Mark migration as applied (if migration was applied manually):**
   ```bash
   cd services/backend
   npx prisma migrate resolve --applied MIGRATION_NAME
   ```

### Issue: "Port already in use"

**Symptoms:**
- Error: `Port 54321 is already in use`
- Docker container fails to start

**Solutions:**

1. **Find process using port:**
   ```bash
   # Windows
   netstat -ano | findstr :54321

   # Linux/Mac
   lsof -i :54321
   ```

2. **Change port in docker-compose.yml:**
   ```yaml
   ports:
     - "54322:1433"  # Use different host port
   ```
   Then update `.env` file to use new port

3. **Stop conflicting container:**
   ```bash
   docker ps
   docker stop <container-id>
   ```

### Issue: "Prisma Client not generated"

**Symptoms:**
- TypeScript errors: `Cannot find module '@prisma/client'`
- Import errors in code

**Solutions:**

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Verify Prisma Client exists:**
   ```bash
   ls services/backend/node_modules/.prisma/client
   ```

3. **Reinstall dependencies:**
   ```bash
   cd services/backend
   npm install
   npm run prisma:generate
   ```

## Verification

After setup, verify everything works:

### 1. Check Database Connection

```bash
cd services/backend
npx prisma studio
```

This opens Prisma Studio at `http://localhost:5555` - you should see all tables.

### 2. Check Migration Status

```bash
cd services/backend
npx prisma migrate status
```

Should show: `Database schema is up to date`

### 3. Test Backend Connection

```bash
# Start backend
npm run dev:backend

# In another terminal, check health endpoint
curl http://localhost:3001/api/v1/health/db
```

Should return: `{"status":"ok","database":"connected"}`

## Next Steps

After SQL Server is configured:

1. **Seed database** (optional):
   ```bash
   npm run seeds
   ```

2. **Start development servers:**
   ```bash
   # Backend + Frontend
   npm run dev

   # Or separately
   npm run dev:backend
   npm run dev:frontend
   ```

3. **Access Swagger API docs:**
   - Open `http://localhost:3001/api/docs`

## Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **SQL Server Docker Image**: https://hub.docker.com/_/microsoft-mssql-server
- **Migration Guide**: See `MIGRATION_GUIDE.md` in this directory
- **Complete Schema**: See `COMPLETE_DATABASE_SCHEMA.sql` for full schema reference

## Environment-Specific Configuration

### Development (Local Docker)

- Uses Docker SQL Server 2022
- Port: `54321` (host) → `1433` (container)
- No encryption required
- Self-signed certificates accepted

### Production (Azure SQL)

- Uses Azure SQL Database
- Port: `1433`
- Encryption required (`encrypt=true`)
- Proper SSL certificates required
- Firewall rules must allow your IP

### Staging/Testing

- Can use either Docker or Azure SQL
- Use separate databases per environment
- Use environment-specific connection strings

## Security Notes

**Development:**
- Default password is `YourStrong@Password123` - acceptable for local dev
- No encryption required for local Docker
- Self-signed certificates accepted

**Production:**
- **MUST** change default password
- **MUST** use strong passwords
- **MUST** enable encryption (`encrypt=true`)
- **MUST** use proper SSL certificates
- **MUST** configure firewall rules
- **MUST** use Azure Key Vault or similar for secrets

Never commit `.env` files with production credentials to version control.
