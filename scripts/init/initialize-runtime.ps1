# Script to initialize a runtime copy of the repository
# This installs dependencies, generates Prisma client, sets up the database (Docker container), and runs seeds
# Run this after create-runtime-copy.ps1

param(
    [string]$TargetDir = "routing-data-layer-runtime",
    [switch]$SkipDatabase = $false,
    [switch]$SkipSeeds = $false,
    [switch]$InitializeGit = $false
)

$ErrorActionPreference = "Stop"

# Validate required tools
Write-Host "Validating required tools..." -ForegroundColor Cyan
$toolsValid = $true

# Check npm
try {
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error: npm is not available or not in PATH" -ForegroundColor Red
        $toolsValid = $false
    } else {
        Write-Host "  npm: $npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  Error: npm is not available" -ForegroundColor Red
    $toolsValid = $false
}

# Check node
try {
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error: node is not available or not in PATH" -ForegroundColor Red
        $toolsValid = $false
    } else {
        Write-Host "  node: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  Error: node is not available" -ForegroundColor Red
    $toolsValid = $false
}

# Check Docker (only if database setup is not skipped)
if (-not $SkipDatabase) {
    try {
        & docker --version 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Error: docker is not available or not in PATH" -ForegroundColor Red
            $toolsValid = $false
        } else {
            $dockerVersion = & docker --version 2>&1
            Write-Host "  docker: $dockerVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Error: docker is not available" -ForegroundColor Red
        $toolsValid = $false
    }
}

# Check git (only if git initialization is requested)
if ($InitializeGit) {
    try {
        & git --version 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Warning: git is not available (git initialization will be skipped)" -ForegroundColor Yellow
        } else {
            $gitVersion = & git --version 2>&1
            Write-Host "  git: $gitVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Warning: git is not available (git initialization will be skipped)" -ForegroundColor Yellow
    }
}

if (-not $toolsValid) {
    Write-Host ""
    Write-Host "Error: Required tools are missing. Please install them and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Initializing Runtime Copy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Determine target path
# If target directory exists as a subdirectory, use it
# Otherwise, check if we're already in the target directory (has expected structure)
if (Test-Path $TargetDir) {
    $targetPath = (Resolve-Path $TargetDir).Path
} else {
    # Check if current directory has the expected structure
    $currentDir = Get-Location
    $hasFrontend = Test-Path (Join-Path $currentDir "frontend")
    $hasServices = Test-Path (Join-Path $currentDir "services")
    $hasPackageJson = Test-Path (Join-Path $currentDir "package.json")

    if ($hasFrontend -and $hasServices -and $hasPackageJson) {
        Write-Host "Target directory '$TargetDir' not found, but current directory appears to be the project root." -ForegroundColor Yellow
        Write-Host "Using current directory: $currentDir" -ForegroundColor Yellow
        $targetPath = $currentDir.Path
    } else {
        Write-Host "Error: Target directory '$TargetDir' does not exist!" -ForegroundColor Red
        Write-Host "Please run create-runtime-copy.ps1 first to create the copy, or run this script from the project root." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Target: $targetPath" -ForegroundColor Gray
Write-Host ""

# ========================================
# STEP 1: Initialize Git Repository (optional)
# ========================================
if ($InitializeGit) {
    Write-Host "STEP 1: Initializing Git repository..." -ForegroundColor Cyan

    Push-Location $targetPath
    try {
        # Check if already a git repository
        $isGitRepo = Test-Path (Join-Path $targetPath ".git")
        if ($isGitRepo) {
            Write-Host "  Git repository already exists, skipping initialization" -ForegroundColor Yellow
        } else {
            & git init 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Git repository initialized" -ForegroundColor Green

                # Create initial commit
                & git add . 2>&1 | Out-Null
                & git commit -m "Initial commit: Runtime copy of routing-data-layer" 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  Initial commit created" -ForegroundColor Green
                } else {
                    Write-Host "  Warning: Could not create initial commit" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  Warning: Git initialization failed" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "  Warning: Git initialization failed: $($_.Exception.Message)" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
    Write-Host ""
} else {
    Write-Host "STEP 1: Skipping Git initialization (use -InitializeGit to enable)" -ForegroundColor Gray
    Write-Host ""
}

# ========================================
# STEP 2: Install Dependencies
# ========================================
Write-Host "STEP 2: Installing dependencies..." -ForegroundColor Cyan
Write-Host ""

Push-Location $targetPath
try {
    # Validate package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Host "    Error: package.json not found in target directory" -ForegroundColor Red
        throw "package.json not found"
    }

    # Install root dependencies
    Write-Host "  Installing root dependencies..." -ForegroundColor Gray
    $output = & npm install 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    Root dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "    Error: Root dependencies installation failed" -ForegroundColor Red
        Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
        throw "Failed to install root dependencies"
    }

    # Install backend dependencies
    Write-Host "  Installing backend dependencies..." -ForegroundColor Gray
    $backendPath = Join-Path "services" "backend"
    if (-not (Test-Path $backendPath)) {
        Write-Host "    Error: Backend directory not found" -ForegroundColor Red
        throw "Backend directory not found"
    }
    Push-Location $backendPath
    try {
        $output = & npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    Backend dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "    Error: Backend dependencies installation failed" -ForegroundColor Red
            Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
            throw "Failed to install backend dependencies"
        }
    } finally {
        Pop-Location
    }

    # Install shared dependencies
    Write-Host "  Installing shared dependencies..." -ForegroundColor Gray
    $sharedPath = Join-Path "services" "shared"
    if (-not (Test-Path $sharedPath)) {
        Write-Host "    Warning: Shared directory not found, skipping..." -ForegroundColor Yellow
    } else {
        Push-Location $sharedPath
        try {
            $output = & npm install 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    Shared dependencies installed" -ForegroundColor Green
            } else {
                Write-Host "    Error: Shared dependencies installation failed" -ForegroundColor Red
                Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
                throw "Failed to install shared dependencies"
            }
        } finally {
            Pop-Location
        }
    }

    # Install frontend dependencies
    Write-Host "  Installing frontend dependencies..." -ForegroundColor Gray
    Push-Location "frontend"
    try {
        $output = & npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    Frontend dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "    Error: Frontend dependencies installation failed" -ForegroundColor Red
            Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
            throw "Failed to install frontend dependencies"
        }
    } finally {
        Pop-Location
    }

    # Generate Prisma client
    Write-Host "  Generating Prisma client..." -ForegroundColor Gray
    $backendPath = Join-Path "services" "backend"
    $prismaSchemaPath = Join-Path $backendPath (Join-Path "prisma" "schema.prisma")
    if (-not (Test-Path $prismaSchemaPath)) {
        Write-Host "    Warning: Prisma schema not found at $prismaSchemaPath" -ForegroundColor Yellow
        Write-Host "    Skipping Prisma client generation" -ForegroundColor Yellow
    } else {
        Push-Location $backendPath
        try {
            $output = & npx prisma generate 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    Prisma client generated" -ForegroundColor Green
            } else {
                Write-Host "    Warning: Prisma client generation had issues" -ForegroundColor Yellow
                Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
                Write-Host "    You may need to run 'npx prisma generate' manually" -ForegroundColor Yellow
            }
        } finally {
            Pop-Location
        }
    }

} catch {
    Write-Host ""
    Write-Host "Error during dependency installation: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

Write-Host ""

# ========================================
# STEP 3: Database Setup (always runs unless skipped)
# ========================================
if (-not $SkipDatabase) {
    Write-Host "STEP 3: Database setup..." -ForegroundColor Cyan
    Write-Host "  Note: This step requires Docker to be running" -ForegroundColor Gray
    Write-Host ""

    Push-Location $targetPath
    try {
        # Check if Docker is running
        Write-Host "  Checking Docker availability..." -ForegroundColor Gray
        & docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    Error: Docker is not running or not accessible" -ForegroundColor Red
            Write-Host "    Please start Docker Desktop and try again" -ForegroundColor Yellow
            throw "Docker is not available"
        }
        Write-Host "    Docker is available" -ForegroundColor Green

        # Stop and remove existing container if it exists to ensure a fresh start
        Write-Host "  Ensuring fresh container..." -ForegroundColor Gray
        $existingContainer = & docker ps -a --filter "name=routing-data-sqlserver" --format "{{.Names}}" 2>&1
        if ($existingContainer -and $existingContainer -eq "routing-data-sqlserver") {
            Write-Host "    Stopping existing container..." -ForegroundColor Gray
            & docker stop routing-data-sqlserver 2>&1 | Out-Null
            Write-Host "    Removing existing container..." -ForegroundColor Gray
            & docker rm routing-data-sqlserver 2>&1 | Out-Null
            Write-Host "    Existing container removed" -ForegroundColor Green
        }

        # Start database container
        Write-Host "  Creating and starting database container..." -ForegroundColor Gray
        $output = & npm run db:start 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    Database container created and started" -ForegroundColor Green

            # Wait for database to be ready
            Write-Host "  Waiting for database to be ready..." -ForegroundColor Gray
            $output = & npm run db:wait 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    Database is ready" -ForegroundColor Green

                # Run migrations
                Write-Host "  Running migrations..." -ForegroundColor Gray
                $backendPath = Join-Path "services" "backend"
                Push-Location $backendPath
                try {
                    $output = & npx prisma migrate dev --name init 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "    Migrations completed" -ForegroundColor Green
                    } else {
                        Write-Host "    Warning: Migrations had issues" -ForegroundColor Yellow
                        Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
                        Write-Host "    You may need to run 'npx prisma migrate dev' manually" -ForegroundColor Yellow
                    }
                } finally {
                    Pop-Location
                }

            } else {
                Write-Host "    Warning: Database did not become ready in time" -ForegroundColor Yellow
                Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
                Write-Host "    You may need to run 'npm run db:setup' manually" -ForegroundColor Yellow
            }
        } else {
            Write-Host "    Error: Could not create/start database container" -ForegroundColor Red
            Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
            Write-Host "    Make sure Docker is running and try: npm run db:setup" -ForegroundColor Yellow
            throw "Failed to create database container"
        }
    } catch {
        Write-Host "  Error during database setup: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
    Write-Host ""
} else {
    Write-Host "STEP 3: Skipping database setup (use -SkipDatabase to skip)" -ForegroundColor Gray
    Write-Host ""
}

# ========================================
# STEP 4: Run Seeds (runs if database setup succeeded or was skipped)
# ========================================
if (-not $SkipSeeds) {
    Write-Host "STEP 4: Running database seeds..." -ForegroundColor Cyan
    Write-Host ""

    Push-Location $targetPath
    try {
        # Check if seeds script exists
        $packageJsonPath = Join-Path $targetPath "package.json"
        if (-not (Test-Path $packageJsonPath)) {
            Write-Host "  Warning: package.json not found, skipping seeds" -ForegroundColor Yellow
        } else {
            # Check if seeds script is defined
            $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
            if (-not $packageJson.scripts.seeds) {
                Write-Host "  Warning: 'seeds' script not found in package.json, skipping seeds" -ForegroundColor Yellow
            } else {
                # Verify database is accessible (if database setup was not skipped)
                if (-not $SkipDatabase) {
                    Write-Host "  Verifying database connection..." -ForegroundColor Gray
                    $dbCheck = & docker ps --filter "name=routing-data-sqlserver" --format "{{.Status}}" 2>&1
                    if ($LASTEXITCODE -ne 0 -or -not $dbCheck) {
                        Write-Host "    Warning: Database container may not be running" -ForegroundColor Yellow
                        Write-Host "    Seeds may fail if database is not accessible" -ForegroundColor Yellow
                    } else {
                        Write-Host "    Database container is running" -ForegroundColor Green
                    }
                }

                # Run seeds
                Write-Host "  Running seeds..." -ForegroundColor Gray
                $output = & npm run seeds 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "    Seeds completed successfully" -ForegroundColor Green
                } else {
                    Write-Host "    Error: Seeds execution failed" -ForegroundColor Red
                    Write-Host "    Output: $($output -join "`n")" -ForegroundColor Yellow
                    Write-Host "    You may need to run 'npm run seeds' manually after ensuring the database is ready" -ForegroundColor Yellow
                    # Don't fail the entire script if seeds fail, just warn
                }
            }
        }
    } catch {
        Write-Host "  Warning: Error during seeds execution: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "  You may need to run 'npm run seeds' manually" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
    Write-Host ""
} else {
    Write-Host "STEP 4: Skipping seeds (use -SkipSeeds to skip)" -ForegroundColor Gray
    Write-Host ""
}

# ========================================
# Summary
# ========================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "Initialization completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $targetPath" -ForegroundColor Cyan
Write-Host ""

if ($SkipDatabase) {
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. cd $TargetDir" -ForegroundColor White
    Write-Host "  2. npm run db:setup" -ForegroundColor White
    if ($SkipSeeds) {
        Write-Host "  3. npm run seeds" -ForegroundColor White
        Write-Host "  4. npm run dev" -ForegroundColor White
    } else {
        Write-Host "  3. npm run dev" -ForegroundColor White
    }
} else {
    Write-Host "The repository is ready to use!" -ForegroundColor Green
    Write-Host ""
    if ($SkipSeeds) {
        Write-Host "Database has been set up. Seeds were skipped." -ForegroundColor Green
        Write-Host "Run 'npm run seeds' manually if needed." -ForegroundColor Yellow
    } else {
        Write-Host "Database and seeds have been installed." -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "To start development:" -ForegroundColor Cyan
    Write-Host "  cd $TargetDir" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
}

Write-Host ""
