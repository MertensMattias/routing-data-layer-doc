# 🚀 Routing Data Layer - Development Guide

> **IVR Configuration Platform** - A full-stack TypeScript monorepo for managing routing tables, call flow segments, and messages.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Development Modes](#-development-modes)
- [Docker Development](#-docker-development)
- [Local Development](#-local-development)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Environment Configuration](#-environment-configuration)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)

## ⚡ Quick Start

### Docker Development (Recommended)

The fastest way to get started with a fully containerized development environment:

```powershell
# From project root or any subdirectory
.\scripts\init\docker-dev.ps1 up
```

This single command will:
- ✅ Check all system requirements
- ✅ Initialize environment files
- ✅ Install dependencies (if needed)
- ✅ Set up the database
- ✅ Start all services with hot-reload

**Access your application:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:3001
- 📚 API Docs: http://localhost:3001/api/docs
- 🗄️ Database: localhost:54321

## 📦 Prerequisites

Before running the development environment, ensure you have:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Docker Desktop** | Latest | Container runtime |
| **Docker Compose** | v2+ | Multi-container orchestration |
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager |
| **PowerShell** | 5.1+ | Script execution (Windows) |

The `docker-dev.ps1` script will automatically check all requirements and prompt you before proceeding.

### Installation Links

- 🐳 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 📦 [Node.js](https://nodejs.org/) (LTS version recommended)

## 🛠️ Development Modes

### 🐳 Docker Development (Recommended)

**Best for:**
- Consistent environment across team members
- Isolated dependencies
- Easy database setup
- Production-like environment

**Features:**
- ✅ Hot-reload for both frontend and backend
- ✅ Automatic container restart on failure
- ✅ Persistent database data
- ✅ Volume mounts for live code editing
- ✅ Automatic initialization

**Quick Commands:**

```powershell
# Start everything (with auto-initialization)
.\scripts\init\docker-dev.ps1 up

# Start in background
.\scripts\init\docker-dev.ps1 up -Detached

# Rebuild images and start
.\scripts\init\docker-dev.ps1 up -Build

# View logs (all services)
.\scripts\init\docker-dev.ps1 logs -Follow

# View specific service logs
.\scripts\init\docker-dev.ps1 logs -Service backend -Follow
.\scripts\init\docker-dev.ps1 logs -Service frontend -Follow

# Restart services
.\scripts\init\docker-dev.ps1 restart

# Stop services
.\scripts\init\docker-dev.ps1 down

# Check status
.\scripts\init\docker-dev.ps1 status

# Open shell in container
.\scripts\init\docker-dev.ps1 shell -Service backend
.\scripts\init\docker-dev.ps1 shell -Service frontend
```

**All Available Actions:**

| Action | Description |
|--------|-------------|
| `up` | Start development environment (default) |
| `down` | Stop all services |
| `restart` | Restart all services |
| `logs` | View logs (use `-Service` to filter) |
| `build` | Build all images |
| `clean` | Remove containers, volumes, and images |
| `status` | Show service status |
| `shell` | Open shell in service (requires `-Service`) |

**Options:**

| Option | Description |
|--------|-------------|
| `-Service <name>` | Target specific service (backend, frontend, sqlserver) |
| `-Build` | Build images before starting |
| `-Detached` | Run in background (`-d` flag) |
| `-Follow` | Follow log output (`-f` flag) |
| `-Init` | Force initialization |
| `-SkipInit` | Skip automatic initialization check |

**Examples:**

```powershell
# Start with build
.\scripts\init\docker-dev.ps1 up -Build -Detached

# View backend logs
.\scripts\init\docker-dev.ps1 logs -Service backend -Follow

# Restart and rebuild
.\scripts\init\docker-dev.ps1 restart -Build

# Clean everything and start fresh
.\scripts\init\docker-dev.ps1 clean
# Then: .\scripts\init\docker-dev.ps1 up -Build
```

### 💻 Local Development

**Best for:**
- Faster iteration (no Docker overhead)
- Direct debugging
- Native performance

**Setup:**

```powershell
# 1. Install dependencies
npm run install:all

# 2. Generate Prisma client
npm run prisma:generate

# 3. Start database (Docker)
npm run db:start
npm run db:wait

# 4. Run migrations
npm run prisma:migrate

# 5. Start development servers
npm run dev
```

**Or use the initialization script:**

```powershell
.\initialize-runtime.ps1
```

This will set up everything automatically.

## 🏗️ Project Structure

```
routing-data-layer-shared/
├── 📁 frontend/                 # React + Vite frontend
│   ├── src/                    # Source code
│   ├── Dockerfile              # Container image
│   └── package.json
│
├── 📁 services/
│   ├── backend/                # NestJS backend API
│   │   ├── src/               # Source code
│   │   ├── prisma/            # Database schema & migrations
│   │   ├── Dockerfile         # Container image
│   │   └── package.json
│   └── shared/                # Shared TypeScript types
│
├── 📁 infrastructure/          # Docker & deployment configs
│   ├── docker-compose.yml     # Development setup
│   └── docker-compose.prod.yml # Production setup
│
├── 📁 scripts/
│   └── init/                  # Automation scripts
│       ├── docker-dev.ps1     # Development automation
│       ├── docker-prod.ps1    # Production automation
│       └── README.md          # This file
│
├── 📁 seeds/                   # Database seed files
└── 📄 package.json            # Root package.json
```

## 📜 Available Scripts

### 🚀 Development

```bash
npm run dev              # Start frontend + backend (local)
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend (with database)
```

### 🗄️ Database

```bash
npm run db:start         # Start SQL Server container
npm run db:stop          # Stop SQL Server container
npm run db:wait          # Wait for database to be ready
npm run db:setup         # Complete setup (start + wait + migrate)
npm run db:status        # Check container status
npm run db:logs          # View container logs
```

### 🔧 Prisma

```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Create and apply migrations
npm run prisma:reset     # Reset database (⚠️ deletes all data)
```

### 🌱 Seeds

```bash
npm run seeds            # Run database seeds
npm run seed:wipe        # Wipe and re-seed database
```

### 🏗️ Build

```bash
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
```

### ✅ Testing & Quality

```bash
npm run lint:backend     # Lint backend code
npm run lint:frontend    # Lint frontend code
npm run test:backend     # Run backend tests
npm run test:frontend    # Run frontend type checking
npm run verify:all       # Run all checks and builds
```

## ⚙️ Environment Configuration

### Backend (`services/backend/.env`)

The `docker-dev.ps1` script automatically creates this file, but you can also create it manually:

```env
NODE_ENV=development
PORT=3001

# Database (Docker SQL Server)
DATABASE_URL=sqlserver://localhost:54321;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=false;trustServerCertificate=true;connectionTimeout=30
SHADOW_DATABASE_URL=sqlserver://localhost:54321;database=routing_data_layer_shadow;user=sa;password=YourStrong@Password123;encrypt=false;trustServerCertificate=true;connectionTimeout=30

# Security (development only)
JWT_SECRET=dev-secret-key-change-in-production

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.development`)

Also auto-created by the script:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## 🔍 Troubleshooting

### Docker Issues

**Containers won't start:**
```powershell
# Check Docker is running
docker ps

# Rebuild images
.\scripts\init\docker-dev.ps1 up -Build

# Clean and restart
.\scripts\init\docker-dev.ps1 clean
.\scripts\init\docker-dev.ps1 up -Build
```

**Port already in use:**
```powershell
# Check what's using the port
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Stop conflicting services or change ports in docker-compose.yml
```

**Prisma client missing:**
- This is normal in Docker mode - it will be generated during initialization
- If issues persist, run: `npm run prisma:generate` on the host

**OpenSSL errors in backend:**
- The Dockerfile includes OpenSSL installation
- Rebuild the image: `.\scripts\init\docker-dev.ps1 up -Build`

### Database Issues

**Database connection failed:**
```powershell
# Check if database container is running
.\scripts\init\docker-dev.ps1 status

# Check database logs
.\scripts\init\docker-dev.ps1 logs -Service sqlserver

# Restart database
docker restart routing-data-sqlserver
```

**Migrations failed:**
- The script will show migration commands to run manually
- Or run: `cd services/backend && npx prisma migrate dev`

### General Issues

**Script won't run from current directory:**
- The script automatically finds the project root
- You can run it from any subdirectory

**Requirements check fails:**
- Install missing prerequisites (see [Prerequisites](#-prerequisites))
- Ensure Docker Desktop is running
- Verify Node.js and npm are in your PATH

## 📚 Documentation

- 📖 [Infrastructure & Docker](../infrastructure/README.md) - Detailed Docker setup
- 🗄️ [Database Setup](../../services/backend/prisma/SETUP_GUIDE.md) - SQL Server & Prisma guide
- 🔧 [Backend API](../../services/backend/README.md) - Backend architecture
- 🎨 [Frontend](../../frontend/README.md) - Frontend architecture

## 🎯 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Backend** | NestJS + Prisma + SQL Server |
| **Database** | SQL Server 2022 (Docker for dev) |
| **Package Manager** | npm |
| **Containerization** | Docker + Docker Compose |

## 📝 License

ISC

---

**Need help?** Check the [Troubleshooting](#-troubleshooting) section or review the detailed documentation links above.
