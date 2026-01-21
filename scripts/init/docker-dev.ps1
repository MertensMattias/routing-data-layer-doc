# Docker Development Automation Script
# Fully automates the Docker development environment setup and management

param(
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "restart", "logs", "build", "clean", "status", "shell")]
    [string]$Action = "up",
    
    [string]$Service = "",
    [switch]$Build = $false,
    [switch]$Detached = $false,
    [switch]$Follow = $false,
    [switch]$Init = $false,
    [switch]$SkipInit = $false
)

$ErrorActionPreference = "Stop"

# Find project root directory
function Get-ProjectRoot {
    $currentPath = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
    $searchPath = $currentPath
    
    # Search upward for project root markers
    while ($searchPath) {
        $composeFile = Join-Path $searchPath "infrastructure\docker-compose.yml"
        $packageJson = Join-Path $searchPath "package.json"
        
        # Check if we found the project root (has infrastructure/docker-compose.yml or package.json)
        if ((Test-Path $composeFile) -or (Test-Path $packageJson)) {
            return $searchPath
        }
        
        $parentPath = Split-Path $searchPath -Parent
        # Stop if we've reached the root of the filesystem
        if ($parentPath -eq $searchPath) {
            break
        }
        $searchPath = $parentPath
    }
    
    return $null
}

# Get project root and change to it
$originalLocation = Get-Location
$projectRoot = Get-ProjectRoot
if (-not $projectRoot) {
    Write-Host "Error: Could not find project root directory." -ForegroundColor Red
    Write-Host "Make sure you're running this script from within the project or a subdirectory." -ForegroundColor Yellow
    exit 1
}

# Change to project root
Push-Location $projectRoot

# Ensure project root is absolute
$projectRoot = (Get-Location).Path

# Use absolute paths based on project root
$composeDir = Join-Path $projectRoot "infrastructure"
$composeFile = Join-Path $composeDir "docker-compose.yml"

# Colors for output
function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ️  $Message" -ForegroundColor Gray
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "  ⚠️  $Message" -ForegroundColor Yellow
}

# Check system requirements and prompt for confirmation
function Test-SystemRequirements {
    Write-Step "System Requirements Check"
    
    $requirements = @()
    $allMet = $true
    
    # Check Docker
    try {
        $dockerVersion = & docker --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{ Name = "Docker"; Status = "✓"; Version = $dockerVersion.Trim(); Met = $true }
        } else {
            $requirements += @{ Name = "Docker"; Status = "✗"; Version = "Not found"; Met = $false }
            $allMet = $false
        }
    } catch {
        $requirements += @{ Name = "Docker"; Status = "✗"; Version = "Not found"; Met = $false }
        $allMet = $false
    }
    
    # Check Docker Compose
    try {
        $composeVersion = & docker-compose --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{ Name = "Docker Compose"; Status = "✓"; Version = $composeVersion.Trim(); Met = $true }
        } else {
            # Try docker compose (v2 syntax)
            $composeVersion = & docker compose version 2>&1
            if ($LASTEXITCODE -eq 0) {
                $requirements += @{ Name = "Docker Compose"; Status = "✓"; Version = $composeVersion.Trim(); Met = $true }
            } else {
                $requirements += @{ Name = "Docker Compose"; Status = "✗"; Version = "Not found"; Met = $false }
                $allMet = $false
            }
        }
    } catch {
        $requirements += @{ Name = "Docker Compose"; Status = "✗"; Version = "Not found"; Met = $false }
        $allMet = $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = & node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $versionNum = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
            if ($versionNum -ge 18) {
                $requirements += @{ Name = "Node.js (18+)"; Status = "✓"; Version = $nodeVersion.Trim(); Met = $true }
            } else {
                $requirements += @{ Name = "Node.js (18+)"; Status = "✗"; Version = "$($nodeVersion.Trim()) - Requires 18+"; Met = $false }
                $allMet = $false
            }
        } else {
            $requirements += @{ Name = "Node.js (18+)"; Status = "✗"; Version = "Not found"; Met = $false }
            $allMet = $false
        }
    } catch {
        $requirements += @{ Name = "Node.js (18+)"; Status = "✗"; Version = "Not found"; Met = $false }
        $allMet = $false
    }
    
    # Check npm
    try {
        $npmVersion = & npm --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $versionNum = [int]($npmVersion -replace '(\d+)\..*', '$1')
            if ($versionNum -ge 9) {
                $requirements += @{ Name = "npm (9+)"; Status = "✓"; Version = $npmVersion.Trim(); Met = $true }
            } else {
                $requirements += @{ Name = "npm (9+)"; Status = "✗"; Version = "$($npmVersion.Trim()) - Requires 9+"; Met = $false }
                $allMet = $false
            }
        } else {
            $requirements += @{ Name = "npm (9+)"; Status = "✗"; Version = "Not found"; Met = $false }
            $allMet = $false
        }
    } catch {
        $requirements += @{ Name = "npm (9+)"; Status = "✗"; Version = "Not found"; Met = $false }
        $allMet = $false
    }
    
    # Check Docker daemon is running
    try {
        & docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $requirements += @{ Name = "Docker Daemon"; Status = "✓"; Version = "Running"; Met = $true }
        } else {
            $requirements += @{ Name = "Docker Daemon"; Status = "✗"; Version = "Not running"; Met = $false }
            $allMet = $false
        }
    } catch {
        $requirements += @{ Name = "Docker Daemon"; Status = "✗"; Version = "Not running"; Met = $false }
        $allMet = $false
    }
    
    # Display requirements
    Write-Host ""
    Write-Host "Required Prerequisites:" -ForegroundColor Cyan
    Write-Host ""
    foreach ($req in $requirements) {
        $color = if ($req.Met) { "Green" } else { "Red" }
        Write-Host "  $($req.Status) $($req.Name): " -NoNewline -ForegroundColor $color
        Write-Host $req.Version -ForegroundColor Gray
    }
    
    Write-Host ""
    
    if (-not $allMet) {
        Write-Error "Some requirements are not met. Please install missing prerequisites before continuing."
        Write-Host ""
        Write-Host "Installation Links:" -ForegroundColor Yellow
        Write-Host "  - Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
        Write-Host "  - Node.js: https://nodejs.org/ (LTS version recommended)" -ForegroundColor White
        Write-Host ""
        return $false
    }
    
    Write-Success "All system requirements are met!"
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Cyan
    Write-Host "  • Start Docker containers (SQL Server, Backend, Frontend)" -ForegroundColor Gray
    Write-Host "  • Initialize database and run migrations (if needed)" -ForegroundColor Gray
    Write-Host "  • Set up environment files" -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "Continue? (Y/n)"
    if ($response -eq "n" -or $response -eq "N") {
        Write-Info "Cancelled by user"
        return $false
    }
    
    return $true
}

# Validate Docker is available
function Test-Docker {
    try {
        & docker --version 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Docker is not available or not in PATH"
            return $false
        }
        return $true
    } catch {
        Write-Error "Docker is not available"
        return $false
    }
}

# Create or update .env file
function Set-EnvFile {
    param(
        [string]$FilePath,
        [hashtable]$Variables,
        [switch]$Append
    )
    
    $envContent = @()
    
    # Read existing file if it exists and we're appending
    if ($Append -and (Test-Path $FilePath)) {
        $existing = Get-Content $FilePath
        $existingKeys = @{}
        
        foreach ($line in $existing) {
            if ($line -match '^\s*([^#=]+?)\s*=\s*(.+)$') {
                $key = $matches[1].Trim()
                $existingKeys[$key] = $line
            } else {
                $envContent += $line
            }
        }
        
        # Update existing variables
        foreach ($key in $Variables.Keys) {
            $value = $Variables[$key]
            $escapedValue = $value -replace '"', '`"'
            $envContent += "$key=`"$escapedValue`""
            $existingKeys.Remove($key)
        }
        
        # Keep non-updated existing variables
        foreach ($key in $existingKeys.Keys) {
            $envContent += $existingKeys[$key]
        }
    } else {
        # Create new file
        foreach ($key in $Variables.Keys) {
            $value = $Variables[$key]
            $escapedValue = $value -replace '"', '`"'
            $envContent += "$key=`"$escapedValue`""
        }
    }
    
    # Ensure directory exists
    $dir = Split-Path $FilePath -Parent
    if ((-not (Test-Path $dir)) -and $dir) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $envContent | Set-Content $FilePath -Encoding UTF8
}

# Prompt for database password if not set and create/update .env files
function Initialize-EnvironmentFiles {
    $dbPassword = $env:MSSQL_SA_PASSWORD
    
    # Check if backend .env exists
    $backendEnvPath = "services/backend/.env"
    $frontendEnvPath = "frontend/.env.development"
    
    if (-not $dbPassword) {
        if (Test-Path $backendEnvPath) {
            # Try to read from existing .env file
            $envContent = Get-Content $backendEnvPath -ErrorAction SilentlyContinue
            foreach ($line in $envContent) {
                if ($line -match 'DATABASE_URL\s*=\s*["'']?[^"'']*password=([^;]+)') {
                    $dbPassword = $matches[1]
                    break
                }
            }
        }
    }
    
    if (-not $dbPassword) {
        # Use hardcoded default password from .env file
        $dbPassword = "YourStrong@Password123"
    }
    
    # Set environment variable
    $env:MSSQL_SA_PASSWORD = $dbPassword
    
    # Create/update backend .env file
    $backendVars = @{
        NODE_ENV = "development"
        PORT = "3001"
        DATABASE_URL = "sqlserver://localhost:54321;database=routing_data_layer;user=sa;password=$dbPassword;encrypt=false;trustServerCertificate=true;connectionTimeout=30"
        SHADOW_DATABASE_URL = "sqlserver://localhost:54321;database=routing_data_layer_shadow;user=sa;password=$dbPassword;encrypt=false;trustServerCertificate=true;connectionTimeout=30"
        JWT_SECRET = "dev-secret-key-change-in-production"
        FRONTEND_URL = "http://localhost:3000"
    }
    
    if (-not (Test-Path $backendEnvPath)) {
        Write-Info "Creating backend .env file..."
        Set-EnvFile -FilePath $backendEnvPath -Variables $backendVars
        Write-Success "Backend .env file created at $backendEnvPath"
    } else {
        # Update only if password changed
        $needsUpdate = $false
        $existing = Get-Content $backendEnvPath -ErrorAction SilentlyContinue
        foreach ($line in $existing) {
            if ($line -match 'DATABASE_URL\s*=' -and $line -notmatch "password=$dbPassword") {
                $needsUpdate = $true
                break
            }
        }
        if ($needsUpdate) {
            Write-Info "Updating backend .env file with new password..."
            Set-EnvFile -FilePath $backendEnvPath -Variables $backendVars -Append
            Write-Success "Backend .env file updated"
        }
    }
    
    # Create/update frontend .env.development file
    $frontendVars = @{
        VITE_API_URL = "http://localhost:3001/api/v1"
    }
    
    if (-not (Test-Path $frontendEnvPath)) {
        Write-Info "Creating frontend .env.development file..."
        Set-EnvFile -FilePath $frontendEnvPath -Variables $frontendVars
        Write-Success "Frontend .env.development file created at $frontendEnvPath"
    }
    
    return $dbPassword
}

# Validate docker-compose file exists
function Test-ComposeFile {
    if (-not (Test-Path $composeFile)) {
        Write-Error "Docker Compose file not found: $composeFile"
        Write-Info "Expected location: $(Join-Path (Get-Location) $composeFile)"
        return $false
    }
    return $true
}

# Check if services are running
function Get-ServicesStatus {
    $currentDir = (Get-Location).Path
    $targetDir = $composeDir
    $needsPush = $currentDir -ne $targetDir
    
    if ($needsPush) {
        Push-Location $targetDir
    }
    try {
        $output = & docker-compose ps --format json 2>&1 | ConvertFrom-Json
        return $output
    } catch {
        return @()
    } finally {
        if ($needsPush) {
            Pop-Location
        }
    }
}

# Check if initialization is needed
function Test-InitializationNeeded {
    $needed = @()
    
    # Check if node_modules exist
    if (-not (Test-Path "node_modules")) {
        $needed += "Root dependencies"
    }
    if (-not (Test-Path "services/backend/node_modules")) {
        $needed += "Backend dependencies"
    }
    if (-not (Test-Path "frontend/node_modules")) {
        $needed += "Frontend dependencies"
    }
    
    # Check if Prisma client is generated on host
    # Note: In Docker mode, Prisma client may exist in container but not on host
    # This is normal - it will be generated during initialization if missing
    if (-not (Test-Path "services/backend/node_modules/.prisma")) {
        # Only add to needed list if backend node_modules exists (otherwise it will be installed anyway)
        if (Test-Path "services/backend/node_modules") {
            $needed += "Prisma client"
        }
    }
    
    return $needed
}

# Track migration status
$script:migrationsSucceeded = $null

# Run initialization steps
function Invoke-Initialization {
    param([switch]$SkipDatabase, [switch]$SkipSeeds)
    
    Write-Step "Initializing Repository"
    
    # Install dependencies
    Write-Info "Installing root dependencies..."
    & npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install root dependencies"
        return $false
    }
    Write-Success "Root dependencies installed"
    
    Write-Info "Installing backend dependencies..."
    Push-Location "services/backend"
    try {
        & npm install 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install backend dependencies"
            return $false
        }
        Write-Success "Backend dependencies installed"
    } finally {
        Pop-Location
    }
    
    Write-Info "Installing frontend dependencies..."
    Push-Location "frontend"
    try {
        & npm install 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            return $false
        }
        Write-Success "Frontend dependencies installed"
    } finally {
        Pop-Location
    }
    
    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    Push-Location "services/backend"
    try {
        & npx prisma generate 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Prisma client generation had issues"
        } else {
            Write-Success "Prisma client generated"
        }
    } finally {
        Pop-Location
    }
    
    # Database setup (if not skipped)
    if (-not $SkipDatabase) {
        Write-Info "Setting up database..."
        
        # Start database container
        & npm run db:start 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database container started"
            
            # Wait for database
            Write-Info "Waiting for database to be ready..."
            & npm run db:wait 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Database is ready"
                
                # Run migrations - reset from scratch for clean initialization
                Write-Info "Resetting and initializing database from scratch..."
                Push-Location "services/backend"
                try {
                    # Use migrate reset to drop, recreate, and apply all migrations from scratch
                    # --force makes it non-interactive (no prompts)
                    # --skip-seed because we run seeds separately after
                    $migrationResult = & npx prisma migrate reset --force --skip-seed 2>&1
                    $migrationResult | Write-Host
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Success "Database reset and migrations applied successfully"
                        $script:migrationsSucceeded = $true
                    } else {
                        Write-Warning "Database reset had issues (exit code: $LASTEXITCODE)"
                        Write-Info "Trying to apply migrations without reset..."
                        $applyResult = & npx prisma migrate deploy 2>&1
                        $applyResult | Write-Host
                        if ($LASTEXITCODE -eq 0) {
                            Write-Success "Migrations applied successfully"
                            $script:migrationsSucceeded = $true
                        } else {
                            $script:migrationsSucceeded = $false
                        }
                    }
                } finally {
                    Pop-Location
                }
                
                # Run seeds (if not skipped)
                if (-not $SkipSeeds) {
                    Write-Info "Running seeds..."
                    & npm run seeds 2>&1 | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Success "Seeds completed"
                    } else {
                        Write-Warning "Seeds had issues"
                    }
                }
            } else {
                Write-Warning "Database did not become ready in time"
            }
        } else {
            Write-Warning "Could not start database container"
        }
    }
    
    Write-Success "Initialization completed"
    return $true
}

# Main script logic
try {
    Write-Step "Docker Development Environment Manager"

    # Check system requirements and get user confirmation
    if (-not (Test-SystemRequirements)) {
        exit 1
    }

    if (-not (Test-ComposeFile)) {
        exit 1
    }

    # Initialize environment files
    $dbPassword = Initialize-EnvironmentFiles

    # Check if initialization is needed (only for 'up' action)
    if ($Action.ToLower() -eq "up" -and -not $SkipInit) {
        $initNeeded = Test-InitializationNeeded
        
        if ($initNeeded.Count -gt 0 -or $Init) {
        if ($Init) {
            Write-Host ""
            Write-Info "Initialization requested"
        } else {
            Write-Host ""
            Write-Warning "Repository appears to need initialization"
            Write-Info "Missing: $($initNeeded -join ', ')"
            if ($initNeeded -contains "Prisma client") {
                Write-Info "Note: Prisma client will be generated during initialization (this is normal for Docker setups)"
            }
            Write-Host ""
            $response = Read-Host "Would you like to initialize now? (Y/n)"
            if ($response -eq "n" -or $response -eq "N") {
                Write-Info "Skipping initialization. Run with -Init flag to initialize later."
            } else {
                $Init = $true
            }
        }
        
        if ($Init) {
            $initResult = Invoke-Initialization
            if (-not $initResult) {
                Write-Error "Initialization failed. Please run initialize-runtime.ps1 manually."
                exit 1
            }
            Write-Host ""
        }
        }
    }

    Push-Location $composeDir
    try {
        switch ($Action.ToLower()) {
            "up" {
                Write-Step "Starting Development Environment"
                
                # Check if services are already running
                $running = Get-ServicesStatus | Where-Object { $_.State -eq "running" }
                if ($running.Count -gt 0) {
                    Write-Warning "Some services are already running"
                    Write-Info "Use 'restart' to restart or 'down' to stop first"
                }
                
                # Build if requested or if images don't exist
                if ($Build) {
                    Write-Info "Building images..."
                    & docker-compose build
                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Failed to build images"
                        exit 1
                    }
                    Write-Success "Images built successfully"
                }
                
                # Start services
                Write-Info "Starting services..."
                if ($Detached) {
                    & docker-compose up -d
                } else {
                    & docker-compose up
                }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Development environment started"
                    Write-Info "Frontend: http://localhost:3000"
                    Write-Info "Backend: http://localhost:3001"
                    Write-Info "API Docs: http://localhost:3001/api/docs"
                    Write-Info "Database: localhost:54321"
                } else {
                    Write-Error "Failed to start services"
                    exit 1
                }
            }
            
            "down" {
                Write-Step "Stopping Development Environment"
                Write-Info "Stopping all services..."
                & docker-compose down
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "All services stopped"
                } else {
                    Write-Error "Failed to stop services"
                    exit 1
                }
            }
            
            "restart" {
                Write-Step "Restarting Development Environment"
                Write-Info "Stopping services..."
                & docker-compose down 2>&1 | Out-Null
                
                if ($Build) {
                    Write-Info "Building images..."
                    & docker-compose build
                    if ($LASTEXITCODE -ne 0) {
                        Write-Error "Failed to build images"
                        exit 1
                    }
                }
                
                Write-Info "Starting services..."
                if ($Detached) {
                    & docker-compose up -d
                } else {
                    & docker-compose up
                }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Services restarted"
                } else {
                    Write-Error "Failed to restart services"
                    exit 1
                }
            }
            
            "logs" {
                Write-Step "Viewing Logs"
                if ($Service) {
                    Write-Info "Showing logs for: $Service"
                    if ($Follow) {
                        & docker-compose logs -f $Service
                    } else {
                        & docker-compose logs --tail=100 $Service
                    }
                } else {
                    Write-Info "Showing logs for all services"
                    if ($Follow) {
                        & docker-compose logs -f
                    } else {
                        & docker-compose logs --tail=100
                    }
                }
            }
            
            "build" {
                Write-Step "Building Images"
                Write-Info "Building all service images..."
                & docker-compose build --no-cache
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "All images built successfully"
                } else {
                    Write-Error "Failed to build images"
                    exit 1
                }
            }
            
            "clean" {
                Write-Step "Cleaning Up"
                Write-Warning "This will remove containers, networks, and volumes"
                $confirm = Read-Host "Are you sure? (y/N)"
                if ($confirm -eq "y" -or $confirm -eq "Y") {
                    Write-Info "Stopping and removing containers..."
                    & docker-compose down -v
                    
                    Write-Info "Removing images..."
                    & docker-compose down --rmi all
                    
                    Write-Success "Cleanup completed"
                } else {
                    Write-Info "Cleanup cancelled"
                }
            }
            
            "status" {
                Write-Step "Service Status"
                & docker-compose ps
                Write-Host ""
                Write-Info "Health checks:"
                & docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
            }
            
            "shell" {
                if (-not $Service) {
                    Write-Error "Please specify a service name (e.g., -Service backend)"
                    Write-Info "Available services: backend, frontend, sqlserver"
                    exit 1
                }
                Write-Step "Opening Shell in $Service"
                & docker-compose exec $Service sh
            }
            
            default {
                Write-Error "Unknown action: $Action"
                Write-Host ""
                Write-Host "Usage: .\docker-dev.ps1 [action] [options]" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Actions:" -ForegroundColor Cyan
                Write-Host "  up       - Start development environment (default)"
                Write-Host "  down     - Stop all services"
                Write-Host "  restart  - Restart all services"
                Write-Host "  logs     - View logs (use -Service to filter)"
                Write-Host "  build    - Build all images"
                Write-Host "  clean    - Remove containers, volumes, and images"
                Write-Host "  status   - Show service status"
                Write-Host "  shell    - Open shell in service (requires -Service)"
                Write-Host ""
                Write-Host "Options:" -ForegroundColor Cyan
                Write-Host "  -Service <name>  - Target specific service"
                Write-Host "  -Build           - Build images before starting"
                Write-Host "  -Detached        - Run in background (-d flag)"
                Write-Host "  -Follow          - Follow log output (-f flag)"
                Write-Host "  -Init            - Initialize repository (install deps, setup DB)"
                Write-Host "  -SkipInit        - Skip automatic initialization check"
                Write-Host ""
                Write-Host "Examples:" -ForegroundColor Green
                Write-Host "  .\docker-dev.ps1 up"
                Write-Host "  .\docker-dev.ps1 up -Build -Detached"
                Write-Host "  .\docker-dev.ps1 logs -Service backend -Follow"
                Write-Host "  .\docker-dev.ps1 shell -Service backend"
                exit 1
            }
        }
        } catch {
            Write-Error "An error occurred: $($_.Exception.Message)"
            exit 1
        } finally {
            Pop-Location  # Pop composeDir (if we pushed it)
        }
    
    # Display migration command if migrations didn't succeed
    if ($script:migrationsSucceeded -eq $false) {
        Write-Host ""
        Write-Step "Migration Reminder"
        Write-Warning "Database migrations did not complete successfully during initialization."
        Write-Host ""
        Write-Info "To run migrations manually, use one of these commands:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Option 1: Using npm script (from project root):" -ForegroundColor Yellow
        Write-Host "    npm run prisma:migrate" -ForegroundColor White
        Write-Host ""
        Write-Host "  Option 2: Using Prisma directly (from project root):" -ForegroundColor Yellow
        Write-Host "    cd services/backend" -ForegroundColor White
        Write-Host "    npx prisma migrate dev" -ForegroundColor White
        Write-Host ""
        Write-Host "  Option 3: Apply existing migrations (non-interactive):" -ForegroundColor Yellow
        Write-Host "    cd services/backend" -ForegroundColor White
        Write-Host "    npx prisma migrate deploy" -ForegroundColor White
        Write-Host ""
    }
} finally {
    # Always restore original location (we always push to project root at start)
    try {
        Pop-Location
    } catch {
        # Ignore if location stack is empty
    }
}
