# Script to create a runtime-only copy of the repository
# This copy contains only the files needed to run the solution
# Run initialize-runtime.ps1 after this to set up the copy

param(
    [string]$TargetDirName = "routing-data-layer-runtime",
    [switch]$DryRun = $false,
    [switch]$IncludeTests = $false
)

$ErrorActionPreference = "Stop"

# Find project root by going up from script location until we find required directories
$SourceDir = $PSScriptRoot
$requiredDirs = @("frontend", "services", "shared")
$maxLevels = 5
$level = 0

while ($level -lt $maxLevels) {
    $found = $true
    foreach ($dir in $requiredDirs) {
        if (-not (Test-Path (Join-Path $SourceDir $dir))) {
            $found = $false
            break
        }
    }
    if ($found) {
        break
    }
    $parent = Split-Path $SourceDir -Parent
    if ($parent -eq $SourceDir) {
        # Reached root of filesystem
        break
    }
    $SourceDir = $parent
    $level++
}

$ParentDir = Split-Path $SourceDir -Parent
$TargetDir = Join-Path $ParentDir $TargetDirName

# Calculate source size for comparison (exclude node_modules, etc.)
function Get-DirectorySize($path, $excludeDirs) {
    $size = 0
    try {
        Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object {
                $fullPath = $_.FullName
                -not ($excludeDirs | Where-Object { $fullPath -like "*\$_\*" })
            } |
            ForEach-Object { $size += $_.Length }
    } catch { }
    return $size
}

function Format-FileSize($bytes) {
    if ($bytes -ge 1GB) { return "{0:N2} GB" -f ($bytes / 1GB) }
    if ($bytes -ge 1MB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    if ($bytes -ge 1KB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    return "$bytes bytes"
}

# Remove directory with retry logic for locked files
function Remove-DirectoryForce($path) {
    $maxRetries = 3
    $retryDelay = 2

    for ($i = 0; $i -lt $maxRetries; $i++) {
        try {
            # First attempt: Standard PowerShell Remove-Item
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            return $true
        } catch {
            if ($i -eq $maxRetries - 1) {
                # Last attempt: Try using robocopy to clear the directory
                Write-Host "    Attempting alternative removal method..." -ForegroundColor Yellow
                try {
                    # Create empty temp directory
                    $tempDir = Join-Path $env:TEMP "empty-$(New-Guid)"
                    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

                    # Use robocopy to mirror empty directory (effectively deleting contents)
                    $robocopyArgs = @(
                        "`"$tempDir`"",
                        "`"$path`"",
                        "/MIR",
                        "/NFL",
                        "/NDL",
                        "/NJH",
                        "/NJS"
                    )
                    $null = & robocopy @robocopyArgs 2>&1

                    # Remove the now-empty directory
                    Remove-Item -Path $path -Force -ErrorAction Stop
                    Remove-Item -Path $tempDir -Force -ErrorAction SilentlyContinue
                    return $true
                } catch {
                    Write-Host "    Error: Could not remove directory. Files may be locked by running processes." -ForegroundColor Red
                    Write-Host "    Please close any Node.js processes, IDEs, or file explorers using this directory." -ForegroundColor Yellow
                    Write-Host "    Path: $path" -ForegroundColor Gray
                    throw "Failed to remove directory after $maxRetries attempts: $($_.Exception.Message)"
                }
            } else {
                Write-Host "    Retry $($i + 1)/$maxRetries in $retryDelay seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds $retryDelay
            }
        }
    }
    return $false
}

# Validate required tools
Write-Host "Validating required tools..." -ForegroundColor Cyan
try {
    $null = Get-Command robocopy -ErrorAction Stop
} catch {
    Write-Host "Error: robocopy is not available. This script requires Windows with robocopy." -ForegroundColor Red
    exit 1
}

# Validate source directory structure
Write-Host "Validating source directory..." -ForegroundColor Cyan
$requiredDirs = @("frontend", "services", "shared")
$missingDirs = @()
foreach ($dir in $requiredDirs) {
    $dirPath = Join-Path $SourceDir $dir
    if (-not (Test-Path $dirPath)) {
        $missingDirs += $dir
    }
}
if ($missingDirs.Count -gt 0) {
    Write-Host "Error: Required directories not found in source:" -ForegroundColor Red
    $missingDirs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "Source directory: $SourceDir" -ForegroundColor Gray
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Runtime Copy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $SourceDir" -ForegroundColor Gray
Write-Host "Target: $TargetDir" -ForegroundColor Gray
if ($DryRun) {
    Write-Host "Mode: DRY RUN (no changes will be made)" -ForegroundColor Yellow
}
if ($IncludeTests) {
    Write-Host "Tests: INCLUDED" -ForegroundColor Gray
} else {
    Write-Host "Tests: EXCLUDED (use -IncludeTests to include)" -ForegroundColor Gray
}
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN - Would perform the following actions:" -ForegroundColor Yellow
    Write-Host ""
}

# Remove target directory if it exists
if (Test-Path $TargetDir) {
    if ($DryRun) {
        Write-Host "  Would remove existing target directory" -ForegroundColor Yellow
    } else {
        Write-Host "Removing existing target directory..." -ForegroundColor Yellow
        Remove-DirectoryForce -path $TargetDir
    }
}

# Create target directory
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# Directories to copy (all contents)
$DirectoriesToCopy = @(
    "frontend",
    "services",
    "shared",
    "infrastructure",
    "scripts",
    "seeds",
    "migrations"
)

# Files to copy from root
$FilesToCopy = @(
    "package.json",
    "package-lock.json",
    ".gitignore",
    ".editorconfig",
    ".hintrc",
    "routing-data-layer.code-workspace"
)

# ========================================
# STEP 1: Copy Files
# ========================================
Write-Host "Copying directories (excluding node_modules and build artifacts)..." -ForegroundColor Cyan
foreach ($dir in $DirectoriesToCopy) {
    $sourcePath = Join-Path $SourceDir $dir
    $targetPath = Join-Path $TargetDir $dir

    if (Test-Path $sourcePath) {
        if ($DryRun) {
            Write-Host "  Would copy $dir" -ForegroundColor Gray
            continue
        }

        Write-Host "  Copying $dir..." -ForegroundColor Gray

        # Verify source exists and is accessible
        if (-not (Test-Path $sourcePath)) {
            Write-Host "    Error: Source path does not exist: $sourcePath" -ForegroundColor Red
            continue
        }

        # Ensure target directory exists (robocopy works better when destination exists)
        if (-not (Test-Path $targetPath)) {
            try {
                New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
            } catch {
                Write-Host "    Error: Failed to create target directory: $($_.Exception.Message)" -ForegroundColor Red
                continue
            }
        }

        # Use robocopy with exclusions for better long path handling
        # Note: robocopy copies contents of source INTO destination
        # Use unquoted paths in array - PowerShell handles quoting automatically
        $robocopyArgs = @(
            $sourcePath,
            $targetPath,
            "/E",                    # Copy subdirectories including empty ones
            "/XD", "node_modules",   # Exclude node_modules
            "/XD", "dist",           # Exclude dist
            "/XD", "build",          # Exclude build
            "/XD", ".next",          # Exclude .next
            "/XD", "out",            # Exclude out
            "/XD", "coverage",       # Exclude coverage
            "/XD", ".nyc_output",    # Exclude .nyc_output
            "/XD", ".prisma",        # Exclude .prisma
            "/XD", ".turbo",         # Exclude turbo cache
            "/XD", "__pycache__",    # Exclude Python cache
            "/XF", "*.log",          # Exclude log files
            "/XF", "*.bak",          # Exclude backup files
            "/NFL",                  # No file list
            "/NDL",                  # No directory list
            "/NJH",                  # No job header
            "/NJS"                   # No job summary
        )

        # Exclude test files if not including tests
        if (-not $IncludeTests) {
            $robocopyArgs += @("/XF", "*.spec.ts", "/XF", "*.test.ts", "/XF", "*.spec.tsx", "/XF", "*.test.tsx")
        }

        $robocopyOutput = & robocopy @robocopyArgs 2>&1
        $exitCode = $LASTEXITCODE

        # Robocopy exit codes are bitwise flags:
        # 0 = No files copied, no errors
        # 1 = Files copied successfully
        # 2 = Extra files in destination
        # 4 = Mismatched files
        # 8 = Copy errors occurred
        # 16 = Serious error (no files copied)
        # Exit codes can be combined (bitwise OR)

        if ($exitCode -eq 0) {
            Write-Host "    Completed (no files to copy)" -ForegroundColor Gray
        } elseif ($exitCode -eq 1) {
            Write-Host "    Completed" -ForegroundColor Green
        } elseif (($exitCode -band 16) -eq 16) {
            # Serious error - check if directory was actually created and has files
            if (Test-Path $targetPath) {
                $fileCount = (Get-ChildItem -Path $targetPath -Recurse -File -ErrorAction SilentlyContinue).Count
                if ($fileCount -gt 0) {
                    Write-Host "    Completed with warnings (exit code: $exitCode, $fileCount files copied)" -ForegroundColor Yellow
                } else {
                    Write-Host "    Error: Serious robocopy error - no files copied (exit code: $exitCode)" -ForegroundColor Red
                    # Show robocopy output for debugging
                    $errorOutput = $robocopyOutput | Select-Object -First 5
                    if ($errorOutput) {
                        Write-Host "    Robocopy output:" -ForegroundColor Yellow
                        $errorOutput | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
                    }
                    Write-Host "    Source: $sourcePath" -ForegroundColor Gray
                    Write-Host "    Target: $targetPath" -ForegroundColor Gray
                }
            } else {
                Write-Host "    Error: Target directory was not created (exit code: $exitCode)" -ForegroundColor Red
                # Show robocopy output for debugging
                $errorOutput = $robocopyOutput | Select-Object -First 5
                if ($errorOutput) {
                    Write-Host "    Robocopy output:" -ForegroundColor Yellow
                    $errorOutput | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
                }
                Write-Host "    Source: $sourcePath" -ForegroundColor Gray
                Write-Host "    Target: $targetPath" -ForegroundColor Gray
                Write-Host "    Attempting to create target directory manually..." -ForegroundColor Yellow
                try {
                    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
                    Write-Host "    Target directory created, but robocopy still failed" -ForegroundColor Yellow
                } catch {
                    Write-Host "    Failed to create target directory: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        } elseif ($exitCode -ge 8) {
            # Other errors (8, 12, etc.) - files may have been copied
            if (Test-Path $targetPath) {
                $fileCount = (Get-ChildItem -Path $targetPath -Recurse -File -ErrorAction SilentlyContinue).Count
                Write-Host "    Completed with warnings (exit code: $exitCode, $fileCount files copied)" -ForegroundColor Yellow
            } else {
                Write-Host "    Warning: Some files may not have been copied (exit code: $exitCode)" -ForegroundColor Yellow
            }
        } else {
            # Exit codes 2-7 are generally OK (extra files, mismatches, etc.)
            Write-Host "    Completed" -ForegroundColor Green
        }
    } else {
        Write-Host "  Warning: $dir not found, skipping..." -ForegroundColor Yellow
    }
}

# Copy files
Write-Host "Copying root files..." -ForegroundColor Cyan
foreach ($file in $FilesToCopy) {
    $sourcePath = Join-Path $SourceDir $file
    $targetPath = Join-Path $TargetDir $file

    if (Test-Path $sourcePath) {
        if ($DryRun) {
            Write-Host "  Would copy $file" -ForegroundColor Gray
        } else {
            Write-Host "  Copying $file..." -ForegroundColor Gray
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
        }
    } else {
        Write-Host "  Warning: $file not found, skipping..." -ForegroundColor Yellow
    }
}

# Copy .env files from root (if they exist)
Write-Host "Copying .env files from root..." -ForegroundColor Cyan
$envFiles = @(".env", ".env.local", ".env.development", ".env.production")
foreach ($envFile in $envFiles) {
    $sourcePath = Join-Path $SourceDir $envFile
    $targetPath = Join-Path $TargetDir $envFile

    if (Test-Path $sourcePath) {
        if ($DryRun) {
            Write-Host "  Would copy $envFile" -ForegroundColor Gray
        } else {
            Write-Host "  Copying $envFile..." -ForegroundColor Gray
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
        }
    }
}

# Copy .env files from backend (if they exist)
Write-Host "Copying .env files from backend..." -ForegroundColor Cyan
$backendEnvPath = Join-Path $SourceDir (Join-Path "services" "backend")
$backendTargetPath = Join-Path $TargetDir (Join-Path "services" "backend")
$backendEnvFiles = @(".env", ".env.local", ".env.development", ".env.production", ".env.example")
foreach ($envFile in $backendEnvFiles) {
    $sourcePath = Join-Path $backendEnvPath $envFile
    $targetPath = Join-Path $backendTargetPath $envFile

    if (Test-Path $sourcePath) {
        if ($DryRun) {
            Write-Host "  Would copy services/backend/$envFile" -ForegroundColor Gray
        } else {
            # Ensure target directory exists
            if (-not (Test-Path $backendTargetPath)) {
                New-Item -ItemType Directory -Path $backendTargetPath -Force | Out-Null
            }
            Write-Host "  Copying services/backend/$envFile..." -ForegroundColor Gray
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
        }
    }
}

# Copy the initialization scripts
$initScripts = @("initialize-runtime.ps1")
Write-Host "Copying initialization scripts..." -ForegroundColor Cyan
foreach ($initScript in $initScripts) {
    $initSourcePath = Join-Path $SourceDir $initScript
    if (Test-Path $initSourcePath) {
        if ($DryRun) {
            Write-Host "  Would copy $initScript" -ForegroundColor Gray
        } else {
            Write-Host "  Copying $initScript..." -ForegroundColor Gray
            Copy-Item -Path $initSourcePath -Destination (Join-Path $TargetDir $initScript) -Force
        }
    }
}

# ========================================
# STEP 2: Clean up documentation files
# ========================================
Write-Host ""
Write-Host "Cleaning up documentation files..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  Would remove documentation and agent configuration files" -ForegroundColor Gray
} else {
    # Remove .md files from root of copied directories
    $mdFilesToRemove = @(
        "AGENTS.md",
        "CLAUDE.md",
        "WARP.md",
        "LEGACY_CODE_REPORT.md",
        "Comprehensive Flow Designer UI Improvements - Full Implementation Plan.md"
    )

    foreach ($mdFile in $mdFilesToRemove) {
        $filePath = Join-Path $TargetDir $mdFile
        if (Test-Path $filePath) {
            Write-Host "  Removing $mdFile..." -ForegroundColor Gray
            Remove-Item -Path $filePath -Force
        }
    }
}

if (-not $DryRun) {
    # Remove documentation directories from frontend
    $frontendDocsToRemove = @(
        (Join-Path "frontend" "docs"),
        (Join-Path "frontend" "AGENTS.md"),
        (Join-Path "frontend" "MIGRATION_GUIDE.md"),
        (Join-Path "frontend" "TEST_COVERAGE_SUMMARY.md"),
        (Join-Path "frontend" "UI-GUIDE.md"),
        (Join-Path "frontend" "WARP.md"),
        (Join-Path "frontend" "type-errors.txt"),
        (Join-Path "frontend" "typecheck-errors.txt")
    )

    foreach ($item in $frontendDocsToRemove) {
        $itemPath = Join-Path $TargetDir $item
        if (Test-Path $itemPath) {
            Write-Host "  Removing $item..." -ForegroundColor Gray
            Remove-Item -Path $itemPath -Recurse -Force
        }
    }

    # Remove .md files from services/backend (keep only essential ones)
    $backendDocsToRemove = @(
        (Join-Path "services" (Join-Path "backend" (Join-Path "src" (Join-Path "auth" "README.md")))),
        (Join-Path "services" (Join-Path "backend" (Join-Path "prisma" "deprecated_old_design")))
    )

    foreach ($item in $backendDocsToRemove) {
        $itemPath = Join-Path $TargetDir $item
        if (Test-Path $itemPath) {
            Write-Host "  Removing $item..." -ForegroundColor Gray
            Remove-Item -Path $itemPath -Recurse -Force
        }
    }

    # Remove any .md files from services/backend/src/modules/*/AGENTS.md (module-specific agent files)
    $modulesPath = Join-Path $TargetDir (Join-Path "services" (Join-Path "backend" (Join-Path "src" "modules")))
    if (Test-Path $modulesPath) {
        $moduleAgentFiles = Get-ChildItem -Path $modulesPath -Filter "AGENTS.md" -Recurse -ErrorAction SilentlyContinue
        foreach ($file in $moduleAgentFiles) {
            Write-Host "  Removing $($file.FullName.Replace($TargetDir, ''))..." -ForegroundColor Gray
            Remove-Item -Path $file.FullName -Force
        }
    }

    # Remove any .md files from frontend/src (if any)
    $frontendSrcPath = Join-Path $TargetDir (Join-Path "frontend" "src")
    if (Test-Path $frontendSrcPath) {
        $frontendSrcDocs = Get-ChildItem -Path $frontendSrcPath -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
        foreach ($file in $frontendSrcDocs) {
            Write-Host "  Removing $($file.FullName.Replace($TargetDir, ''))..." -ForegroundColor Gray
            Remove-Item -Path $file.FullName -Force
        }
    }

    # Remove design documentation from services/backend/docs
    $backendDocsPath = Join-Path $TargetDir (Join-Path "services" (Join-Path "backend" "docs"))
    if (Test-Path $backendDocsPath) {
        $backendDesignDocs = Get-ChildItem -Path $backendDocsPath -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
        foreach ($file in $backendDesignDocs) {
            Write-Host "  Removing design doc: $($file.FullName.Replace($TargetDir, ''))..." -ForegroundColor Gray
            Remove-Item -Path $file.FullName -Force
        }
    }

    # Remove auth implementation documentation (keep ROLES.md as it's useful for runtime)
    $authDocsToRemove = @(
        (Join-Path "services" (Join-Path "backend" (Join-Path "src" (Join-Path "auth" "DEV_AUTH.md")))),
        (Join-Path "services" (Join-Path "backend" (Join-Path "src" (Join-Path "auth" "INTEGRATION_GUIDE.md"))))
    )

    foreach ($item in $authDocsToRemove) {
        $itemPath = Join-Path $TargetDir $item
        if (Test-Path $itemPath) {
            Write-Host "  Removing $item..." -ForegroundColor Gray
            Remove-Item -Path $itemPath -Force
        }
    }

    # Remove legacy import scripts (if they're not needed)
    $legacyFiles = @(
        "import_globalLines",
        "import_segmentDic.js",
        "NALLAPP.session.sql"
    )

    foreach ($file in $legacyFiles) {
        $filePath = Join-Path $TargetDir $file
        if (Test-Path $filePath) {
            Write-Host "  Removing legacy file: $file..." -ForegroundColor Gray
            Remove-Item -Path $filePath -Force
        }
    }
}

# ========================================
# STEP 3: Create README
# ========================================
Write-Host ""
Write-Host "Creating README..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  Would create README.md" -ForegroundColor Gray
} else {
    $runtimeReadme = @'
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
'@

    $readmePath = Join-Path $TargetDir "README.md"
    Set-Content -Path $readmePath -Value $runtimeReadme
    Write-Host "  README.md created" -ForegroundColor Green
}

# ========================================
# Summary
# ========================================
Write-Host ""

if ($DryRun) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "DRY RUN COMPLETE - No changes made" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run without -DryRun to create the runtime copy" -ForegroundColor Cyan
} else {
    # Calculate and display size information
    $excludeDirs = @("node_modules", "dist", "build", ".next", "coverage", ".nyc_output", ".prisma", ".git")
    $targetSize = Get-DirectorySize $TargetDir $excludeDirs

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Runtime copy created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Location: $((Resolve-Path $TargetDir).Path)" -ForegroundColor Cyan
    Write-Host "Size: $(Format-FileSize $targetSize)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step: Initialize the copy" -ForegroundColor Yellow
    Write-Host "  cd `"$TargetDir`"" -ForegroundColor White
    Write-Host "  .\initialize-runtime.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Gray
    Write-Host "  -SkipDatabase    Skip Docker/database setup" -ForegroundColor Gray
    Write-Host "  -InitializeGit   Initialize as new git repository" -ForegroundColor Gray
}
Write-Host ""
