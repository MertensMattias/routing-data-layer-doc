#!/bin/bashDISABLED

# add-audit-instructions.sh - Hook script that logs instructions about agent-audit log and AGENTS files
# This hook is triggered before prompt submission (beforeSubmitPrompt event)
# Since beforeSubmitPrompt cannot modify prompts, this hook logs the instructions for reference
# The agent should be aware of these requirements through the rules.mdc file

# Function to ensure jq is installed
ensure_jq() {
  # Check if jq is already available
  if command -v jq >/dev/null 2>&1; then
    return 0
  fi

  # Attempt to install jq based on the system
  echo "jq not found. Attempting to install..." >&2

  # Detect OS and install method
  if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "${WINDIR:-}" ]]; then
    # Windows - try Chocolatey
    if command -v choco >/dev/null 2>&1; then
      echo "Installing jq via Chocolatey..." >&2
      choco install jq -y --no-progress 2>&1 | grep -v "Chocolatey" || true
      if command -v jq >/dev/null 2>&1; then
        return 0
      fi
    fi
    # Windows fallback - try winget
    if command -v winget >/dev/null 2>&1; then
      echo "Installing jq via winget..." >&2
      winget install -e --id stedolan.jq --silent --accept-package-agreements --accept-source-agreements 2>&1 | grep -v "Windows Package Manager" || true
      if command -v jq >/dev/null 2>&1; then
        return 0
      fi
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try various package managers
    if command -v apt-get >/dev/null 2>&1; then
      echo "Installing jq via apt-get..." >&2
      sudo apt-get update -qq >/dev/null 2>&1 && sudo apt-get install -y jq >/dev/null 2>&1 || true
      if command -v jq >/dev/null 2>&1; then
        return 0
      fi
    elif command -v yum >/dev/null 2>&1; then
      echo "Installing jq via yum..." >&2
      sudo yum install -y jq >/dev/null 2>&1 || true
      if command -v jq >/dev/null 2>&1; then
        return 0
      fi
    elif command -v dnf >/dev/null 2>&1; then
      echo "Installing jq via dnf..." >&2
      sudo dnf install -y jq >/dev/null 2>&1 || true
      if command -v jq >/dev/null 2>&1; then
        return 0
      fi
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - try Homebrew
    if command -v brew >/dev/null 2>&1; then
      echo "Installing jq via Homebrew..." >&2
      brew install jq >/dev/null 2>&1 || true
      if command -v jq >/dev/null 2>&1; then
        return 0
      fi
    fi
  fi

  # If we get here, installation failed
  echo "Warning: Could not install jq automatically. Please install it manually:" >&2
  echo "  Windows: choco install jq" >&2
  echo "  macOS: brew install jq" >&2
  echo "  Linux: sudo apt-get install jq (or equivalent)" >&2
  return 1
}

# Ensure jq is available before proceeding
ensure_jq || {
  echo "Error: jq is required but could not be installed automatically" >&2
  exit 1
}

# Enable strict error handling
set -euo pipefail

# Error handling function
error_exit() {
  echo "Error in add-audit-instructions.sh: $1" >&2
  # Don't exit with error - allow prompt to proceed even if logging fails
  exit 0
}

# Read JSON input from stdin with validation
json_input=$(cat) || error_exit "Failed to read stdin"
[ -z "$json_input" ] && error_exit "Empty input from stdin"

# Validate JSON input
if ! echo "$json_input" | jq empty 2>/dev/null; then
  error_exit "Invalid JSON input"
fi

# Extract the prompt and workspace info with error handling
prompt=$(echo "$json_input" | jq -r '.prompt // ""') || error_exit "Failed to extract prompt"
workspace_root=$(echo "$json_input" | jq -r '.workspace_roots[0] // "."') || error_exit "Failed to extract workspace_root"
conversation_id=$(echo "$json_input" | jq -r '.conversation_id // "unknown"') || error_exit "Failed to extract conversation_id"

# Create instructions log file
instructions_log="${workspace_root}/.cursor/agent-instructions.log"
instructions_dir=$(dirname "$instructions_log")

# Create the instructions log directory if it doesn't exist
mkdir -p "$instructions_dir" || error_exit "Failed to create instructions log directory"

# Log timestamp
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ") || error_exit "Failed to generate timestamp"

# Create safe prompt preview (handle empty or very short prompts)
if [ ${#prompt} -gt 100 ]; then
  prompt_preview="${prompt:0:100}..."
else
  prompt_preview="$prompt"
fi

# Create instruction reminder entry with validation
instruction_entry=$(jq -n \
  --arg timestamp "$timestamp" \
  --arg conversation_id "$conversation_id" \
  --arg prompt_preview "$prompt_preview" \
  '{
    "timestamp": $timestamp,
    "conversation_id": $conversation_id,
    "prompt_preview": $prompt_preview,
    "instructions": {
      "agent_audit_log": {
        "location": ".cursor/agent-audit.log",
        "required_fields": [
          "dateTime (ISO 8601 format)",
          "Topic",
          "List of impacted components",
          "Updated documentation files",
          "Short description"
        ],
        "note": "Automatically logged by stop hook"
      },
      "agents_files": {
        "root": "AGENTS.md - for workspace-wide or cross-service changes",
        "modules": [
          "services/backend/src/routing-table/AGENTS.md",
          "services/backend/src/segment-store/AGENTS.md",
          "services/backend/src/message-store/AGENTS.md"
        ],
        "format": "Add entry to '\''Change History'\'' section with timestamp (ISO 8601) and one-sentence description",
        "requirement": "MANDATORY for structural code changes"
      },
      "documentation_updates": {
        "design_changes": "Update module DESIGN.md files (after changes complete)",
        "global_changes": "Update docs/GLOBAL_ARCHITECTURE.md",
        "schema_changes": "Update services/backend/prisma/COMPLETE_DATABASE_SCHEMA.sql",
        "reference": "See .cursor/rules/rules.mdc for complete documentation requirements"
      }
    }
  }') || error_exit "Failed to create instruction entry JSON"

# Validate instruction entry JSON
if ! echo "$instruction_entry" | jq empty 2>/dev/null; then
  error_exit "Generated invalid instruction entry JSON"
fi

# Append to instructions log
echo "$instruction_entry" >> "$instructions_log" || error_exit "Failed to write to instructions log"

# Note: beforeSubmitPrompt cannot modify the prompt, but we log the instructions
# The agent should follow the rules in .cursor/rules/rules.mdc which already contains
# these requirements. This hook serves as an audit trail that instructions were
# referenced before prompt submission.

# Exit successfully (allowing the prompt to proceed)
exit 0

