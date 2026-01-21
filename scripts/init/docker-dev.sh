#!/bin/bash
# Docker Development Automation Script
# Fully automates the Docker development environment setup and management

set -e

ACTION="${1:-up}"
SERVICE="${2:-}"
BUILD=false
DETACHED=false
FOLLOW=false
INIT=false
SKIP_INIT=false

COMPOSE_FILE="infrastructure/docker-compose.yml"
COMPOSE_DIR="infrastructure"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -d|--detached)
            DETACHED=true
            shift
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        --init)
            INIT=true
            shift
            ;;
        --skip-init)
            SKIP_INIT=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${CYAN}========================================"
    echo -e "$1"
    echo -e "========================================${NC}"
}

print_info() {
    echo -e "  ${GRAY}ℹ️  $1${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "  ${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "  ${YELLOW}⚠️  $1${NC}"
}

# Validate Docker
test_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not available or not in PATH"
        exit 1
    fi
}

# Create or update .env file
set_env_file() {
    local file_path="$1"
    shift
    local append=false
    local vars=()
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --append)
                append=true
                shift
                ;;
            *)
                vars+=("$1")
                shift
                ;;
        esac
    done
    
    # Ensure directory exists
    local dir=$(dirname "$file_path")
    if [ -n "$dir" ] && [ ! -d "$dir" ]; then
        mkdir -p "$dir"
    fi
    
    # For simplicity, we'll overwrite or append key=value pairs
    # This is a basic implementation - could be enhanced
    if [ "$append" = true ] && [ -f "$file_path" ]; then
        # Append mode - add new variables, update existing ones
        local temp_file=$(mktemp)
        local updated=false
        
        while IFS= read -r line; do
            local key=$(echo "$line" | cut -d'=' -f1 | xargs)
            local found=false
            for var in "${vars[@]}"; do
                local var_key=$(echo "$var" | cut -d'=' -f1 | xargs)
                if [ "$key" = "$var_key" ]; then
                    echo "$var" >> "$temp_file"
                    found=true
                    updated=true
                    break
                fi
            done
            if [ "$found" = false ]; then
                echo "$line" >> "$temp_file"
            fi
        done < "$file_path"
        
        # Add new variables
        for var in "${vars[@]}"; do
            local var_key=$(echo "$var" | cut -d'=' -f1 | xargs)
            if ! grep -q "^${var_key}=" "$temp_file"; then
                echo "$var" >> "$temp_file"
                updated=true
            fi
        done
        
        if [ "$updated" = true ]; then
            mv "$temp_file" "$file_path"
        else
            rm "$temp_file"
        fi
    else
        # Create new file
        > "$file_path"
        for var in "${vars[@]}"; do
            echo "$var" >> "$file_path"
        done
    fi
}

# Prompt for database password if not set and create/update .env files
initialize_environment_files() {
    local db_password="$MSSQL_SA_PASSWORD"
    local backend_env_path="services/backend/.env"
    local frontend_env_path="frontend/.env.development"
    
    # Try to read from existing .env file
    if [ -z "$db_password" ] && [ -f "$backend_env_path" ]; then
        db_password=$(grep -oP 'DATABASE_URL=.*?password=\K[^;]+' "$backend_env_path" 2>/dev/null || echo "")
    fi
    
    if [ -z "$db_password" ]; then
        # Use hardcoded default password from .env file
        db_password="YourStrong@Password123"
    fi
    
    export MSSQL_SA_PASSWORD="$db_password"
    
    # Create/update backend .env file
    if [ ! -f "$backend_env_path" ]; then
        print_info "Creating backend .env file..."
        set_env_file "$backend_env_path" \
            "NODE_ENV=development" \
            "PORT=3001" \
            "DATABASE_URL=sqlserver://localhost:54321;database=routing_data_layer;user=sa;password=$db_password;encrypt=false;trustServerCertificate=true;connectionTimeout=30" \
            "SHADOW_DATABASE_URL=sqlserver://localhost:54321;database=routing_data_layer_shadow;user=sa;password=$db_password;encrypt=false;trustServerCertificate=true;connectionTimeout=30" \
            "JWT_SECRET=dev-secret-key-change-in-production" \
            "FRONTEND_URL=http://localhost:3000"
        print_success "Backend .env file created at $backend_env_path"
    else
        # Update password if changed
        local current_password=$(grep -oP 'DATABASE_URL=.*?password=\K[^;]+' "$backend_env_path" 2>/dev/null || echo "")
        if [ "$current_password" != "$db_password" ]; then
            print_info "Updating backend .env file with new password..."
            set_env_file "$backend_env_path" --append \
                "DATABASE_URL=sqlserver://localhost:54321;database=routing_data_layer;user=sa;password=$db_password;encrypt=false;trustServerCertificate=true;connectionTimeout=30" \
                "SHADOW_DATABASE_URL=sqlserver://localhost:54321;database=routing_data_layer_shadow;user=sa;password=$db_password;encrypt=false;trustServerCertificate=true;connectionTimeout=30"
            print_success "Backend .env file updated"
        fi
    fi
    
    # Create/update frontend .env.development file
    if [ ! -f "$frontend_env_path" ]; then
        print_info "Creating frontend .env.development file..."
        set_env_file "$frontend_env_path" \
            "VITE_API_URL=http://localhost:3001/api/v1"
        print_success "Frontend .env.development file created at $frontend_env_path"
    fi
    
    echo "$db_password"
}

# Validate compose file
test_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $COMPOSE_FILE"
        print_info "Make sure you're running this script from the project root"
        exit 1
    fi
}

# Main script
print_step "Docker Development Environment Manager"

test_docker
test_compose_file

# Initialize environment files
DB_PASSWORD=$(initialize_environment_files)

# Check if initialization is needed (only for 'up' action)
if [ "$ACTION" = "up" ] && [ "$SKIP_INIT" = false ]; then
    init_needed=()
    
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        init_needed+=("Root dependencies")
    fi
    if [ ! -d "services/backend/node_modules" ]; then
        init_needed+=("Backend dependencies")
    fi
    if [ ! -d "frontend/node_modules" ]; then
        init_needed+=("Frontend dependencies")
    fi
    
    # Check if Prisma client is generated
    if [ ! -d "services/backend/node_modules/.prisma" ]; then
        init_needed+=("Prisma client")
    fi
    
    if [ ${#init_needed[@]} -gt 0 ] || [ "$INIT" = true ]; then
        if [ "$INIT" = true ]; then
            echo ""
            print_info "Initialization requested"
        else
            echo ""
            print_warning "Repository appears to need initialization"
            print_info "Missing: $(IFS=', '; echo "${init_needed[*]}")"
            echo ""
            read -p "Would you like to initialize now? (Y/n) " response
            if [ "$response" = "n" ] || [ "$response" = "N" ]; then
                print_info "Skipping initialization. Run with --init flag to initialize later."
            else
                INIT=true
            fi
        fi
        
        if [ "$INIT" = true ]; then
            print_step "Initializing Repository"
            
            # Install dependencies
            print_info "Installing root dependencies..."
            npm install > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                print_success "Root dependencies installed"
            else
                print_error "Failed to install root dependencies"
                exit 1
            fi
            
            print_info "Installing backend dependencies..."
            (cd services/backend && npm install > /dev/null 2>&1)
            if [ $? -eq 0 ]; then
                print_success "Backend dependencies installed"
            else
                print_error "Failed to install backend dependencies"
                exit 1
            fi
            
            print_info "Installing frontend dependencies..."
            (cd frontend && npm install > /dev/null 2>&1)
            if [ $? -eq 0 ]; then
                print_success "Frontend dependencies installed"
            else
                print_error "Failed to install frontend dependencies"
                exit 1
            fi
            
            # Generate Prisma client
            print_info "Generating Prisma client..."
            (cd services/backend && npx prisma generate > /dev/null 2>&1)
            if [ $? -eq 0 ]; then
                print_success "Prisma client generated"
            else
                print_warning "Prisma client generation had issues"
            fi
            
            # Database setup
            print_info "Setting up database..."
            npm run db:start > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                print_success "Database container started"
                
                print_info "Waiting for database to be ready..."
                npm run db:wait > /dev/null 2>&1
                if [ $? -eq 0 ]; then
                    print_success "Database is ready"
                    
                    # Run migrations
                    print_info "Running migrations..."
                    (cd services/backend && npx prisma migrate dev --name init > /dev/null 2>&1)
                    if [ $? -eq 0 ]; then
                        print_success "Migrations completed"
                    else
                        print_warning "Migrations had issues"
                    fi
                    
                    # Run seeds
                    print_info "Running seeds..."
                    npm run seeds > /dev/null 2>&1
                    if [ $? -eq 0 ]; then
                        print_success "Seeds completed"
                    else
                        print_warning "Seeds had issues"
                    fi
                else
                    print_warning "Database did not become ready in time"
                fi
            else
                print_warning "Could not start database container"
            fi
            
            print_success "Initialization completed"
            echo ""
        fi
    fi
fi

cd "$COMPOSE_DIR"

case "$ACTION" in
    up)
        print_step "Starting Development Environment"
        
        if [ "$BUILD" = true ]; then
            print_info "Building images..."
            docker-compose build
            print_success "Images built successfully"
        fi
        
        print_info "Starting services..."
        if [ "$DETACHED" = true ]; then
            docker-compose up -d
        else
            docker-compose up
        fi
        
        print_success "Development environment started"
        print_info "Frontend: http://localhost:3000"
        print_info "Backend: http://localhost:3001"
        print_info "API Docs: http://localhost:3001/api/docs"
        print_info "Database: localhost:54321"
        ;;
    
    down)
        print_step "Stopping Development Environment"
        print_info "Stopping all services..."
        docker-compose down
        print_success "All services stopped"
        ;;
    
    restart)
        print_step "Restarting Development Environment"
        print_info "Stopping services..."
        docker-compose down > /dev/null 2>&1
        
        if [ "$BUILD" = true ]; then
            print_info "Building images..."
            docker-compose build
        fi
        
        print_info "Starting services..."
        if [ "$DETACHED" = true ]; then
            docker-compose up -d
        else
            docker-compose up
        fi
        print_success "Services restarted"
        ;;
    
    logs)
        print_step "Viewing Logs"
        if [ -n "$SERVICE" ]; then
            print_info "Showing logs for: $SERVICE"
            if [ "$FOLLOW" = true ]; then
                docker-compose logs -f "$SERVICE"
            else
                docker-compose logs --tail=100 "$SERVICE"
            fi
        else
            print_info "Showing logs for all services"
            if [ "$FOLLOW" = true ]; then
                docker-compose logs -f
            else
                docker-compose logs --tail=100
            fi
        fi
        ;;
    
    build)
        print_step "Building Images"
        print_info "Building all service images..."
        docker-compose build --no-cache
        print_success "All images built successfully"
        ;;
    
    clean)
        print_step "Cleaning Up"
        print_warning "This will remove containers, networks, and volumes"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Stopping and removing containers..."
            docker-compose down -v
            print_info "Removing images..."
            docker-compose down --rmi all
            print_success "Cleanup completed"
        else
            print_info "Cleanup cancelled"
        fi
        ;;
    
    status)
        print_step "Service Status"
        docker-compose ps
        echo ""
        print_info "Health checks:"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        ;;
    
    shell)
        if [ -z "$SERVICE" ]; then
            print_error "Please specify a service name"
            print_info "Usage: ./docker-dev.sh shell <service>"
            print_info "Available services: backend, frontend, sqlserver"
            exit 1
        fi
        print_step "Opening Shell in $SERVICE"
        docker-compose exec "$SERVICE" sh
        ;;
    
    *)
        print_error "Unknown action: $ACTION"
        echo ""
        echo -e "${YELLOW}Usage: ./docker-dev.sh [action] [options]${NC}"
        echo ""
        echo -e "${CYAN}Actions:${NC}"
        echo "  up       - Start development environment (default)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View logs (use -s to filter)"
        echo "  build    - Build all images"
        echo "  clean    - Remove containers, volumes, and images"
        echo "  status   - Show service status"
        echo "  shell    - Open shell in service"
        echo ""
        echo -e "${CYAN}Options:${NC}"
        echo "  -s, --service <name>  - Target specific service"
        echo "  -b, --build           - Build images before starting"
        echo "  -d, --detached        - Run in background"
        echo "  -f, --follow          - Follow log output"
        echo "  --init                - Initialize repository (install deps, setup DB)"
        echo "  --skip-init           - Skip automatic initialization check"
        echo ""
        echo -e "${GREEN}Examples:${NC}"
        echo "  ./docker-dev.sh up"
        echo "  ./docker-dev.sh up --build --detached"
        echo "  ./docker-dev.sh logs -s backend --follow"
        echo "  ./docker-dev.sh shell backend"
        exit 1
        ;;
esac
