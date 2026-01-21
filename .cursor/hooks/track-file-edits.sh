#!/bin/bashDISABLED

# track-file-edits.sh - Hook script that tracks file edits during agent session
# This hook is triggered after each file edit (afterFileEdit event)
# It maintains a session file with all edited files for aggregation in the stop hook

# Function to ensure jq is installed
ensure_jq() {u
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
  echo "Error in track-file-edits.sh: $1" >&2
  exit 1
}

# Read JSON input from stdin with validation
json_input=$(cat) || error_exit "Failed to read stdin"
[ -z "$json_input" ] && error_exit "Empty input from stdin"

# Validate JSON input
if ! echo "$json_input" | jq empty 2>/dev/null; then
  error_exit "Invalid JSON input"
fi

# Extract relevant information with error handling
file_path=$(echo "$json_input" | jq -r '.file_path // ""') || error_exit "Failed to extract file_path"
conversation_id=$(echo "$json_input" | jq -r '.conversation_id // "unknown"') || error_exit "Failed to extract conversation_id"
workspace_root=$(echo "$json_input" | jq -r '.workspace_roots[0] // "."') || error_exit "Failed to extract workspace_root"

# Validate required fields
[ -z "$file_path" ] && error_exit "file_path is empty"
[ -z "$conversation_id" ] && error_exit "conversation_id is empty"

# Create session tracking file
session_file="${workspace_root}/.cursor/agent-session-${conversation_id}.json"
session_dir=$(dirname "$session_file")
lock_file="${session_file}.lock"

# Create the session directory if it doesn't exist
mkdir -p "$session_dir" || error_exit "Failed to create session directory"

# Cleanup function to remove lock file
cleanup_lock() {
  rm -f "$lock_file" 2>/dev/null || true
}

# Set trap to ensure lock file is cleaned up on exit (success or failure)
trap cleanup_lock EXIT

# Atomic file update using file locking
(
  # Wait for lock (up to 10 seconds) and execute in subshell
  flock -w 10 200 || {
    cleanup_lock
    error_exit "Failed to acquire lock on session file"
  }

  # Initialize or read existing session data with validation
  if [ -f "$session_file" ]; then
    session_data=$(cat "$session_file") || {
      cleanup_lock
      error_exit "Failed to read session file"
    }
    # Validate existing JSON
    if ! echo "$session_data" | jq empty 2>/dev/null; then
      # Invalid JSON, reset to default
      session_data='{"files": [], "documentation": []}'
    fi
  else
    session_data='{"files": [], "documentation": []}'
  fi

  # Determine if this is a documentation file
  is_documentation=false
  if [[ "$file_path" == *"/docs/"* ]] || \
     [[ "$file_path" == *"/AGENTS.md" ]] || \
     [[ "$file_path" == *"/DESIGN.md" ]] || \
     [[ "$file_path" == *"DESIGN.md" ]] || \
     [[ "$file_path" == *"AGENTS.md" ]] || \
     [[ "$file_path" == *".md" ]]; then
    is_documentation=true
  fi

  # Get relative path from workspace root
  relative_path="${file_path#$workspace_root/}"
  [ -z "$relative_path" ] && relative_path="$file_path"

  # Add file to session tracking with validation
  if [ "$is_documentation" = true ]; then
    # Add to documentation array
    new_session_data=$(echo "$session_data" | jq \
      --arg path "$relative_path" \
      '.documentation += [$path] | .documentation |= unique') || {
      cleanup_lock
      error_exit "Failed to update documentation array"
    }
    # Validate output JSON
    if ! echo "$new_session_data" | jq empty 2>/dev/null; then
      cleanup_lock
      error_exit "Generated invalid JSON for documentation update"
    fi
    session_data="$new_session_data"
  else
    # Add to files array (impacted components)
    new_session_data=$(echo "$session_data" | jq \
      --arg path "$relative_path" \
      '.files += [$path] | .files |= unique') || {
      cleanup_lock
      error_exit "Failed to update files array"
    }
    # Validate output JSON
    if ! echo "$new_session_data" | jq empty 2>/dev/null; then
      cleanup_lock
      error_exit "Generated invalid JSON for files update"
    fi
    session_data="$new_session_data"
  fi

  # Write updated session data back atomically
  echo "$session_data" > "${session_file}.tmp" || {
    cleanup_lock
    error_exit "Failed to write temporary session file"
  }
  mv "${session_file}.tmp" "$session_file" || {
    cleanup_lock
    error_exit "Failed to move temporary session file"
  }

) 200>"$lock_file" || {
  cleanup_lock
  error_exit "Failed to execute locked section"
}

# Explicitly clean up lock file on successful completion
cleanup_lock

# Exit successfully
exit 0

