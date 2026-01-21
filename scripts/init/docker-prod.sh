#!/bin/bash
# Docker Production Automation Script
# Fully automates the Docker production environment setup and management

set -e

ACTION="${1:-up}"
SERVICE="${2:-}"
BUILD=false
DETACHED=true
FOLLOW=false

COMPOSE_FILE="infrastructure/docker-compose.prod.yml"
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
        *)
            shift
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${MAGENTA}========================================"
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

# Validate compose file
test_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $COMPOSE_FILE"
        print_info "Make sure you're running this script from the project root"
        exit 1
    fi
}

# Create or update .env file (same as in docker-dev.sh)
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

# Get database password from environment or use hardcoded default
get_database_password() {
    if [ -n "$MSSQL_SA_PASSWORD" ]; then
        echo "$MSSQL_SA_PASSWORD"
        return
    fi
    
    # Use hardcoded default password from .env file
    echo "YourStrong@Password123"
}

# Prompt for required environment variables interactively
get_required_environment_variables() {
    # Database password
    local db_password=$(get_database_password)
    if [ $? -ne 0 ] || [ -z "$db_password" ]; then
        return 1
    fi
    export MSSQL_SA_PASSWORD="$db_password"
    
    # DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        echo ""
        print_info "DATABASE_URL not set in environment"
        read -p "Enter DATABASE_URL (or press Enter to use default with provided password): " db_url
        if [ -z "$db_url" ]; then
            export DATABASE_URL="sqlserver://sqlserver:1433;database=routing_data_layer;user=sa;password=$db_password;encrypt=false;trustServerCertificate=true;connectionTimeout=30"
            print_info "Using default DATABASE_URL"
        else
            export DATABASE_URL="$db_url"
        fi
    fi
    
    # SHADOW_DATABASE_URL (optional, can be derived)
    if [ -z "$SHADOW_DATABASE_URL" ]; then
        export SHADOW_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/database=routing_data_layer/database=routing_data_layer_shadow/')
    fi
    
    # JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        echo ""
        print_info "JWT_SECRET not set in environment"
        read -sp "Enter JWT_SECRET: " jwt_secret
        echo ""
        if [ -z "$jwt_secret" ]; then
            print_error "JWT_SECRET is required for production"
            return 1
        fi
        export JWT_SECRET="$jwt_secret"
    fi
    
    # Create/update .env files
    echo ""
    print_info "Creating/updating .env files..."
    
    # Backend .env
    local backend_env_path="services/backend/.env"
    if [ ! -f "$backend_env_path" ]; then
        set_env_file "$backend_env_path" \
            "NODE_ENV=production" \
            "PORT=3001" \
            "DATABASE_URL=$DATABASE_URL" \
            "SHADOW_DATABASE_URL=$SHADOW_DATABASE_URL" \
            "JWT_SECRET=$JWT_SECRET"
        print_success "Backend .env file created at $backend_env_path"
    else
        set_env_file "$backend_env_path" --append \
            "NODE_ENV=production" \
            "DATABASE_URL=$DATABASE_URL" \
            "SHADOW_DATABASE_URL=$SHADOW_DATABASE_URL" \
            "JWT_SECRET=$JWT_SECRET"
        print_success "Backend .env file updated"
    fi
    
    # Frontend .env.production (if VITE_API_URL is set)
    if [ -n "$VITE_API_URL" ]; then
        local frontend_env_path="frontend/.env.production"
        if [ ! -f "$frontend_env_path" ]; then
            set_env_file "$frontend_env_path" \
                "VITE_API_URL=$VITE_API_URL"
            print_success "Frontend .env.production file created at $frontend_env_path"
        else
            set_env_file "$frontend_env_path" --append \
                "VITE_API_URL=$VITE_API_URL"
            print_success "Frontend .env.production file updated"
        fi
    fi
    
    # Root .env for docker-compose (optional, for MSSQL_SA_PASSWORD)
    local root_env_path=".env"
    if [ ! -f "$root_env_path" ]; then
        set_env_file "$root_env_path" \
            "MSSQL_SA_PASSWORD=$db_password"
        print_success "Root .env file created for docker-compose"
    fi
    
    return 0
}

# Validate environment variables
test_environment_variables() {
    print_info "Checking required environment variables..."
    
    local missing=()
    
    if [ -z "$MSSQL_SA_PASSWORD" ]; then
        missing+=("MSSQL_SA_PASSWORD")
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        missing+=("DATABASE_URL")
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        missing+=("JWT_SECRET")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_warning "Missing required environment variables: ${missing[*]}"
        print_info "You will be prompted to enter them interactively"
        return 1
    fi
    
    print_success "All required environment variables are set"
    return 0
}

# Main script
print_step "Docker Production Environment Manager"

test_docker
test_compose_file

# Get environment variables interactively if needed
if ! get_required_environment_variables; then
    print_error "Failed to get required environment variables"
    exit 1
fi

cd "$COMPOSE_DIR"

case "$ACTION" in
    up)
        print_step "Starting Production Environment"
        
        if [ "$BUILD" = true ]; then
            print_info "Building production images..."
            docker-compose -f docker-compose.prod.yml build
            print_success "Images built successfully"
        fi
        
        print_info "Starting production services..."
        if [ "$DETACHED" = true ]; then
            docker-compose -f docker-compose.prod.yml up -d
        else
            docker-compose -f docker-compose.prod.yml up
        fi
        
        print_success "Production environment started"
        print_info "Frontend: http://localhost:3000"
        print_info "Backend: http://localhost:3001"
        print_info "API Docs: http://localhost:3001/api/docs"
        print_info "Database: localhost:54321"
        echo ""
        print_warning "Make sure to set proper environment variables for production!"
        ;;
    
    down)
        print_step "Stopping Production Environment"
        print_info "Stopping all services..."
        docker-compose -f docker-compose.prod.yml down
        print_success "All services stopped"
        ;;
    
    restart)
        print_step "Restarting Production Environment"
        
        print_info "Stopping services..."
        docker-compose -f docker-compose.prod.yml down > /dev/null 2>&1
        
        if [ "$BUILD" = true ]; then
            print_info "Building images..."
            docker-compose -f docker-compose.prod.yml build
        fi
        
        print_info "Starting services..."
        if [ "$DETACHED" = true ]; then
            docker-compose -f docker-compose.prod.yml up -d
        else
            docker-compose -f docker-compose.prod.yml up
        fi
        print_success "Services restarted"
        ;;
    
    build)
        print_step "Building Production Images"
        print_info "Building all production images (this may take a while)..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        print_success "All images built successfully"
        print_info "Image sizes:"
        docker images | grep routing-data || true
        ;;
    
    deploy)
        print_step "Deploying Production Environment"
        
        print_info "Step 1: Building images..."
        docker-compose -f docker-compose.prod.yml build
        if [ $? -ne 0 ]; then
            print_error "Build failed"
            exit 1
        fi
        
        print_info "Step 2: Stopping existing services..."
        docker-compose -f docker-compose.prod.yml down > /dev/null 2>&1
        
        print_info "Step 3: Starting services..."
        docker-compose -f docker-compose.prod.yml up -d
        if [ $? -ne 0 ]; then
            print_error "Failed to start services"
            exit 1
        fi
        
        print_info "Step 4: Waiting for services to be healthy..."
        sleep 10
        
        print_info "Step 5: Running database migrations..."
        docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
        if [ $? -ne 0 ]; then
            print_warning "Migrations may have failed - check logs"
        else
            print_success "Migrations completed"
        fi
        
        print_success "Deployment completed"
        print_info "Checking service health..."
        docker-compose -f docker-compose.prod.yml ps
        ;;
    
    migrate)
        print_step "Running Database Migrations"
        print_info "Running Prisma migrations in production mode..."
        docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
        if [ $? -eq 0 ]; then
            print_success "Migrations completed"
        else
            print_error "Migrations failed"
            exit 1
        fi
        ;;
    
    logs)
        print_step "Viewing Production Logs"
        if [ -n "$SERVICE" ]; then
            print_info "Showing logs for: $SERVICE"
            if [ "$FOLLOW" = true ]; then
                docker-compose -f docker-compose.prod.yml logs -f "$SERVICE"
            else
                docker-compose -f docker-compose.prod.yml logs --tail=100 "$SERVICE"
            fi
        else
            print_info "Showing logs for all services"
            if [ "$FOLLOW" = true ]; then
                docker-compose -f docker-compose.prod.yml logs -f
            else
                docker-compose -f docker-compose.prod.yml logs --tail=100
            fi
        fi
        ;;
    
    clean)
        print_step "Cleaning Up Production Environment"
        print_warning "This will remove containers, networks, volumes, and images"
        print_warning "This action cannot be undone!"
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            print_info "Stopping and removing containers..."
            docker-compose -f docker-compose.prod.yml down -v
            print_info "Removing images..."
            docker-compose -f docker-compose.prod.yml down --rmi all
            print_success "Cleanup completed"
        else
            print_info "Cleanup cancelled"
        fi
        ;;
    
    status)
        print_step "Production Service Status"
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        print_info "Health checks:"
        docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        print_info "Resource usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose -f docker-compose.prod.yml ps -q) 2>/dev/null || true
        ;;
    
    shell)
        if [ -z "$SERVICE" ]; then
            print_error "Please specify a service name"
            print_info "Usage: ./docker-prod.sh shell <service>"
            print_info "Available services: backend, frontend, sqlserver"
            exit 1
        fi
        print_step "Opening Shell in $SERVICE"
        docker-compose -f docker-compose.prod.yml exec "$SERVICE" sh
        ;;
    
    *)
        print_error "Unknown action: $ACTION"
        echo ""
        echo -e "${YELLOW}Usage: ./docker-prod.sh [action] [options]${NC}"
        echo ""
        echo -e "${CYAN}Actions:${NC}"
        echo "  up       - Start production environment (default)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  build    - Build production images"
        echo "  deploy   - Full deployment (build + start + migrate)"
        echo "  migrate  - Run database migrations"
        echo "  logs     - View logs (use -s to filter)"
        echo "  clean    - Remove containers, volumes, and images"
        echo "  status   - Show status and resource usage"
        echo "  shell    - Open shell in service"
        echo ""
        echo -e "${CYAN}Options:${NC}"
        echo "  -s, --service <name>  - Target specific service"
        echo "  -b, --build           - Build images before starting"
        echo "  -d, --detached        - Run in background (default: true)"
        echo "  -f, --follow          - Follow log output"
        echo ""
        echo -e "${GREEN}Examples:${NC}"
        echo "  ./docker-prod.sh deploy"
        echo "  ./docker-prod.sh up --build"
        echo "  ./docker-prod.sh logs -s backend --follow"
        echo "  ./docker-prod.sh migrate"
        echo "  ./docker-prod.sh status"
        exit 1
        ;;
esac
