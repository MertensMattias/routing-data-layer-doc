#!/usr/bin/env node

/**
 * Seed Runner Script
 * Executes all seed files in the correct order using sqlcmd
 * Supports wipe operation to clear existing data before seeding
 *
 * Usage:
 *   node scripts/run-seeds.js [--wipe] [--database DATABASE_NAME]
 *   npm run seed              # Run seeds
 *   npm run seed:wipe         # Wipe and run seeds
 *
 * Database connection is read from:
 * 1. Command-line arguments (--server, --database, --username, --password)
 * 2. DATABASE_URL environment variable
 * 3. services/backend/.env file
 * 4. Defaults (localhost, sa, empty password)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue = null) => {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
};

const hasFlag = (name) => {
  return args.includes(`--${name}`);
};

// Parse DATABASE_URL or read from .env
function getDatabaseConnection() {
  // Try command-line args first
  const server = getArg('server');
  const database = getArg('database');
  const username = getArg('username');
  const password = getArg('password');

  if (server && username) {
    return { server, database: database || 'RoutingDataLayer_DVP', username, password: password || '' };
  }

  // Try DATABASE_URL environment variable
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const parsed = parseDatabaseUrl(databaseUrl);
    if (parsed) {
      return {
        server: parsed.server || 'localhost',
        port: parsed.port,
        database: database || parsed.database || 'RoutingDataLayer_DVP',
        username: parsed.username || 'sa',
        password: parsed.password || ''
      };
    }
  }

  // Try reading from .env file
  const envPath = path.join(__dirname, '..', 'services', 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envMatch = envContent.match(/DATABASE_URL\s*=\s*(.+)/);
    if (envMatch) {
      // Remove surrounding quotes if present
      let urlValue = envMatch[1].trim();
      if ((urlValue.startsWith('"') && urlValue.endsWith('"')) || (urlValue.startsWith("'") && urlValue.endsWith("'"))) {
        urlValue = urlValue.slice(1, -1);
      }
      const parsed = parseDatabaseUrl(urlValue);
      if (parsed) {
        return {
          server: parsed.server || 'localhost',
          port: parsed.port,
          database: database || parsed.database || 'RoutingDataLayer_DVP',
          username: parsed.username || 'sa',
          password: parsed.password || ''
        };
      }
    }
  }

  // Defaults
  return {
    server: 'localhost',
    port: null,
    database: database || 'RoutingDataLayer_DVP',
    username: 'sa',
    password: ''
  };
}

function parseDatabaseUrl(url) {
  if (!url) return null;

  // Remove sqlserver:// prefix if present
  url = url.replace(/^sqlserver:\/\//, '');

  // Parse URL-style: user:pass@server:port;database=...
  // Check for URL-style format (user:pass@host) but only if @ appears before the first semicolon
  // This avoids matching @ in password values that are in semicolon-separated params
  const semicolonIndex = url.indexOf(';');
  const atIndex = url.indexOf('@');
  if (atIndex !== -1 && (semicolonIndex === -1 || atIndex < semicolonIndex)) {
    // URL-style format: user:pass@host
    const urlMatch = url.match(/(?:([^:]+):([^@]+)@)?([^:;]+)(?::(\d+))?(?:;(.+))?/);
    if (urlMatch) {
      const params = urlMatch[5] || '';
      const databaseMatch = params.match(/database\s*=\s*([^;]+)/i);

      return {
        server: urlMatch[3],
        port: urlMatch[4] || null,
        username: urlMatch[1] || null,
        password: urlMatch[2] || null,
        database: databaseMatch ? databaseMatch[1].trim() : null
      };
    }
  }

  // Parse semicolon-separated format: server[:port];database=...;user=...;password=...
  // This handles passwords with @ correctly
  if (url.includes(';')) {
    const databaseMatch = url.match(/database\s*=\s*([^;]+)/i);
    const userMatch = url.match(/user\s*=\s*([^;]+)/i);
    const passwordMatch = url.match(/password\s*=\s*([^;]+)/i);
    // Match server:port at the start of the string, before first semicolon
    const serverMatch = url.match(/^([^:;]+)(?::(\d+))?(?=;|$)/);

    if (serverMatch) {
      return {
        server: serverMatch[1].trim(),
        port: serverMatch[2] || null,
        username: userMatch ? userMatch[1].trim() : null,
        password: passwordMatch ? passwordMatch[1].trim() : null,
        database: databaseMatch ? databaseMatch[1].trim() : null
      };
    }
  }

  // Parse ADO-style: Server=...;Database=...;User ID=...;Password=...
  const serverMatch = url.match(/Server\s*=\s*([^;]+)/i);
  const databaseMatch = url.match(/Database\s*=\s*([^;]+)/i) || url.match(/Initial Catalog\s*=\s*([^;]+)/i);
  const usernameMatch = url.match(/User ID\s*=\s*([^;]+)/i) || url.match(/UID\s*=\s*([^;]+)/i) || url.match(/User\s*=\s*([^;]+)/i);
  const passwordMatch = url.match(/Password\s*=\s*([^;]+)/i) || url.match(/PWD\s*=\s*([^;]+)/i);

  // Parse port from server if present (server:port)
  let server = serverMatch ? serverMatch[1].trim() : null;
  let port = null;
  if (server && server.includes(':')) {
    const parts = server.split(':');
    server = parts[0];
    port = parts[1];
  }

  return {
    server: server,
    port: port,
    database: databaseMatch ? databaseMatch[1].trim() : null,
    username: usernameMatch ? usernameMatch[1].trim() : null,
    password: passwordMatch ? passwordMatch[1].trim() : null
  };
}

// Seed files in execution order
const seedFiles = [
  '001_seed_dictionaries_environments.sql',
  '002_seed_dictionaries_languages.sql',
  '003_seed_dictionaries_company_projects.sql',
  '004_seed_dictionaries_segment_types.sql',
  '005_seed_dictionaries_key_types.sql',
  '006_seed_dictionaries_segment_keys.sql',
  '007_seed_dictionaries_message_types.sql',
  '008_seed_dictionaries_message_categories.sql',
  '009_seed_dictionaries_voices.sql',
  '020_seed_message_stores.sql',
  '021_seed_message_store_voice_configs.sql',
  '022_seed_messages.sql',
  '010_seed_routing_tables.sql',
  '030_seed_segments.sql',
  '031_seed_segment_keys.sql',
  '032_seed_segment_transitions.sql',
  '033_backfill_new_columns.sql'  // Backfills SourceSegmentName, NextSegmentName, TransitionOrder, ConfigOrder
];

// Tables to wipe (in reverse dependency order to respect foreign keys)
const tablesToWipe = [
  // Segment store (highest dependencies)
  'seg_SegmentTransition',
  'seg_Key',
  'seg_Segment',
  // Routing table
  'rt_RoutingTable',
  'rt_ChangeSet',
  'rt_RoutingTableHistory',
  // Message store
  'msg_MessageVersion',
  'msg_Message',
  'msg_MessageStoreVoiceConfig',
  'msg_MessageStore',
  // Dictionaries (lowest dependencies - delete last)
  'seg_Dic_Key',
  'seg_Dic_KeyType',
  'seg_Dic_SegmentType',
  'cfg_Dic_Voice',
  'cfg_Dic_MessageCategory',
  'cfg_Dic_MessageType',
  'cfg_Dic_Language',
  'cfg_Dic_CompanyProject',
  'cfg_Dic_Environment'
];

function buildSqlCmdArgs(conn) {
  const sqlcmdArgs = [];
  const isWindows = process.platform === 'win32';

  // Server connection
  if (conn.port) {
    sqlcmdArgs.push('-S', `${conn.server},${conn.port}`);
  } else {
    sqlcmdArgs.push('-S', conn.server);
  }

  sqlcmdArgs.push('-d', conn.database);

  // Authentication
  if (conn.username && conn.password) {
    sqlcmdArgs.push('-U', conn.username);
    // Password is passed as-is; escaping is handled when building the command string
    sqlcmdArgs.push('-P', conn.password);
  } else if (conn.username && !conn.password) {
    // Try Windows auth if username but no password
    sqlcmdArgs.push('-E');
  } else {
    // Default to Windows auth
    sqlcmdArgs.push('-E');
  }

  return sqlcmdArgs;
}

function executeSql(sqlcmdArgs, sql, description) {
  const isWindows = process.platform === 'win32';

  // Create temp SQL file
  const tempFile = path.join(__dirname, '..', 'temp_seed_wipe.sql');
  try {
    fs.writeFileSync(tempFile, sql, 'utf8');

    const finalPath = isWindows && tempFile.includes(' ') ? `"${tempFile}"` : tempFile;

    // Build command string with proper quoting for Windows shell
    // Escape passwords and other arguments that might contain special characters
    let cmdStr = 'sqlcmd';
    for (let i = 0; i < sqlcmdArgs.length; i++) {
      const arg = sqlcmdArgs[i];
      const nextArg = sqlcmdArgs[i + 1];

      // Check if this is a flag that takes a value
      if (nextArg && (arg === '-S' || arg === '-d' || arg === '-U' || arg === '-P')) {
        // Quote password values to handle special characters like @
        if (arg === '-P' && isWindows) {
          cmdStr += ` ${arg} "${nextArg.replace(/"/g, '""')}"`;
          i++; // Skip next argument since we processed it
        } else if (isWindows && nextArg && (nextArg.includes(' ') || nextArg.includes('@') || nextArg.includes('&') || nextArg.includes('|'))) {
          cmdStr += ` ${arg} "${nextArg.replace(/"/g, '""')}"`;
          i++; // Skip next argument since we processed it
        } else {
          cmdStr += ` ${arg} ${nextArg}`;
          i++; // Skip next argument since we processed it
        }
      } else {
        // Flag without value (e.g., -E)
        cmdStr += ` ${arg}`;
      }
    }
    cmdStr += ` -i ${finalPath}`;

    execSync(cmdStr, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      shell: isWindows,
      env: { ...process.env }
    });
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function wipeDatabase(conn) {
  console.log('🗑️  Wiping database...');
  console.log(`   Server: ${conn.server}${conn.port ? ':' + conn.port : ''}`);
  console.log(`   Database: ${conn.database}`);
  console.log(`   User: ${conn.username}`);
  console.log('');

  const sqlcmdArgs = buildSqlCmdArgs(conn);

  // Build SQL to delete data from tables in reverse dependency order
  // This respects foreign key constraints by deleting dependent tables first
  let wipeSql = `-- Wipe database data (preserves schema)
BEGIN TRY
    BEGIN TRAN;

`;

  // Delete data from tables (reverse dependency order)
  for (const table of tablesToWipe) {
    wipeSql += `    DELETE FROM [dbo].[${table}];\n`;
  }

  wipeSql += `
    COMMIT TRAN;
    PRINT '✅ Database wiped successfully';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
`;

  executeSql(sqlcmdArgs, wipeSql);
  console.log('✅ Database wiped successfully\n');
}

function runSeeds(doWipe = false) {
  const conn = getDatabaseConnection();
  const seedsDir = path.join(__dirname, '..', 'seeds');

  if (doWipe) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  WIPE AND SEED MODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌱 SEED MODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }

  console.log(`   Server: ${conn.server}${conn.port ? ':' + conn.port : ''}`);
  console.log(`   Database: ${conn.database}`);
  console.log(`   User: ${conn.username}`);
  console.log('');

  // Check if sqlcmd is available
  try {
    execSync('sqlcmd -?', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Error: sqlcmd not found. Please install SQL Server Command Line Utilities.');
    console.error('   Download: https://learn.microsoft.com/en-us/sql/tools/sqlcmd-utility');
    process.exit(1);
  }

  // Wipe database if requested
  if (doWipe) {
    try {
      wipeDatabase(conn);
    } catch (error) {
      console.error('❌ Wipe failed');
      if (error.stdout) console.error(error.stdout.toString());
      if (error.stderr) console.error(error.stderr.toString());
      if (error.message) console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    console.log('');
  }

  // Build sqlcmd command args
  const sqlcmdArgs = buildSqlCmdArgs(conn);

  // Execute each seed file
  let successCount = 0;
  let failCount = 0;

  for (const seedFile of seedFiles) {
    const seedPath = path.join(seedsDir, seedFile);

    if (!fs.existsSync(seedPath)) {
      console.warn(`⚠️  Skipping ${seedFile} (file not found)`);
      continue;
    }

    try {
      console.log(`📄 Running ${seedFile}...`);

      const isWindows = process.platform === 'win32';
      // Use absolute path and always quote on Windows to handle paths with spaces/special chars
      const absolutePath = path.resolve(seedPath);
      const finalPath = isWindows ? `"${absolutePath}"` : absolutePath;

      // Build command string with proper quoting for Windows shell
      // Escape passwords and other arguments that might contain special characters
      let cmdStr = 'sqlcmd';
      for (let i = 0; i < sqlcmdArgs.length; i++) {
        const arg = sqlcmdArgs[i];
        const nextArg = sqlcmdArgs[i + 1];

        // Check if this is a flag that takes a value
        if (nextArg && (arg === '-S' || arg === '-d' || arg === '-U' || arg === '-P')) {
          // Quote password values to handle special characters like @
          if (arg === '-P' && isWindows) {
            cmdStr += ` ${arg} "${nextArg.replace(/"/g, '""')}"`;
            i++; // Skip next argument since we processed it
          } else if (isWindows && nextArg && (nextArg.includes(' ') || nextArg.includes('@') || nextArg.includes('&') || nextArg.includes('|'))) {
            cmdStr += ` ${arg} "${nextArg.replace(/"/g, '""')}"`;
            i++; // Skip next argument since we processed it
          } else {
            cmdStr += ` ${arg} ${nextArg}`;
            i++; // Skip next argument since we processed it
          }
        } else {
          // Flag without value (e.g., -E)
          cmdStr += ` ${arg}`;
        }
      }
      cmdStr += ` -i ${finalPath}`;

      execSync(cmdStr, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        shell: isWindows,
        env: { ...process.env }
      });
      console.log(`✅ ${seedFile} completed\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${seedFile} failed`);
      if (error.stdout) console.error(error.stdout.toString());
      if (error.stderr) console.error(error.stderr.toString());
      if (error.message) console.error(`Error: ${error.message}`);
      console.error('');
      failCount++;

      // Ask if user wants to continue
      if (failCount === 1) {
        console.log('⚠️  Some seeds failed. Continuing with remaining seeds...\n');
      }
    }
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (doWipe) {
    console.log('✅ Wipe and seed completed:');
  } else {
    console.log('✅ Seed completed:');
  }
  console.log(`   ✅ Successful: ${successCount} seed files`);
  if (failCount > 0) {
    console.log(`   ❌ Failed: ${failCount} seed files`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failCount > 0) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  const doWipe = hasFlag('wipe');
  runSeeds(doWipe);
}

module.exports = { runSeeds, getDatabaseConnection, wipeDatabase };
