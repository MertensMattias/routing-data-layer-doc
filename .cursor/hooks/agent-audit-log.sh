#!/bin/bashDISABLED

# agent-audit-log.sh - Hook script that logs agent changes after completion
# This hook is triggered when the agent loop ends (stop event)
# It captures: dateTime, Topic, impacted components, updated documentation, short description

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
  echo "Error in agent-audit-log.sh: $1" >&2
  exit 1
}

# Read JSON input from stdin with validation
json_input=$(cat) || error_exit "Failed to read stdin"
[ -z "$json_input" ] && error_exit "Empty input from stdin"

# Validate JSON input
if ! echo "$json_input" | jq empty 2>/dev/null; then
  error_exit "Invalid JSON input"
fi

# Extract relevant information from the input with error handling
conversation_id=$(echo "$json_input" | jq -r '.conversation_id // "unknown"') || error_exit "Failed to extract conversation_id"
generation_id=$(echo "$json_input" | jq -r '.generation_id // "unknown"') || error_exit "Failed to extract generation_id"
status=$(echo "$json_input" | jq -r '.status // "unknown"') || error_exit "Failed to extract status"
loop_count=$(echo "$json_input" | jq -r '.loop_count // 0') || error_exit "Failed to extract loop_count"
workspace_root=$(echo "$json_input" | jq -r '.workspace_roots[0] // "."') || error_exit "Failed to extract workspace_root"

# Create timestamp (ISO 8601 format)
dateTime=$(date -u +"%Y-%m-%dT%H:%M:%SZ") || error_exit "Failed to generate timestamp"

# Determine audit log location (project-level)
audit_log="${workspace_root}/.cursor/agent-audit.log"
audit_log_dir=$(dirname "$audit_log")

# Create the audit log directory if it doesn't exist
mkdir -p "$audit_log_dir" || error_exit "Failed to create audit log directory"

# Try to extract topic from conversation context or use default
# In a real implementation, you might parse the conversation history
topic="Agent Task Completion"

# Initialize default values
impacted_components="[]"
updated_documentation="[]"

# Load session tracking data to get impacted components and documentation
session_file="${workspace_root}/.cursor/agent-session-${conversation_id}.json"
lock_file="${session_file}.lock"

if [ -f "$session_file" ]; then
  # Use flock to wait for lock to be released (if held by track-file-edits.sh)
  # Wait up to 5 seconds for the lock, then proceed to read the file
  # We acquire the lock briefly to ensure no one else is writing, then release it
  session_data=$(
    (
      # Try to acquire lock with timeout (non-blocking check first, then wait)
      if ! flock -n 200 2>/dev/null; then
        # Lock is held, wait for it with timeout
        flock -w 5 200 2>/dev/null || true  # Timeout after 5 seconds, proceed anyway
      fi
      # Lock acquired (or timed out) - read file while holding lock briefly
      # This ensures we read a consistent state
      cat "$session_file"
    ) 200>"$lock_file" 2>/dev/null
  ) || {
    # Fallback: if flock fails, just read the file directly
    session_data=$(cat "$session_file") || error_exit "Failed to read session file"
  }

  # Validate session JSON before parsing
  if echo "$session_data" | jq empty 2>/dev/null; then
    # Extract with validation
    temp_components=$(echo "$session_data" | jq -c '.files // []' 2>/dev/null) || temp_components="[]"
    temp_docs=$(echo "$session_data" | jq -c '.documentation // []' 2>/dev/null) || temp_docs="[]"

    # Validate extracted JSON arrays
    if echo "$temp_components" | jq empty 2>/dev/null && \
       echo "$temp_docs" | jq empty 2>/dev/null; then
      impacted_components="$temp_components"
      updated_documentation="$temp_docs"
    else
      # Invalid JSON, use defaults
      impacted_components="[]"
      updated_documentation="[]"
    fi
  else
    # Invalid JSON in session file, use defaults
    impacted_components="[]"
    updated_documentation="[]"
  fi

  # Clean up session file and lock after reading
  rm -f "$session_file" "$lock_file" 2>/dev/null || true
fi

# Validate that we have valid JSON arrays before using with --argjson
if ! echo "$impacted_components" | jq empty 2>/dev/null; then
  impacted_components="[]"
fi
if ! echo "$updated_documentation" | jq empty 2>/dev/null; then
  updated_documentation="[]"
fi

# Generate short description based on status
case "$status" in
  "completed")
    short_description="Agent task completed successfully"
    ;;
  "aborted")
    short_description="Agent task was aborted"
    ;;
  "error")
    short_description="Agent task encountered an error"
    ;;
  *)
    short_description="Agent task ended with status: $status"
    ;;
esac

# Create audit log entry with validation
audit_entry=$(jq -n \
  --arg dateTime "$dateTime" \
  --arg topic "$topic" \
  --argjson impacted_components "$impacted_components" \
  --argjson updated_documentation "$updated_documentation" \
  --arg short_description "$short_description" \
  --arg conversation_id "$conversation_id" \
  --arg generation_id "$generation_id" \
  --arg status "$status" \
  --arg loop_count "$loop_count" \
  '{
    "dateTime": $dateTime,
    "topic": $topic,
    "impacted_components": $impacted_components,
    "updated_documentation": $updated_documentation,
    "short_description": $short_description,
    "metadata": {
      "conversation_id": $conversation_id,
      "generation_id": $generation_id,
      "status": $status,
      "loop_count": ($loop_count | tonumber)
    }
  }') || error_exit "Failed to create audit entry JSON"

# Validate audit entry JSON
if ! echo "$audit_entry" | jq empty 2>/dev/null; then
  error_exit "Generated invalid audit entry JSON"
fi

# Append to audit log
echo "$audit_entry" >> "$audit_log" || error_exit "Failed to write to audit log"

# Exit successfully
exit 0

