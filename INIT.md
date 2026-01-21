# Routing Data Layer - Runtime Copy

This is a runtime-only copy of the repository containing only the files needed to run the solution.

## Initialization

To initialize this copy and make it ready to run:

```powershell
# Run from within this directory
.\initialize-runtime.ps1

# Or with options
.\initialize-runtime.ps1 -SkipDatabase    # Skip database setup
.\initialize-runtime.ps1 -InitializeGit   # Initialize as new git repo
```

## Quick Start (after initialization)

1. Start development:
   ```bash
   npm run dev
   ```

2. Run seeds (optional):
   ```bash
   npm run seeds
   ```

## Structure

- `frontend/` - React frontend application
- `services/backend/` - NestJS backend API
- `services/shared/` - Shared TypeScript types and DTOs
- `shared/` - Additional shared types
- `infrastructure/` - Docker compose and Azure deployment configs
- `scripts/` - Utility scripts (seeds, migrations)
- `seeds/` - Database seed files
- `migrations/` - Database migration files

## Environment Configuration

Copy the example environment files and configure:

```bash
# Backend
cp services/backend/.env.example services/backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

## Documentation

For full documentation, design specifications, and architecture details, refer to the original repository.
