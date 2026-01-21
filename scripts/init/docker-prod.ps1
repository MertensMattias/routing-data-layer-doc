# Docker Production Automation Script
# Fully automates the Docker production environment setup and management

param(
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "restart", "logs", "build", "deploy", "clean", "status", "shell", "migrate")]
    [string]$Action = "up",
    
    [string]$Service = "",
    [switch]$Build = $false,
    [switch]$Detached = $true,
    [switch]$Follow = $false,
    [string]$EnvFile = ".env.production"
)

$ErrorActionPreference = "Stop"
$composeFile = "infrastructure/docker-compose.prod.yml"
$composeDir = "infrastructure"

# Colors for output
function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host $Message -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
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

# Validate docker-compose file exists
function Test-ComposeFile {
    if (-not (Test-Path $composeFile)) {
        Write-Error "Docker Compose file not found: $composeFile"
        Write-Info "Make sure you're running this script from the project root"
        return $false
    }
    return $true
}

# Get database password from environment or use hardcoded default
function Get-DatabasePassword {
    if ($env:MSSQL_SA_PASSWORD) {
        return $env:MSSQL_SA_PASSWORD
    }
    
    # Use hardcoded default password from .env file
    return "YourStrong@Password123"
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
    if (-not (Test-Path $dir) -and $dir) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $envContent | Set-Content $FilePath -Encoding UTF8
}

# Prompt for required environment variables interactively and create .env files
function Get-RequiredEnvironmentVariables {
    $vars = @{}
    
    # Database password
    $dbPassword = Get-DatabasePassword
    if (-not $dbPassword) {
        return $null
    }
    $vars["MSSQL_SA_PASSWORD"] = $dbPassword
    
    # DATABASE_URL
    if (-not $env:DATABASE_URL) {
        Write-Host ""
        Write-Info "DATABASE_URL not set in environment"
        $dbUrl = Read-Host "Enter DATABASE_URL (or press Enter to use default with provided password)"
        if ([string]::IsNullOrWhiteSpace($dbUrl)) {
            # Construct default DATABASE_URL with the provided password
            $vars["DATABASE_URL"] = "sqlserver://sqlserver:1433;database=routing_data_layer;user=sa;password=$dbPassword;encrypt=false;trustServerCertificate=true;connectionTimeout=30"
            Write-Info "Using default DATABASE_URL"
        } else {
            $vars["DATABASE_URL"] = $dbUrl
        }
    } else {
        $vars["DATABASE_URL"] = $env:DATABASE_URL
    }
    
    # SHADOW_DATABASE_URL (optional, can be derived)
    if (-not $env:SHADOW_DATABASE_URL) {
        $vars["SHADOW_DATABASE_URL"] = $vars["DATABASE_URL"] -replace "database=routing_data_layer", "database=routing_data_layer_shadow"
    } else {
        $vars["SHADOW_DATABASE_URL"] = $env:SHADOW_DATABASE_URL
    }
    
    # JWT_SECRET
    if (-not $env:JWT_SECRET) {
        Write-Host ""
        Write-Info "JWT_SECRET not set in environment"
        $jwtSecret = Read-Host "Enter JWT_SECRET" -AsSecureString
        $jwtSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($jwtSecret)
        )
        if ([string]::IsNullOrWhiteSpace($jwtSecretPlain)) {
            Write-Error "JWT_SECRET is required for production"
            return $null
        }
        $vars["JWT_SECRET"] = $jwtSecretPlain
    } else {
        $vars["JWT_SECRET"] = $env:JWT_SECRET
    }
    
    # Create/update .env files
    Write-Host ""
    Write-Info "Creating/updating .env files..."
    
    # Backend .env
    $backendEnvPath = "services/backend/.env"
    $backendVars = @{
        NODE_ENV = "production"
        PORT = "3001"
        DATABASE_URL = $vars["DATABASE_URL"]
        SHADOW_DATABASE_URL = $vars["SHADOW_DATABASE_URL"]
        JWT_SECRET = $vars["JWT_SECRET"]
        FRONTEND_URL = $env:FRONTEND_URL
    }
    if ($env:AZURE_AD_CLIENT_ID) { $backendVars["AZURE_AD_CLIENT_ID"] = $env:AZURE_AD_CLIENT_ID }
    if ($env:AZURE_AD_TENANT_ID) { $backendVars["AZURE_AD_TENANT_ID"] = $env:AZURE_AD_TENANT_ID }
    if ($env:AZURE_AD_CLIENT_SECRET) { $backendVars["AZURE_AD_CLIENT_SECRET"] = $env:AZURE_AD_CLIENT_SECRET }
    
    if (-not (Test-Path $backendEnvPath)) {
        Set-EnvFile -FilePath $backendEnvPath -Variables $backendVars
        Write-Success "Backend .env file created at $backendEnvPath"
    } else {
        Set-EnvFile -FilePath $backendEnvPath -Variables $backendVars -Append
        Write-Success "Backend .env file updated"
    }
    
    # Frontend .env.production (if VITE_API_URL is set)
    if ($env:VITE_API_URL) {
        $frontendEnvPath = "frontend/.env.production"
        $frontendVars = @{
            VITE_API_URL = $env:VITE_API_URL
        }
        if ($env:VITE_AZURE_AD_CLIENT_ID) { $frontendVars["VITE_AZURE_AD_CLIENT_ID"] = $env:VITE_AZURE_AD_CLIENT_ID }
        
        if (-not (Test-Path $frontendEnvPath)) {
            Set-EnvFile -FilePath $frontendEnvPath -Variables $frontendVars
            Write-Success "Frontend .env.production file created at $frontendEnvPath"
        } else {
            Set-EnvFile -FilePath $frontendEnvPath -Variables $frontendVars -Append
            Write-Success "Frontend .env.production file updated"
        }
    }
    
    # Root .env for docker-compose (optional, for MSSQL_SA_PASSWORD)
    $rootEnvPath = ".env"
    if (-not (Test-Path $rootEnvPath)) {
        $rootVars = @{
            MSSQL_SA_PASSWORD = $dbPassword
        }
        Set-EnvFile -FilePath $rootEnvPath -Variables $rootVars
        Write-Success "Root .env file created for docker-compose"
    }
    
    return $vars
}

# Validate environment variables
function Test-EnvironmentVariables {
    Write-Info "Checking required environment variables..."
    
    $requiredVars = @(
        "MSSQL_SA_PASSWORD",
        "DATABASE_URL",
        "JWT_SECRET"
    )
    
    $missing = @()
    foreach ($var in $requiredVars) {
        if (-not (Get-Item "Env:$var" -ErrorAction SilentlyContinue)) {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Warning "Missing required environment variables: $($missing -join ', ')"
        Write-Info "You will be prompted to enter them interactively"
        return $false
    }
    
    Write-Success "All required environment variables are set"
    return $true
}

# Check if services are running
function Get-ServicesStatus {
    Push-Location $composeDir
    try {
        $output = & docker-compose -f docker-compose.prod.yml ps --format json 2>&1 | ConvertFrom-Json
        return $output
    } catch {
        return @()
    } finally {
        Pop-Location
    }
}

# Main script logic
Write-Step "Docker Production Environment Manager"

if (-not (Test-Docker)) {
    exit 1
}

if (-not (Test-ComposeFile)) {
    exit 1
}

# Get environment variables interactively if needed
$envVars = Get-RequiredEnvironmentVariables
if ($null -eq $envVars) {
    Write-Error "Failed to get required environment variables"
    exit 1
}

# Set environment variables
foreach ($key in $envVars.Keys) {
    if (-not (Get-Item "Env:$key" -ErrorAction SilentlyContinue)) {
        Set-Item -Path "Env:$key" -Value $envVars[$key]
    }
}

Push-Location $composeDir
try {
    switch ($Action.ToLower()) {
        "up" {
            Write-Step "Starting Production Environment"
            
            # Check if services are already running
            $running = Get-ServicesStatus | Where-Object { $_.State -eq "running" }
            if ($running.Count -gt 0) {
                Write-Warning "Some services are already running"
                Write-Info "Use 'restart' to restart or 'down' to stop first"
            }
            
            # Build if requested
            if ($Build) {
                Write-Info "Building production images..."
                & docker-compose -f docker-compose.prod.yml build
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Failed to build images"
                    exit 1
                }
                Write-Success "Images built successfully"
            }
            
            # Start services
            Write-Info "Starting production services..."
            if ($Detached) {
                & docker-compose -f docker-compose.prod.yml up -d
            } else {
                & docker-compose -f docker-compose.prod.yml up
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Production environment started"
                Write-Info "Frontend: http://localhost:3000"
                Write-Info "Backend: http://localhost:3001"
                Write-Info "API Docs: http://localhost:3001/api/docs"
                Write-Info "Database: localhost:54321"
                Write-Host ""
                Write-Warning "Make sure to set proper environment variables for production!"
            } else {
                Write-Error "Failed to start services"
                exit 1
            }
        }
        
        "down" {
            Write-Step "Stopping Production Environment"
            Write-Info "Stopping all services..."
            & docker-compose -f docker-compose.prod.yml down
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "All services stopped"
            } else {
                Write-Error "Failed to stop services"
                exit 1
            }
        }
        
        "restart" {
            Write-Step "Restarting Production Environment"
            
            Write-Info "Stopping services..."
            & docker-compose -f docker-compose.prod.yml down 2>&1 | Out-Null
            
            if ($Build) {
                Write-Info "Building images..."
                & docker-compose -f docker-compose.prod.yml build
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Failed to build images"
                    exit 1
                }
            }
            
            Write-Info "Starting services..."
            if ($Detached) {
                & docker-compose -f docker-compose.prod.yml up -d
            } else {
                & docker-compose -f docker-compose.prod.yml up
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Services restarted"
            } else {
                Write-Error "Failed to restart services"
                exit 1
            }
        }
        
        "build" {
            Write-Step "Building Production Images"
            Write-Info "Building all production images (this may take a while)..."
            & docker-compose -f docker-compose.prod.yml build --no-cache
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "All images built successfully"
                Write-Info "Image sizes:"
                & docker images | Select-String "routing-data"
            } else {
                Write-Error "Failed to build images"
                exit 1
            }
        }
        
        "deploy" {
            Write-Step "Deploying Production Environment"
            
            Write-Info "Step 1: Building images..."
            & docker-compose -f docker-compose.prod.yml build
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Build failed"
                exit 1
            }
            
            Write-Info "Step 2: Stopping existing services..."
            & docker-compose -f docker-compose.prod.yml down 2>&1 | Out-Null
            
            Write-Info "Step 3: Starting services..."
            & docker-compose -f docker-compose.prod.yml up -d
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to start services"
                exit 1
            }
            
            Write-Info "Step 4: Waiting for services to be healthy..."
            Start-Sleep -Seconds 10
            
            Write-Info "Step 5: Running database migrations..."
            & docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Migrations may have failed - check logs"
            } else {
                Write-Success "Migrations completed"
            }
            
            Write-Success "Deployment completed"
            Write-Info "Checking service health..."
            & docker-compose -f docker-compose.prod.yml ps
        }
        
        "migrate" {
            Write-Step "Running Database Migrations"
            Write-Info "Running Prisma migrations in production mode..."
            & docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Migrations completed"
            } else {
                Write-Error "Migrations failed"
                exit 1
            }
        }
        
        "logs" {
            Write-Step "Viewing Production Logs"
            if ($Service) {
                Write-Info "Showing logs for: $Service"
                if ($Follow) {
                    & docker-compose -f docker-compose.prod.yml logs -f $Service
                } else {
                    & docker-compose -f docker-compose.prod.yml logs --tail=100 $Service
                }
            } else {
                Write-Info "Showing logs for all services"
                if ($Follow) {
                    & docker-compose -f docker-compose.prod.yml logs -f
                } else {
                    & docker-compose -f docker-compose.prod.yml logs --tail=100
                }
            }
        }
        
        "clean" {
            Write-Step "Cleaning Up Production Environment"
            Write-Warning "This will remove containers, networks, volumes, and images"
            Write-Warning "This action cannot be undone!"
            $confirm = Read-Host "Are you sure? Type 'yes' to confirm"
            if ($confirm -eq "yes") {
                Write-Info "Stopping and removing containers..."
                & docker-compose -f docker-compose.prod.yml down -v
                
                Write-Info "Removing images..."
                & docker-compose -f docker-compose.prod.yml down --rmi all
                
                Write-Success "Cleanup completed"
            } else {
                Write-Info "Cleanup cancelled"
            }
        }
        
        "status" {
            Write-Step "Production Service Status"
            & docker-compose -f docker-compose.prod.yml ps
            Write-Host ""
            Write-Info "Health checks:"
            & docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
            Write-Host ""
            Write-Info "Resource usage:"
            & docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" (docker-compose -f docker-compose.prod.yml ps -q)
        }
        
        "shell" {
            if (-not $Service) {
                Write-Error "Please specify a service name (e.g., -Service backend)"
                Write-Info "Available services: backend, frontend, sqlserver"
                exit 1
            }
            Write-Step "Opening Shell in $Service"
            & docker-compose -f docker-compose.prod.yml exec $Service sh
        }
        
        default {
            Write-Error "Unknown action: $Action"
            Write-Host ""
            Write-Host "Usage: .\docker-prod.ps1 [action] [options]" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Actions:" -ForegroundColor Cyan
            Write-Host "  up       - Start production environment (default)"
            Write-Host "  down     - Stop all services"
            Write-Host "  restart  - Restart all services"
            Write-Host "  build    - Build all production images"
            Write-Host "  deploy   - Full deployment (build + start + migrate)"
            Write-Host "  migrate  - Run database migrations"
            Write-Host "  logs     - View logs (use -Service to filter)"
            Write-Host "  clean    - Remove containers, volumes, and images"
            Write-Host "  status   - Show service status and resource usage"
            Write-Host "  shell    - Open shell in service (requires -Service)"
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Cyan
            Write-Host "  -Service <name>  - Target specific service"
            Write-Host "  -Build           - Build images before starting"
            Write-Host "  -Detached       - Run in background (default: true)"
            Write-Host "  -Follow         - Follow log output (-f flag)"
            Write-Host ""
            Write-Host "Examples:" -ForegroundColor Green
            Write-Host "  .\docker-prod.ps1 deploy"
            Write-Host "  .\docker-prod.ps1 up -Build"
            Write-Host "  .\docker-prod.ps1 logs -Service backend -Follow"
            Write-Host "  .\docker-prod.ps1 migrate"
            Write-Host "  .\docker-prod.ps1 status"
            exit 1
        }
    }
} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
} finally {
    Pop-Location
}
