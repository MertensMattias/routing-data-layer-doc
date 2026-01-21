# PowerShell Automation Scripts

## Main Script: make.ps1

The `make.ps1` script is the unified automation script for all project operations.

### Usage

All commands are run from the project root directory:

```powershell
.\scripts\make.ps1 <command> [options]
```

For help, run:

```powershell
.\scripts\make.ps1 help
```

### Available Commands

#### Setup & Development

- `.\scripts\make.ps1 install` - Install all dependencies (backend + frontend)
- `.\scripts\make.ps1 dev` - Start both backend and frontend in dev mode
- `.\scripts\make.ps1 dev:backend` - Start backend in dev mode
- `.\scripts\make.ps1 dev:frontend` - Start frontend in dev mode
- `.\scripts\make.ps1 build` - Build both backend and frontend
- `.\scripts\make.ps1 build:backend` - Build backend
- `.\scripts\make.ps1 build:frontend` - Build frontend
- `.\scripts\make.ps1 build:verify` - Lint + type-check + test + build (backend + frontend)
- `.\scripts\make.ps1 test` - Run backend tests
- `.\scripts\make.ps1 test:frontend` - Run frontend type-check
- `.\scripts\make.ps1 verify` - Lint + test + build (backend)
- `.\scripts\make.ps1 verify:frontend` - Lint + type-check + build (frontend)
- `.\scripts\make.ps1 verify:all` - Lint + test + build (backend + frontend)

#### Database

- `.\scripts\make.ps1 prisma-generate` - Generate Prisma client
- `.\scripts\make.ps1 prisma-migrate` - Run Prisma migrations + auto-apply manual SQL (dev)
- `.\scripts\make.ps1 prisma-deploy` - Deploy Prisma migrations + auto-apply manual SQL (prod)
- `.\scripts\make.ps1 prisma-studio` - Open Prisma Studio
- `.\scripts\make.ps1 prisma-reset` - Reset DB with Prisma + auto-apply manual SQL (destructive)
- `.\scripts\make.ps1 db-setup` - Prisma setup + manual SQL instructions
- `.\scripts\make.ps1 db-nuke` - Drop cfg/rt/seg/msg schemas via sqlcmd (destructive)
- `.\scripts\make.ps1 db-reset` - Drop cfg/rt/seg/msg + rebuild (destructive)
- `.\scripts\make.ps1 hard-reset` - Full wipe (backend + frontend) + reinstall + verify
- `.\scripts\make.ps1 hard-reset:backend` - Full backend wipe + reinstall + verify
- `.\scripts\make.ps1 hard-reset:frontend` - Full frontend clean + reinstall + verify

#### Cleanup & Rebuild

- `.\scripts\make.ps1 clean` - Remove node_modules/build artifacts
- `.\scripts\make.ps1 clean-prisma` - Remove Prisma generated files
- `.\scripts\make.ps1 rebuild` - Clean + install + prisma generate

#### Docker

- `.\scripts\make.ps1 docker-up` - Start Docker services
- `.\scripts\make.ps1 docker-down` - Stop Docker services

### Database Connection

For database commands that require connection details, the script will:

1. Check command-line parameters (`-Server`, `-Database`, `-Username`, `-Password`)
2. Check `$env:DATABASE_URL` environment variable
3. Read from `services/backend/.env` file
4. Prompt for manual input if none of the above are available

Example with parameters:

```powershell
.\scripts\make.ps1 db-reset -Server localhost -Database mydb -Username sa -Password "password"
```

### Requirements

- PowerShell 5.1 or later
- Node.js 18+ and npm 9+
- sqlcmd (for database operations)
- Execution policy that allows script execution (or use `-ExecutionPolicy Bypass`)

### Notes

- The script uses `$PSCommandPath` for self-referencing, so it works correctly when moved to any location
- All paths in the script are relative to the project root (where you run the script from)
- Database operations include automatic Azure SQL detection and handling
