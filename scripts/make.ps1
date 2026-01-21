# Routing Data Layer - Unified Automation Script
# Usage: .\scripts\make.ps1 <command> [options]

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [string]$Server,
    [string]$Database,
    [string]$Username,
    [string]$Password
)

$ErrorActionPreference = "Stop"

function Get-EnvVarFromFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Key
    )

    if (-not (Test-Path $Path)) { return $null }

    $lines = Get-Content $Path -ErrorAction Stop
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }

        if ($trimmed -match "^\s*$([Regex]::Escape($Key))\s*=\s*(.+)\s*$") {
            $value = $matches[1].Trim()
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            return $value
        }
    }

    return $null
}

function New-AzureSafeSqlFile {
    param(
        [Parameter(Mandatory = $true)][string]$InputPath,
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [Parameter(Mandatory = $true)][bool]$IsAzureSql
    )

    if (-not $IsAzureSql) {
        Copy-Item -Force $InputPath $OutputPath
        return
    }

    $content = Get-Content -LiteralPath $InputPath -Raw
    # Remove lines that start with USE (case-insensitive), keep everything else
    $content = [Regex]::Replace($content, "(?im)^\s*USE\s+.+?\s*;\s*$", "")
    $content = [Regex]::Replace($content, "(?im)^\s*USE\s+.+?\s*$", "")
    Set-Content -LiteralPath $OutputPath -Value $content -Encoding UTF8
}

function Parse-DatabaseUrl {
    param(
        [Parameter(Mandatory = $true)][string]$DatabaseUrl
    )

    $result = @{
        Server   = $null
        Port     = $null
        Database = $null
        Username = $null
        Password = $null
    }

    # ADO-style connection string
    if ($DatabaseUrl -match "(?i)\bServer\s*=" -and $DatabaseUrl -match "(?i)\bDatabase\s*=") {
        $builder = New-Object System.Data.Common.DbConnectionStringBuilder
        $builder.ConnectionString = $DatabaseUrl

        $serverValue = $null
        if ($builder.ContainsKey("Server")) { $serverValue = [string]$builder["Server"] }
        elseif ($builder.ContainsKey("Data Source")) { $serverValue = [string]$builder["Data Source"] }

        if ($serverValue) {
            $serverValue = $serverValue -replace "^(?i)tcp:\s*", ""
            if ($serverValue -match "^(?<host>[^,]+),(?<port>\d+)$") {
                $result.Server = $matches["host"]
                $result.Port = $matches["port"]
            } else {
                $result.Server = $serverValue
            }
        }

        if ($builder.ContainsKey("Database")) { $result.Database = [string]$builder["Database"] }
        elseif ($builder.ContainsKey("Initial Catalog")) { $result.Database = [string]$builder["Initial Catalog"] }

        if ($builder.ContainsKey("User ID")) { $result.Username = [string]$builder["User ID"] }
        elseif ($builder.ContainsKey("UID")) { $result.Username = [string]$builder["UID"] }

        if ($builder.ContainsKey("Password")) { $result.Password = [string]$builder["Password"] }
        elseif ($builder.ContainsKey("PWD")) { $result.Password = [string]$builder["PWD"] }

        return $result
    }

    # URL-ish forms
    # A) scheme://server:port;database=DB;user=U;password=P;...
    # B) scheme://user:pass@server:port;database=DB;...
    $patternA = '^(?<scheme>[^:]+)://(?<server>[^:;@/]+)(?::(?<port>\d+))?;(?<rest>.+)$'
    $patternB = '^(?<scheme>[^:]+)://(?<user>[^:;@/]+):(?<pass>[^;@/]+)@(?<server>[^:;@/]+)(?::(?<port>\d+))?;(?<rest>.+)$'

    $serverValue2 = $null
    $portValue2 = $null
    $userValue2 = $null
    $passValue2 = $null
    $restValue2 = $null

    if ($DatabaseUrl -match $patternB) {
        $serverValue2 = $matches["server"]
        $portValue2 = $matches["port"]
        $userValue2 = $matches["user"]
        $passValue2 = $matches["pass"]
        $restValue2 = $matches["rest"]
    } elseif ($DatabaseUrl -match $patternA) {
        $serverValue2 = $matches["server"]
        $portValue2 = $matches["port"]
        $restValue2 = $matches["rest"]
    } else {
        return $null
    }

    $result.Server = $serverValue2
    if ($portValue2) { $result.Port = $portValue2 }
    if ($userValue2) { $result.Username = $userValue2 }
    if ($passValue2) { $result.Password = $passValue2 }

    $pairs = $restValue2 -split ";"
    foreach ($pair in $pairs) {
        if ($pair -match "^\s*(?<k>[^=]+?)\s*=\s*(?<v>.*)\s*$") {
            $k = $matches["k"].Trim().ToLowerInvariant()
            $v = $matches["v"].Trim()
            if ($k -eq "database" -or $k -eq "initial catalog") { $result.Database = $v }
            elseif ($k -eq "user" -or $k -eq "user id" -or $k -eq "uid") { if (-not $result.Username) { $result.Username = $v } }
            elseif ($k -eq "password" -or $k -eq "pwd") { if (-not $result.Password) { $result.Password = $v } }
            elseif ($k -eq "server") { if (-not $result.Server) { $result.Server = $v } }
            elseif ($k -eq "port") { if (-not $result.Port) { $result.Port = $v } }
        }
    }

    return $result
}

function Get-DatabaseConnection {
    param(
        [string]$Server,
        [string]$Database,
        [string]$Username,
        [string]$Password
    )

    if ($Server -and $Database -and $Username -and $Password) {
        return @{
            Server   = $Server
            Database = $Database
            Username = $Username
            Password = $Password
        }
    }

    if ($env:DATABASE_URL) {
        Write-Host "Reading DATABASE_URL from process environment..." -ForegroundColor Yellow
        $parsed = Parse-DatabaseUrl -DatabaseUrl $env:DATABASE_URL
        if ($parsed -and $parsed.Server -and $parsed.Database -and $parsed.Username -and $parsed.Password) {
            return $parsed
        }
    }

    Write-Host "Reading DATABASE_URL from services/backend/.env..." -ForegroundColor Yellow
    $databaseUrlFromFile = Get-EnvVarFromFile -Path "services/backend/.env" -Key "DATABASE_URL"
    if ($databaseUrlFromFile) {
        $parsed2 = Parse-DatabaseUrl -DatabaseUrl $databaseUrlFromFile
        if ($parsed2 -and $parsed2.Server -and $parsed2.Database -and $parsed2.Username -and $parsed2.Password) {
            return $parsed2
        }
    }

    Write-Host "Could not parse DATABASE_URL from .env" -ForegroundColor Red
    Write-Host "Provide connection details manually:" -ForegroundColor Yellow
    $serverInput = Read-Host "Server name"
    $databaseInput = Read-Host "Database name"
    $usernameInput = Read-Host "Username"
    $passwordSecure = Read-Host "Password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordSecure)
    )

    return @{
        Server   = $serverInput
        Database = $databaseInput
        Username = $usernameInput
        Password = $passwordPlain
    }
}

function Assert-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Name)

    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "Required command not found on PATH: $Name" -ForegroundColor Red
        exit 1
    }
}

function Get-SqlcmdPath {
    $cmd = Get-Command "sqlcmd" -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

function Assert-SqlcmdAvailable {
    $sqlcmdPath = Get-SqlcmdPath
    if (-not $sqlcmdPath) {
        Write-Host "Required command not found on PATH: sqlcmd" -ForegroundColor Red
        Write-Host "Fix options:" -ForegroundColor Yellow
        Write-Host "1) Install Microsoft sqlcmd" -ForegroundColor Yellow
        Write-Host "2) Or install SQL Server Command Line Utilities / ODBC tools" -ForegroundColor Yellow
        Write-Host "After install, restart your terminal so PATH is refreshed." -ForegroundColor Yellow
        exit 1
    }
}

function Invoke-SqlcmdWithRetry {
    param(
        [Parameter(Mandatory = $true)][string[]]$SqlcmdArgs,
        [int]$MaxAttempts = 24,
        [int]$DelaySeconds = 5
    )

    Assert-SqlcmdAvailable

    $attempt = 1
    while ($attempt -le $MaxAttempts) {
        $output = $null
        $exitCode = 0

        try {
            $output = & sqlcmd @SqlcmdArgs 2>&1
            $exitCode = $LASTEXITCODE
        } catch {
            $output = "$_.Exception"
            $exitCode = 1
        }

        if ($exitCode -eq 0) {
            return $output
        }

        if ($attempt -ge $MaxAttempts) {
            $msg = ($output | Out-String).Trim()
            if (-not $msg) { $msg = "Unknown sqlcmd failure" }
            Write-Host "sqlcmd failed after $MaxAttempts attempts. Last output:" -ForegroundColor Red
            Write-Host $msg -ForegroundColor Red
            throw "sqlcmd failed"
        }

        if ($attempt -le 3) {
            $msg = ($output | Out-String).Trim()
            if ($msg) {
                Write-Host "Error (attempt $attempt): $msg" -ForegroundColor Yellow
            }
        }

        Write-Host "sqlcmd attempt $attempt/$MaxAttempts failed. Retrying in $DelaySeconds seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds $DelaySeconds
        $attempt++
    }
}

function Get-EngineEdition {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Conn
    )

    $portPart = if ($Conn.Port) { ",$($Conn.Port)" } else { "" }

    $probeArgs = @(
        "-S", "$($Conn.Server)$portPart",
        "-d", $Conn.Database,
        "-U", $Conn.Username,
        "-P", $Conn.Password,
        "-b",
        "-Q", "SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('EngineEdition') AS INT) AS EngineEdition;"
    )

    try {
        $output = Invoke-SqlcmdWithRetry -SqlcmdArgs $probeArgs -MaxAttempts 2 -DelaySeconds 1
        $text = ($output | Out-String)

        if ($text -match "^\s*(\d+)\s*$") {
            return [int]$matches[1]
        }

        if ($text -match "EngineEdition\s*[\r\n]+[-]+\s*[\r\n]+\s*(\d+)\s*") {
            return [int]$matches[1]
        }
    } catch { }

    return $null
}

function Test-IsAzureSqlDatabase {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Conn
    )

    $engineEdition = Get-EngineEdition -Conn $Conn
    if ($engineEdition -eq 5) { return $true } # Azure SQL Database

    if ($Conn.Server -match "\.database\.windows\.net") { return $true }
    return $false
}

function Invoke-SqlFileWithRetrySafe {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Conn,
        [Parameter(Mandatory = $true)][string]$InputSqlPath,
        [int]$MaxAttempts = 12,
        [int]$DelaySeconds = 5
    )

    $portPart = if ($Conn.Port) { ",$($Conn.Port)" } else { "" }
    $isAzureSqlDb = Test-IsAzureSqlDatabase -Conn $Conn

    $sqlToRun = $InputSqlPath
    if ($isAzureSqlDb) {
        $safePath = [IO.Path]::ChangeExtension($InputSqlPath, ".azure.sql")
        New-AzureSafeSqlFile -InputPath $InputSqlPath -OutputPath $safePath -IsAzureSql $true
        $sqlToRun = $safePath
    }

    $sqlcmdArgs = @(
        "-S", "$($Conn.Server)$portPart",
        "-d", $Conn.Database,
        "-U", $Conn.Username,
        "-P", $Conn.Password,
        "-b",
        "-i", $sqlToRun
    )

    Invoke-SqlcmdWithRetry -SqlcmdArgs $sqlcmdArgs -MaxAttempts $MaxAttempts -DelaySeconds $DelaySeconds | Out-Null
}

function Wait-ForSqlServerReady {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Conn,
        [int]$MaxAttempts = 24,
        [int]$DelaySeconds = 5
    )

    $portPart = if ($Conn.Port) { ",$($Conn.Port)" } else { "" }

    $probeArgs = @(
        "-S", "$($Conn.Server)$portPart",
        "-d", $Conn.Database,
        "-U", $Conn.Username,
        "-P", $Conn.Password,
        "-b",
        "-Q", "SELECT 1"
    )

    Write-Host "Waiting for SQL Server to be ready (max $MaxAttempts attempts, $DelaySeconds sec delay)..." -ForegroundColor Yellow
    Invoke-SqlcmdWithRetry -SqlcmdArgs $probeArgs -MaxAttempts $MaxAttempts -DelaySeconds $DelaySeconds | Out-Null
    Write-Host "SQL Server is reachable." -ForegroundColor Green
}

function Apply-ManualSqlScripts {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Conn
    )

    Write-Host ""
    Write-Host "Applying manual SQL scripts..." -ForegroundColor Yellow

    $indexesPath = "services/backend/prisma/migrations/manual_add_filtered_indexes.sql"
    if (Test-Path $indexesPath) {
        Write-Host "  [1/3] Applying filtered indexes..." -ForegroundColor Cyan
        try {
            Invoke-SqlFileWithRetrySafe -Conn $Conn -InputSqlPath $indexesPath -MaxAttempts 3 -DelaySeconds 2
            Write-Host "  OK: Filtered indexes applied" -ForegroundColor Green
        } catch {
            Write-Host "  FAIL: Filtered indexes failed: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    } else {
        Write-Host "  FAIL: Script not found: $indexesPath" -ForegroundColor Red
    }

    $triggersPath = "services/backend/prisma/migrations/manual_add_triggers.sql"
    if (Test-Path $triggersPath) {
        Write-Host "  [2/3] Applying database triggers..." -ForegroundColor Cyan
        try {
            Invoke-SqlFileWithRetrySafe -Conn $Conn -InputSqlPath $triggersPath -MaxAttempts 3 -DelaySeconds 2
            Write-Host "  OK: Database triggers applied" -ForegroundColor Green
        } catch {
            Write-Host "  WARN: Triggers failed (optional): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  WARN: Script not found (optional): $triggersPath" -ForegroundColor Yellow
    }

    $constraintsPath = "services/backend/prisma/migrations/fix_default_constraints.sql"
    if (Test-Path $constraintsPath) {
        Write-Host "  [3/3] Applying default constraints..." -ForegroundColor Cyan
        try {
            Invoke-SqlFileWithRetrySafe -Conn $Conn -InputSqlPath $constraintsPath -MaxAttempts 3 -DelaySeconds 2
            Write-Host "  OK: Default constraints applied" -ForegroundColor Green
        } catch {
            Write-Host "  WARN: Default constraints failed (optional): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  WARN: Script not found (optional): $constraintsPath" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Manual SQL scripts completed" -ForegroundColor Green
}

function New-FullDatabaseWipeSql {
    $lines = @(
        "SET NOCOUNT ON;",
        "SET ANSI_WARNINGS OFF;",
        "DECLARE @sql NVARCHAR(MAX) = N'';",
        "DECLARE @errorCount INT = 0;",

        "-- Drop foreign keys (user tables only)",
        "SELECT @sql += N'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name) +",
        "    N' DROP CONSTRAINT ' + QUOTENAME(fk.name) + N';' + CHAR(13)",
        "FROM sys.foreign_keys fk",
        "JOIN sys.tables t ON fk.parent_object_id = t.object_id",
        "WHERE t.is_ms_shipped = 0;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop check constraints (user tables only)",
        "SELECT @sql += N'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name) +",
        "    N' DROP CONSTRAINT ' + QUOTENAME(c.name) + N';' + CHAR(13)",
        "FROM sys.check_constraints c",
        "JOIN sys.tables t ON c.parent_object_id = t.object_id",
        "WHERE t.is_ms_shipped = 0;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop default constraints (user tables only)",
        "SELECT @sql += N'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name) +",
        "    N' DROP CONSTRAINT ' + QUOTENAME(d.name) + N';' + CHAR(13)",
        "FROM sys.default_constraints d",
        "JOIN sys.tables t ON d.parent_object_id = t.object_id",
        "WHERE t.is_ms_shipped = 0;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop views (user-created only)",
        "SELECT @sql += N'DROP VIEW ' + QUOTENAME(SCHEMA_NAME(v.schema_id)) + N'.' + QUOTENAME(v.name) + N';' + CHAR(13)",
        "FROM sys.views v",
        "WHERE v.is_ms_shipped = 0",
        "  AND SCHEMA_NAME(v.schema_id) NOT IN ('sys', 'INFORMATION_SCHEMA');",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop procedures (user-created only)",
        "SELECT @sql += N'DROP PROCEDURE ' + QUOTENAME(SCHEMA_NAME(p.schema_id)) + N'.' + QUOTENAME(p.name) + N';' + CHAR(13)",
        "FROM sys.procedures p",
        "WHERE p.is_ms_shipped = 0;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop functions (user-created only)",
        "SELECT @sql += N'DROP FUNCTION ' + QUOTENAME(SCHEMA_NAME(o.schema_id)) + N'.' + QUOTENAME(o.name) + N';' + CHAR(13)",
        "FROM sys.objects o",
        "WHERE o.type IN ('FN','IF','TF','FS','FT') AND o.is_ms_shipped = 0;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop sequences (user-created only)",
        "SELECT @sql += N'DROP SEQUENCE ' + QUOTENAME(SCHEMA_NAME(s.schema_id)) + N'.' + QUOTENAME(s.name) + N';' + CHAR(13)",
        "FROM sys.sequences s",
        "WHERE SCHEMA_NAME(s.schema_id) NOT IN ('sys', 'INFORMATION_SCHEMA');",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop synonyms (user-created only)",
        "SELECT @sql += N'DROP SYNONYM ' + QUOTENAME(SCHEMA_NAME(sn.schema_id)) + N'.' + QUOTENAME(sn.name) + N';' + CHAR(13)",
        "FROM sys.synonyms sn",
        "WHERE SCHEMA_NAME(sn.schema_id) NOT IN ('sys', 'INFORMATION_SCHEMA');",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop tables (user-created only)",
        "SELECT @sql += N'DROP TABLE ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name) + N';' + CHAR(13)",
        "FROM sys.tables t",
        "WHERE t.is_ms_shipped = 0",
        "  AND SCHEMA_NAME(t.schema_id) NOT IN ('sys', 'INFORMATION_SCHEMA');",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop user-defined types",
        "SELECT @sql += N'DROP TYPE ' + QUOTENAME(SCHEMA_NAME(tt.schema_id)) + N'.' + QUOTENAME(tt.name) + N';' + CHAR(13)",
        "FROM sys.types tt",
        "WHERE tt.is_user_defined = 1;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",
        "SET @sql = N'';",

        "-- Drop non-system schemas (keep dbo/sys/INFORMATION_SCHEMA)",
        "SELECT @sql += N'DROP SCHEMA ' + QUOTENAME(s.name) + N';' + CHAR(13)",
        "FROM sys.schemas s",
        "WHERE s.name NOT IN ('dbo','sys','INFORMATION_SCHEMA')",
        "  AND s.schema_id < 16384;",
        "IF (@sql <> N'') BEGIN",
        "  BEGIN TRY EXEC sp_executesql @sql; END TRY",
        "  BEGIN CATCH SET @errorCount = @errorCount + 1; END CATCH",
        "END",

        "IF @errorCount > 0",
        "  PRINT 'Full database wipe completed with ' + CAST(@errorCount AS VARCHAR(10)) + ' errors (system objects skipped).';",
        "ELSE",
        "  PRINT 'Full database wipe completed successfully.';"
    )

    return ($lines -join "`n")
}

function Invoke-CreateOrWipeDatabase {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Conn,
        [int]$MaxAttempts = 24,
        [int]$DelaySeconds = 5
    )

    $portPart = if ($Conn.Port) { ",$($Conn.Port)" } else { "" }
    $isAzureSql = Test-IsAzureSqlDatabase -Conn $Conn

    if ($isAzureSql) {
        Write-Host "Azure SQL Database detected - using in-database wipe (DROP DATABASE not supported)" -ForegroundColor Yellow
        $wipeSql = New-FullDatabaseWipeSql
        $tempWipe = "services/backend/temp_db_full_wipe.sql"
        $wipeSql | Out-File -FilePath $tempWipe -Encoding UTF8

        Invoke-SqlFileWithRetrySafe -Conn $Conn -InputSqlPath $tempWipe -MaxAttempts $MaxAttempts -DelaySeconds $DelaySeconds
        return
    }

    $escapedDb = $Conn.Database.Replace("'", "''")

    $dropCreateSql = @(
        "SET NOCOUNT ON;",
        "DECLARE @db sysname = N'$escapedDb';",
        "IF DB_ID(@db) IS NULL BEGIN",
        "  PRINT 'Database does not exist, creating: ' + @db;",
        "  EXEC('CREATE DATABASE ' + QUOTENAME(@db) + ';');",
        "END ELSE BEGIN",
        "  PRINT 'Dropping database: ' + @db;",
        "  EXEC('ALTER DATABASE ' + QUOTENAME(@db) + ' SET SINGLE_USER WITH ROLLBACK IMMEDIATE;');",
        "  EXEC('DROP DATABASE ' + QUOTENAME(@db) + ';');",
        "  EXEC('CREATE DATABASE ' + QUOTENAME(@db) + ';');",
        "END"
    ) -join "`n"

    $tempDropCreate = "services/backend/temp_db_drop_create.sql"
    $dropCreateSql | Out-File -FilePath $tempDropCreate -Encoding UTF8

    $masterArgs = @(
        "-S", "$($Conn.Server)$portPart",
        "-d", "master",
        "-U", $Conn.Username,
        "-P", $Conn.Password,
        "-b",
        "-i", $tempDropCreate
    )

    try {
        Invoke-SqlcmdWithRetry -SqlcmdArgs $masterArgs -MaxAttempts $MaxAttempts -DelaySeconds $DelaySeconds | Out-Null
        return
    } catch {
        Write-Host "DROP/CREATE failed, falling back to in-database wipe..." -ForegroundColor Yellow
        $wipeSql = New-FullDatabaseWipeSql
        $tempWipe = "services/backend/temp_db_full_wipe.sql"
        $wipeSql | Out-File -FilePath $tempWipe -Encoding UTF8

        Invoke-SqlFileWithRetrySafe -Conn $Conn -InputSqlPath $tempWipe -MaxAttempts $MaxAttempts -DelaySeconds $DelaySeconds
    }
}

function New-SchemaNukeSql {
    param([string[]]$SchemaNames)

    $schemaList = ($SchemaNames | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ", "

    $sqlLines = @(
        "SET NOCOUNT ON;",
        "DECLARE @sql NVARCHAR(MAX) = N'';",
        "",

        "-- Drop all foreign keys that are either:",
        "-- - defined on tables in selected schemas, OR",
        "-- - referencing tables in selected schemas",
        "SELECT @sql += N'ALTER TABLE ' + QUOTENAME(ps.name) + N'.' + QUOTENAME(pt.name) +",
        "    N' DROP CONSTRAINT ' + QUOTENAME(fk.name) + N';' + CHAR(13)",
        "FROM sys.foreign_keys fk",
        "JOIN sys.tables  pt ON fk.parent_object_id = pt.object_id",
        "JOIN sys.schemas ps ON pt.schema_id = ps.schema_id",
        "JOIN sys.tables  rt ON fk.referenced_object_id = rt.object_id",
        "JOIN sys.schemas rs ON rt.schema_id = rs.schema_id",
        "WHERE ps.name IN ($schemaList)",
        "   OR rs.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all check/default constraints in selected schemas",
        "SELECT @sql += N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) +",
        "    N' DROP CONSTRAINT ' + QUOTENAME(c.name) + N';' + CHAR(13)",
        "FROM sys.check_constraints c",
        "JOIN sys.tables t ON c.parent_object_id = t.object_id",
        "JOIN sys.schemas s ON t.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList);",
        "SELECT @sql += N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) +",
        "    N' DROP CONSTRAINT ' + QUOTENAME(d.name) + N';' + CHAR(13)",
        "FROM sys.default_constraints d",
        "JOIN sys.tables t ON d.parent_object_id = t.object_id",
        "JOIN sys.schemas s ON t.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all views in selected schemas",
        "SELECT @sql += N'DROP VIEW ' + QUOTENAME(s.name) + N'.' + QUOTENAME(v.name) + N';' + CHAR(13)",
        "FROM sys.views v",
        "JOIN sys.schemas s ON v.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all stored procedures in selected schemas",
        "SELECT @sql += N'DROP PROCEDURE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(p.name) + N';' + CHAR(13)",
        "FROM sys.procedures p",
        "JOIN sys.schemas s ON p.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList) AND p.is_ms_shipped = 0;",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all functions in selected schemas",
        "SELECT @sql += N'DROP FUNCTION ' + QUOTENAME(s.name) + N'.' + QUOTENAME(o.name) + N';' + CHAR(13)",
        "FROM sys.objects o",
        "JOIN sys.schemas s ON o.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList) AND o.type IN ('FN','IF','TF','FS','FT') AND o.is_ms_shipped = 0;",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all DML triggers whose parent table is in selected schemas",
        "SELECT @sql += N'DROP TRIGGER ' + QUOTENAME(trs.name) + N'.' + QUOTENAME(tr.name) + N';' + CHAR(13)",
        "FROM sys.triggers tr",
        "JOIN sys.objects  tro ON tr.object_id = tro.object_id",
        "JOIN sys.schemas  trs ON tro.schema_id = trs.schema_id",
        "JOIN sys.tables   t   ON tr.parent_id = t.object_id",
        "JOIN sys.schemas  ts  ON t.schema_id = ts.schema_id",
        "WHERE ts.name IN ($schemaList)",
        "  AND tr.is_ms_shipped = 0;",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all sequences in selected schemas",
        "SELECT @sql += N'DROP SEQUENCE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(seq.name) + N';' + CHAR(13)",
        "FROM sys.sequences seq",
        "JOIN sys.schemas s ON seq.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all synonyms in selected schemas",
        "SELECT @sql += N'DROP SYNONYM ' + QUOTENAME(s.name) + N'.' + QUOTENAME(syn.name) + N';' + CHAR(13)",
        "FROM sys.synonyms syn",
        "JOIN sys.schemas s ON syn.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop all tables in selected schemas",
        "SELECT @sql += N'DROP TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N';' + CHAR(13)",
        "FROM sys.tables t",
        "JOIN sys.schemas s ON t.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop user-defined types in selected schemas",
        "SELECT @sql += N'DROP TYPE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(tt.name) + N';' + CHAR(13)",
        "FROM sys.types tt",
        "JOIN sys.schemas s ON tt.schema_id = s.schema_id",
        "WHERE s.name IN ($schemaList) AND tt.is_user_defined = 1;",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "SET @sql = N'';",
        "",

        "-- Drop schemas",
        "SELECT @sql += N'DROP SCHEMA ' + QUOTENAME(s.name) + N';' + CHAR(13)",
        "FROM sys.schemas s",
        "WHERE s.name IN ($schemaList);",
        "IF (@sql <> N'') EXEC sp_executesql @sql;",
        "",
        "PRINT 'Selected schemas dropped successfully';"
    )

    return ($sqlLines -join "`n")
}

function Show-Help {
    Write-Host "Routing Data Layer - Available Commands" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Setup & Development:" -ForegroundColor Yellow
    Write-Host "  .\scripts\make.ps1 install         - Install all dependencies (backend + frontend)"
    Write-Host "  .\scripts\make.ps1 dev             - Start both backend and frontend in dev mode"
    Write-Host "  .\scripts\make.ps1 dev:backend     - Start backend in dev mode"
    Write-Host "  .\scripts\make.ps1 dev:frontend    - Start frontend in dev mode"
    Write-Host "  .\scripts\make.ps1 build           - Build both backend and frontend"
    Write-Host "  .\scripts\make.ps1 build:backend   - Build backend"
    Write-Host "  .\scripts\make.ps1 build:frontend  - Build frontend"
    Write-Host "  .\scripts\make.ps1 build:verify    - Lint + type-check + test + build (backend + frontend)"
    Write-Host "  .\scripts\make.ps1 test            - Run backend tests"
    Write-Host "  .\scripts\make.ps1 test:frontend   - Run frontend type-check"
    Write-Host "  .\scripts\make.ps1 verify          - Lint + test + build (backend)"
    Write-Host "  .\scripts\make.ps1 verify:frontend  - Lint + type-check + build (frontend)"
    Write-Host "  .\scripts\make.ps1 verify:all       - Lint + test + build (backend + frontend)"
    Write-Host ""
    Write-Host "Database:" -ForegroundColor Yellow
    Write-Host "  .\scripts\make.ps1 prisma-generate - Generate Prisma client"
    Write-Host "  .\scripts\make.ps1 prisma-migrate  - Run Prisma migrations + auto-apply manual SQL (dev)"
    Write-Host "  .\scripts\make.ps1 prisma-deploy   - Deploy Prisma migrations + auto-apply manual SQL (prod)"
    Write-Host "  .\scripts\make.ps1 prisma-studio   - Open Prisma Studio"
    Write-Host "  .\scripts\make.ps1 prisma-reset    - Reset DB with Prisma + auto-apply manual SQL (destructive)"
    Write-Host "  .\scripts\make.ps1 db-setup        - Prisma setup + manual SQL instructions"
    Write-Host "  .\scripts\make.ps1 db-nuke         - Drop cfg/rt/seg/msg schemas via sqlcmd (destructive)"
    Write-Host "  .\scripts\make.ps1 db-reset        - Drop cfg/rt/seg/msg + rebuild (destructive)"
    Write-Host "  .\scripts\make.ps1 hard-reset      - Full wipe (backend + frontend) + reinstall + verify"
    Write-Host "  .\scripts\make.ps1 hard-reset:backend  - Full backend wipe + reinstall + verify"
    Write-Host "  .\scripts\make.ps1 hard-reset:frontend - Full frontend clean + reinstall + verify"
    Write-Host ""
    Write-Host "Cleanup & Rebuild:" -ForegroundColor Yellow
    Write-Host "  .\scripts\make.ps1 clean           - Remove node_modules/build artifacts"
    Write-Host "  .\scripts\make.ps1 clean-prisma    - Remove Prisma generated files"
    Write-Host "  .\scripts\make.ps1 rebuild         - Clean + install + prisma generate"
    Write-Host ""
    Write-Host "Docker:" -ForegroundColor Yellow
    Write-Host "  .\scripts\make.ps1 docker-up       - Start Docker services"
    Write-Host "  .\scripts\make.ps1 docker-down     - Stop Docker services"
    Write-Host ""
}

switch ($Command) {
    "help" { Show-Help }

    #
    # Setup & Development
    #
    "install" {
        Assert-CommandExists -Name "npm"
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm run install:all
    }
    "install:all" {
        Assert-CommandExists -Name "npm"
        Write-Host "Installing all dependencies (backend + frontend)..." -ForegroundColor Yellow
        npm run install:all
    }
    "dev" {
        Assert-CommandExists -Name "npm"
        Write-Host "Starting both backend and frontend in dev mode..." -ForegroundColor Yellow
        Write-Host "Opening backend in new window..." -ForegroundColor Cyan
        $backendScript = "cd '$PWD'; npm run dev:backend"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript
        Start-Sleep -Seconds 2
        Write-Host "Opening frontend in new window..." -ForegroundColor Cyan
        $frontendScript = "cd '$PWD'; npm run dev:frontend"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript
        Write-Host "Both services starting in separate windows." -ForegroundColor Green
        Write-Host "Close the windows to stop the services." -ForegroundColor Yellow
    }
    "dev:backend" {
        Assert-CommandExists -Name "npm"
        Write-Host "Starting backend in dev mode..." -ForegroundColor Yellow
        npm run dev:backend
    }
    "dev:frontend" {
        Assert-CommandExists -Name "npm"
        Write-Host "Starting frontend in dev mode..." -ForegroundColor Yellow
        npm run dev:frontend
    }
    "build" {
        Assert-CommandExists -Name "npm"
        Write-Host "Building both backend and frontend..." -ForegroundColor Yellow
        Write-Host "Building backend..." -ForegroundColor Cyan
        npm run build:backend
        Write-Host "Building frontend..." -ForegroundColor Cyan
        npm run build:frontend
        Write-Host "Build complete (backend + frontend)." -ForegroundColor Green
    }
    "build:backend" {
        Assert-CommandExists -Name "npm"
        Write-Host "Building backend..." -ForegroundColor Yellow
        npm run build:backend
    }
    "build:frontend" {
        Assert-CommandExists -Name "npm"
        Write-Host "Building frontend..." -ForegroundColor Yellow
        npm run build:frontend
    }
    "build:verify" {
        Assert-CommandExists -Name "npm"
        Write-Host "Running full build verification (backend + frontend)..." -ForegroundColor Yellow
        Write-Host "BACKEND:" -ForegroundColor Cyan
        Write-Host "  1/4 Linting..." -ForegroundColor Cyan
        npm run lint:backend
        Write-Host "  2/4 Testing..." -ForegroundColor Cyan
        npm run test:backend
        Write-Host "  3/4 Building..." -ForegroundColor Cyan
        npm run build:backend
        Write-Host "  4/4 Backend complete." -ForegroundColor Green
        Write-Host "FRONTEND:" -ForegroundColor Cyan
        Write-Host "  1/4 Linting..." -ForegroundColor Cyan
        npm run lint:frontend
        Write-Host "  2/4 Type-checking..." -ForegroundColor Cyan
        Push-Location frontend
        npm run type-check
        Pop-Location
        Write-Host "  3/4 Building..." -ForegroundColor Cyan
        npm run build:frontend
        Write-Host "  4/4 Frontend complete." -ForegroundColor Green
        Write-Host "Build verification complete (backend + frontend)." -ForegroundColor Green
    }
    "test" {
        Assert-CommandExists -Name "npm"
        Write-Host "Running backend tests..." -ForegroundColor Yellow
        npm run test:backend
    }
    "test:frontend" {
        Assert-CommandExists -Name "npm"
        Write-Host "Running frontend type-check..." -ForegroundColor Yellow
        Push-Location frontend
        npm run type-check
        Pop-Location
        Write-Host "Frontend type-check complete." -ForegroundColor Green
    }
    "verify" {
        Assert-CommandExists -Name "npm"
        Write-Host "Running full backend verification..." -ForegroundColor Yellow
        Write-Host "1/3 Linting..." -ForegroundColor Cyan
        npm run lint:backend
        Write-Host "2/3 Testing..." -ForegroundColor Cyan
        npm run test:backend
        Write-Host "3/3 Building..." -ForegroundColor Cyan
        npm run build:backend
        Write-Host "Backend verification complete." -ForegroundColor Green
    }
    "verify:frontend" {
        Assert-CommandExists -Name "npm"
        Write-Host "Running full frontend verification..." -ForegroundColor Yellow
        Write-Host "1/3 Linting..." -ForegroundColor Cyan
        npm run lint:frontend
        Write-Host "2/3 Type-checking..." -ForegroundColor Cyan
        Push-Location frontend
        npm run type-check
        Pop-Location
        Write-Host "3/3 Building..." -ForegroundColor Cyan
        npm run build:frontend
        Write-Host "Frontend verification complete." -ForegroundColor Green
    }
    "verify:all" {
        Assert-CommandExists -Name "npm"
        Write-Host "Running full verification (backend + frontend)..." -ForegroundColor Yellow
        Write-Host "BACKEND:" -ForegroundColor Cyan
        Write-Host "  1/3 Linting..." -ForegroundColor Cyan
        npm run lint:backend
        Write-Host "  2/3 Testing..." -ForegroundColor Cyan
        npm run test:backend
        Write-Host "  3/3 Building..." -ForegroundColor Cyan
        npm run build:backend
        Write-Host "FRONTEND:" -ForegroundColor Cyan
        Write-Host "  1/3 Linting..." -ForegroundColor Cyan
        npm run lint:frontend
        Write-Host "  2/3 Type-checking..." -ForegroundColor Cyan
        Push-Location frontend
        npm run type-check
        Pop-Location
        Write-Host "  3/3 Building..." -ForegroundColor Cyan
        npm run build:frontend
        Write-Host "Full verification complete." -ForegroundColor Green
    }

    #
    # Prisma
    #
    "prisma-generate" {
        Assert-CommandExists -Name "npx"
        Write-Host "Generating Prisma client..." -ForegroundColor Yellow
        Push-Location services/backend
        npx prisma generate
        Pop-Location
        Write-Host "Prisma client generated." -ForegroundColor Green
    }
    "prisma-migrate" {
        Assert-CommandExists -Name "npx"
        Write-Host "Running database migrations (development)..." -ForegroundColor Yellow
        Push-Location services/backend
        npx prisma migrate dev
        Pop-Location
        Write-Host "Prisma migrations complete." -ForegroundColor Green

        $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password
        Apply-ManualSqlScripts -Conn $conn
        Write-Host "Database setup complete (Prisma + manual SQL)." -ForegroundColor Green
    }
    "prisma-deploy" {
        Assert-CommandExists -Name "npx"
        Write-Host "Deploying database migrations (production)..." -ForegroundColor Yellow
        Push-Location services/backend
        npx prisma migrate deploy
        Pop-Location
        Write-Host "Prisma deployment complete." -ForegroundColor Green

        $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password
        Apply-ManualSqlScripts -Conn $conn
        Write-Host "Database deployment complete (Prisma + manual SQL)." -ForegroundColor Green
    }
    "prisma-studio" {
        Assert-CommandExists -Name "npx"
        Write-Host "Opening Prisma Studio..." -ForegroundColor Yellow
        Push-Location services/backend
        npx prisma studio
        Pop-Location
    }
    "prisma-reset" {
        Assert-CommandExists -Name "npx"
        Write-Host "Resetting database with Prisma..." -ForegroundColor Red
        Write-Host "WARNING: This will delete ALL data." -ForegroundColor Red
        $confirm = Read-Host "Type yes to continue"
        if ($confirm -eq "yes") {
            Push-Location services/backend
            npx prisma migrate reset --force
            Pop-Location
            Write-Host "Prisma reset complete." -ForegroundColor Green

            $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password
            Apply-ManualSqlScripts -Conn $conn
            Write-Host "Database reset complete (Prisma + manual SQL)." -ForegroundColor Green
        } else {
            Write-Host "Reset cancelled." -ForegroundColor Yellow
        }
    }

    #
    # Database
    #
    "db-nuke" {
        Assert-SqlcmdAvailable

        Write-Host "Dropping schemas cfg, rt, seg, msg via sqlcmd..." -ForegroundColor Red
        Write-Host "WARNING: This will permanently delete ALL data in these schemas." -ForegroundColor Red
        $confirm = Read-Host "Type NUKE to continue"
        if ($confirm -ne "NUKE") {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }

        $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password
        Wait-ForSqlServerReady -Conn $conn -MaxAttempts 36 -DelaySeconds 5

        $sqlScript = New-SchemaNukeSql -SchemaNames @("cfg", "rt", "seg", "msg")
        $sqlPath = "services/backend/temp_db_nuke.sql"
        $sqlScript | Out-File -FilePath $sqlPath -Encoding UTF8

        Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $sqlPath -MaxAttempts 12 -DelaySeconds 5

        Write-Host "Schema nuke complete." -ForegroundColor Green
        Write-Host "SQL script saved at: $sqlPath" -ForegroundColor Cyan
    }

    "db-setup" {
        Assert-CommandExists -Name "npx"

        Write-Host "Setting up database from scratch..." -ForegroundColor Cyan
        Write-Host "Step 1/3: Generating Prisma client..." -ForegroundColor Yellow
        Push-Location services/backend
        npx prisma generate
        Write-Host "Prisma client generated." -ForegroundColor Green

        Write-Host "Step 2/3: Running Prisma migrations..." -ForegroundColor Yellow
        npx prisma migrate dev --name initial_schema
        Write-Host "Prisma migrations applied." -ForegroundColor Green

        Write-Host "Step 3/3: Manual SQL required..." -ForegroundColor Yellow
        Write-Host "REQUIRED: Apply filtered indexes" -ForegroundColor Red
        Write-Host "  File: prisma/migrations/manual_add_filtered_indexes.sql" -ForegroundColor Cyan
        Write-Host "OPTIONAL: Apply triggers" -ForegroundColor Yellow
        Write-Host "  File: prisma/migrations/manual_add_triggers.sql" -ForegroundColor Cyan
        Write-Host "Execute using sqlcmd or Azure Data Studio." -ForegroundColor White
        Pop-Location
    }

    "db-reset" {
        Assert-CommandExists -Name "npm"
        Assert-CommandExists -Name "npx"
        Assert-SqlcmdAvailable

        Write-Host "============================================================================" -ForegroundColor Cyan
        Write-Host "COMPLETE DATABASE RESET AND REBUILD" -ForegroundColor Cyan
        Write-Host "============================================================================" -ForegroundColor Cyan

        $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password

        Write-Host "Connection:" -ForegroundColor Cyan
        Write-Host "  Server: $($conn.Server)" -ForegroundColor White
        if ($conn.Port) { Write-Host "  Port:   $($conn.Port)" -ForegroundColor White }
        Write-Host "  Database: $($conn.Database)" -ForegroundColor White
        Write-Host "  User: $($conn.Username)" -ForegroundColor White

        Write-Host "WARNING: This will PERMANENTLY DELETE all data in cfg/rt/seg/msg." -ForegroundColor Red
        $confirm = Read-Host "Type NUKE to continue"
        if ($confirm -ne "NUKE") {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }

        Wait-ForSqlServerReady -Conn $conn -MaxAttempts 36 -DelaySeconds 5

        Write-Host "PHASE 1: Drop cfg/rt/seg/msg via sqlcmd" -ForegroundColor Yellow
        $sqlPath = "services/backend/temp_db_nuke.sql"
        if (-not (Test-Path $sqlPath)) {
            $sqlScript = New-SchemaNukeSql -SchemaNames @("cfg", "rt", "seg", "msg")
            $sqlScript | Out-File -FilePath $sqlPath -Encoding UTF8
        }

        Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $sqlPath -MaxAttempts 12 -DelaySeconds 5
        Write-Host "Database schemas nuked." -ForegroundColor Green

        Write-Host "PHASE 2: Clean Prisma artifacts" -ForegroundColor Yellow
        & $PSCommandPath clean-prisma

        Write-Host "PHASE 3: Prisma setup" -ForegroundColor Yellow
        Push-Location services/backend
        try {
            npm run prisma:generate
            Write-Host "Prisma client generated." -ForegroundColor Green
        } catch {
            Write-Host "Prisma generate failed: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
            exit 1
        }

        try {
            npx prisma migrate dev --name rebuild_from_scratch --skip-generate
            Write-Host "Prisma migrations applied." -ForegroundColor Green
        } catch {
            Write-Host "Prisma migrate failed: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Pop-Location

        Write-Host "PHASE 4: Apply manual SQL via sqlcmd" -ForegroundColor Yellow

        $filteredIndexesPath = "services/backend/prisma/migrations/manual_add_filtered_indexes.sql"
        if (Test-Path $filteredIndexesPath) {
            Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $filteredIndexesPath -MaxAttempts 12 -DelaySeconds 5
            Write-Host "Filtered indexes applied." -ForegroundColor Green
        } else {
            Write-Host "Filtered index script not found: $filteredIndexesPath" -ForegroundColor Yellow
        }

        $triggersPath = "services/backend/prisma/migrations/manual_add_triggers.sql"
        if (Test-Path $triggersPath) {
            try {
                Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $triggersPath -MaxAttempts 12 -DelaySeconds 5
                Write-Host "Triggers applied." -ForegroundColor Green
            } catch {
                Write-Host "Triggers failed (optional): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Trigger script not found (optional): $triggersPath" -ForegroundColor Yellow
        }

        Write-Host "DATABASE REBUILD COMPLETE." -ForegroundColor Green

        Push-Location services/backend
        npm run dev
        Pop-Location
    }

    "hard-reset" {
        Assert-CommandExists -Name "npm"
        Assert-CommandExists -Name "npx"
        Assert-SqlcmdAvailable

        Write-Host "============================================================================" -ForegroundColor Cyan
        Write-Host "HARD RESET: FULL WIPE + PRISMA REBUILD + INSTALL + VERIFY" -ForegroundColor Cyan
        Write-Host "============================================================================" -ForegroundColor Cyan

        $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password

        Write-Host "Connection:" -ForegroundColor Cyan
        Write-Host "  Server: $($conn.Server)" -ForegroundColor White
        if ($conn.Port) { Write-Host "  Port:   $($conn.Port)" -ForegroundColor White }
        Write-Host "  Database: $($conn.Database)" -ForegroundColor White
        Write-Host "  User: $($conn.Username)" -ForegroundColor White

        Write-Host "WARNING: This will DELETE everything in the target database and rebuild Prisma artifacts." -ForegroundColor Red
        $confirm = Read-Host "Type HARDRESET to continue"
        if ($confirm -ne "HARDRESET") {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }

        Wait-ForSqlServerReady -Conn $conn -MaxAttempts 36 -DelaySeconds 5

        Write-Host "PHASE 1: Full database wipe (DROP/CREATE if allowed, otherwise in-DB wipe)" -ForegroundColor Yellow
        Invoke-CreateOrWipeDatabase -Conn $conn -MaxAttempts 36 -DelaySeconds 5
        Write-Host "Database wipe complete." -ForegroundColor Green

        Write-Host "PHASE 2: Clean Prisma artifacts" -ForegroundColor Yellow
        & $PSCommandPath clean-prisma

        Write-Host "PHASE 3: Clean + install dependencies" -ForegroundColor Yellow
        & $PSCommandPath clean
        & $PSCommandPath install

        Write-Host "PHASE 4: Prisma generate + migrate" -ForegroundColor Yellow
        Push-Location services/backend
        try {
            npm run prisma:generate
            Write-Host "Prisma client generated." -ForegroundColor Green
        } catch {
            Write-Host "Prisma generate failed: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        try {
            npx prisma migrate dev --name hard_reset_rebuild --skip-generate
            Write-Host "Prisma migrations applied." -ForegroundColor Green
        } catch {
            Write-Host "Prisma migrate failed: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Pop-Location

        Write-Host "PHASE 5: Apply manual SQL via sqlcmd" -ForegroundColor Yellow

        $filteredIndexesPath = "services/backend/prisma/migrations/manual_add_filtered_indexes.sql"
        if (Test-Path $filteredIndexesPath) {
            Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $filteredIndexesPath -MaxAttempts 12 -DelaySeconds 5
            Write-Host "Filtered indexes applied." -ForegroundColor Green
        } else {
            Write-Host "Filtered index script not found: $filteredIndexesPath" -ForegroundColor Yellow
        }

        $triggersPath = "services/backend/prisma/migrations/manual_add_triggers.sql"
        if (Test-Path $triggersPath) {
            try {
                Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $triggersPath -MaxAttempts 12 -DelaySeconds 5
                Write-Host "Triggers applied." -ForegroundColor Green
            } catch {
                Write-Host "Triggers failed (optional): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Trigger script not found (optional): $triggersPath" -ForegroundColor Yellow
        }

        Write-Host "PHASE 6: Lint + test + build (backend + frontend)" -ForegroundColor Yellow
        & $PSCommandPath verify:all

        Write-Host "HARD RESET COMPLETE (backend + frontend)." -ForegroundColor Green
    }

    "hard-reset:backend" {
        Assert-CommandExists -Name "npm"
        Assert-CommandExists -Name "npx"
        Assert-SqlcmdAvailable

        Write-Host "============================================================================" -ForegroundColor Cyan
        Write-Host "HARD RESET: BACKEND - FULL WIPE + PRISMA REBUILD + INSTALL + VERIFY" -ForegroundColor Cyan
        Write-Host "============================================================================" -ForegroundColor Cyan

        $conn = Get-DatabaseConnection -Server $Server -Database $Database -Username $Username -Password $Password

        Write-Host "Connection:" -ForegroundColor Cyan
        Write-Host "  Server: $($conn.Server)" -ForegroundColor White
        if ($conn.Port) { Write-Host "  Port:   $($conn.Port)" -ForegroundColor White }
        Write-Host "  Database: $($conn.Database)" -ForegroundColor White
        Write-Host "  User: $($conn.Username)" -ForegroundColor White

        Write-Host "WARNING: This will DELETE everything in the target database and rebuild backend." -ForegroundColor Red
        $confirm = Read-Host "Type HARDRESET to continue"
        if ($confirm -ne "HARDRESET") {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }

        Wait-ForSqlServerReady -Conn $conn -MaxAttempts 36 -DelaySeconds 5

        Write-Host "PHASE 1: Full database wipe (DROP/CREATE if allowed, otherwise in-DB wipe)" -ForegroundColor Yellow
        Invoke-CreateOrWipeDatabase -Conn $conn -MaxAttempts 36 -DelaySeconds 5
        Write-Host "Database wipe complete." -ForegroundColor Green

        Write-Host "PHASE 2: Clean Prisma artifacts" -ForegroundColor Yellow
        & $PSCommandPath clean-prisma

        Write-Host "PHASE 3: Clean backend + install dependencies" -ForegroundColor Yellow
        $ErrorActionPreference = "Continue"
        if (Test-Path "services/backend/node_modules") {
            Remove-Item -Recurse -Force "services/backend/node_modules" -ErrorAction SilentlyContinue
        }
        if (Test-Path "services/backend/dist") {
            Remove-Item -Recurse -Force "services/backend/dist" -ErrorAction SilentlyContinue
        }
        if (Test-Path "services/shared/node_modules") {
            Remove-Item -Recurse -Force "services/shared/node_modules" -ErrorAction SilentlyContinue
        }
        $ErrorActionPreference = "Stop"
        & $PSCommandPath install

        Write-Host "PHASE 4: Prisma generate + migrate" -ForegroundColor Yellow
        Push-Location services/backend
        try {
            npm run prisma:generate
            Write-Host "Prisma client generated." -ForegroundColor Green
        } catch {
            Write-Host "Prisma generate failed: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        try {
            npx prisma migrate dev --name hard_reset_rebuild --skip-generate
            Write-Host "Prisma migrations applied." -ForegroundColor Green
        } catch {
            Write-Host "Prisma migrate failed: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Pop-Location

        Write-Host "PHASE 5: Apply manual SQL via sqlcmd" -ForegroundColor Yellow

        $filteredIndexesPath = "services/backend/prisma/migrations/manual_add_filtered_indexes.sql"
        if (Test-Path $filteredIndexesPath) {
            Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $filteredIndexesPath -MaxAttempts 12 -DelaySeconds 5
            Write-Host "Filtered indexes applied." -ForegroundColor Green
        } else {
            Write-Host "Filtered index script not found: $filteredIndexesPath" -ForegroundColor Yellow
        }

        $triggersPath = "services/backend/prisma/migrations/manual_add_triggers.sql"
        if (Test-Path $triggersPath) {
            try {
                Invoke-SqlFileWithRetrySafe -Conn $conn -InputSqlPath $triggersPath -MaxAttempts 12 -DelaySeconds 5
                Write-Host "Triggers applied." -ForegroundColor Green
            } catch {
                Write-Host "Triggers failed (optional): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Trigger script not found (optional): $triggersPath" -ForegroundColor Yellow
        }

        Write-Host "PHASE 6: Lint + test + build (backend)" -ForegroundColor Yellow
        & $PSCommandPath verify

        Write-Host "HARD RESET COMPLETE (backend)." -ForegroundColor Green
    }

    "hard-reset:frontend" {
        Assert-CommandExists -Name "npm"

        Write-Host "============================================================================" -ForegroundColor Cyan
        Write-Host "HARD RESET: FRONTEND - FULL CLEAN + REINSTALL + VERIFY" -ForegroundColor Cyan
        Write-Host "============================================================================" -ForegroundColor Cyan

        Write-Host "WARNING: This will DELETE all frontend node_modules and build artifacts." -ForegroundColor Red
        $confirm = Read-Host "Type HARDRESET to continue"
        if ($confirm -ne "HARDRESET") {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }

        Write-Host "PHASE 1: Clean frontend artifacts" -ForegroundColor Yellow
        $ErrorActionPreference = "Continue"
        if (Test-Path "frontend/node_modules") {
            Remove-Item -Recurse -Force "frontend/node_modules" -ErrorAction SilentlyContinue
            Write-Host "Removed frontend/node_modules" -ForegroundColor Green
        }
        if (Test-Path "frontend/.next") {
            Remove-Item -Recurse -Force "frontend/.next" -ErrorAction SilentlyContinue
            Write-Host "Removed frontend/.next" -ForegroundColor Green
        }
        $ErrorActionPreference = "Stop"

        Write-Host "PHASE 2: Install frontend dependencies" -ForegroundColor Yellow
        Push-Location frontend
        npm install
        Pop-Location
        Write-Host "Frontend dependencies installed." -ForegroundColor Green

        Write-Host "PHASE 3: Lint + type-check + build (frontend)" -ForegroundColor Yellow
        & $PSCommandPath verify:frontend

        Write-Host "HARD RESET COMPLETE (frontend)." -ForegroundColor Green
    }

    #
    # Cleanup & rebuild
    #
    "clean" {
        Write-Host "Cleaning project..." -ForegroundColor Yellow
        Write-Host "Stop dev servers first (Ctrl+C)" -ForegroundColor Yellow

        $folders = @(
            "node_modules",
            "services/backend/node_modules",
            "services/shared/node_modules",
            "frontend/node_modules",
            "services/backend/dist",
            "frontend/.next"
        )

        $ErrorActionPreference = "Continue"
        foreach ($folder in $folders) {
            if (Test-Path $folder) {
                try {
                    Remove-Item -Recurse -Force $folder -ErrorAction Stop
                    Write-Host "Removed: $folder" -ForegroundColor Green
                } catch {
                    Write-Host "Skipped (locked): $folder" -ForegroundColor Yellow
                }
            }
        }
        $ErrorActionPreference = "Stop"
        Write-Host "Cleanup complete." -ForegroundColor Green
    }

    "clean-prisma" {
        Write-Host "Cleaning Prisma generated files..." -ForegroundColor Yellow
        $ErrorActionPreference = "Continue"

        if (Test-Path "services/backend/node_modules/.prisma") {
            try {
                Remove-Item -Recurse -Force "services/backend/node_modules/.prisma" -ErrorAction Stop
                Write-Host "Removed .prisma folder." -ForegroundColor Green
            } catch {
                Write-Host "Skipped (locked): .prisma" -ForegroundColor Yellow
            }
        }

        if (Test-Path "services/backend/node_modules/@prisma") {
            try {
                Remove-Item -Recurse -Force "services/backend/node_modules/@prisma" -ErrorAction Stop
                Write-Host "Removed @prisma folder." -ForegroundColor Green
            } catch {
                Write-Host "Skipped (locked): @prisma" -ForegroundColor Yellow
            }
        }

        $ErrorActionPreference = "Stop"
        Write-Host "Prisma cleanup complete." -ForegroundColor Green
    }

    "rebuild" {
        Write-Host "FULL REBUILD FROM SCRATCH" -ForegroundColor Cyan
        Write-Host "=========================" -ForegroundColor Cyan
        $confirm = Read-Host "Type yes to continue"
        if ($confirm -eq "yes") {
            Write-Host "Phase 1/3: Cleaning..." -ForegroundColor Cyan
            & $PSCommandPath clean
            & $PSCommandPath clean-prisma

            Write-Host "Phase 2/3: Installing..." -ForegroundColor Cyan
            & $PSCommandPath install

            Write-Host "Phase 3/3: Generating Prisma..." -ForegroundColor Cyan
            & $PSCommandPath prisma-generate

            Write-Host "Rebuild complete." -ForegroundColor Green
        } else {
            Write-Host "Cancelled." -ForegroundColor Yellow
        }
    }

    #
    # Docker
    #
    "docker-up" {
        Write-Host "Starting Docker services..." -ForegroundColor Yellow
        Push-Location infrastructure
        if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
            docker-compose up -d
        } else {
            docker compose up -d
        }
        Pop-Location
    }

    "docker-down" {
        Write-Host "Stopping Docker services..." -ForegroundColor Yellow
        Push-Location infrastructure
        if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
            docker-compose down
        } else {
            docker compose down
        }
        Pop-Location
    }

    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
