#!/bin/bash

# SnapRegister Redis Quick Start Script
# This script checks if Redis is running and starts it if needed

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SnapRegister Redis Quick Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if Redis is running
check_redis() {
    if redis-cli ping >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if Docker is available
check_docker() {
    if command -v docker >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if Redis container is running
check_redis_container() {
    if docker ps --format '{{.Names}}' | grep -q "snapregister-redis"; then
        return 0
    else
        return 1
    fi
}

# Function to check if Redis container exists (but may be stopped)
redis_container_exists() {
    if docker ps -a --format '{{.Names}}' | grep -q "snapregister-redis"; then
        return 0
    else
        return 1
    fi
}

# Function to start Redis with Docker
start_redis_docker() {
    echo -e "${YELLOW}Starting Redis with Docker...${NC}"

    if redis_container_exists; then
        echo -e "${BLUE}Found existing Redis container. Starting it...${NC}"
        docker start snapregister-redis
    else
        echo -e "${BLUE}Creating new Redis container...${NC}"
        docker run -d \
            --name snapregister-redis \
            -p 6379:6379 \
            -v snapregister-redis-data:/data \
            redis:7-alpine redis-server --appendonly yes
    fi

    # Wait for Redis to be ready
    echo -e "${BLUE}Waiting for Redis to be ready...${NC}"
    for i in {1..30}; do
        if check_redis; then
            echo -e "${GREEN}Redis is ready!${NC}"
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}Timeout waiting for Redis to start${NC}"
    return 1
}

# Function to start Redis with Docker Compose
start_redis_docker_compose() {
    if [ -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}Starting Redis with Docker Compose...${NC}"
        docker-compose up -d redis

        # Wait for Redis to be ready
        echo -e "${BLUE}Waiting for Redis to be ready...${NC}"
        for i in {1..30}; do
            if check_redis; then
                echo -e "${GREEN}Redis is ready!${NC}"
                return 0
            fi
            sleep 1
        done

        echo -e "${RED}Timeout waiting for Redis to start${NC}"
        return 1
    else
        return 1
    fi
}

# Function to start Redis as a system service (Linux/WSL)
start_redis_service_linux() {
    if command -v service >/dev/null 2>&1; then
        echo -e "${YELLOW}Starting Redis service (Linux/WSL)...${NC}"
        sudo service redis-server start
        sleep 2
        return 0
    fi
    return 1
}

# Function to start Redis as a Homebrew service (macOS)
start_redis_homebrew() {
    if command -v brew >/dev/null 2>&1; then
        if brew services list | grep -q redis; then
            echo -e "${YELLOW}Starting Redis with Homebrew...${NC}"
            brew services start redis
            sleep 2
            return 0
        fi
    fi
    return 1
}

# Function to show connection status
show_connection_status() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Redis Connection Status${NC}"
    echo -e "${BLUE}========================================${NC}"

    if check_redis; then
        echo -e "${GREEN}Status: Connected${NC}"

        # Get Redis info
        REDIS_VERSION=$(redis-cli INFO server | grep "redis_version" | cut -d':' -f2 | tr -d '\r')
        USED_MEMORY=$(redis-cli INFO memory | grep "used_memory_human" | cut -d':' -f2 | tr -d '\r')
        CONNECTED_CLIENTS=$(redis-cli INFO clients | grep "connected_clients" | cut -d':' -f2 | tr -d '\r')
        UPTIME=$(redis-cli INFO server | grep "uptime_in_seconds" | cut -d':' -f2 | tr -d '\r')

        echo -e "${BLUE}Version:${NC} $REDIS_VERSION"
        echo -e "${BLUE}Memory Used:${NC} $USED_MEMORY"
        echo -e "${BLUE}Connected Clients:${NC} $CONNECTED_CLIENTS"
        echo -e "${BLUE}Uptime:${NC} $UPTIME seconds"

        # Check environment variables
        echo ""
        echo -e "${BLUE}Environment Configuration:${NC}"
        if [ -n "$REDIS_URL" ]; then
            echo -e "${GREEN}REDIS_URL:${NC} $REDIS_URL"
        else
            echo -e "${YELLOW}REDIS_URL: Not set (using default: redis://localhost:6379)${NC}"
        fi

        # Test BullMQ queues
        echo ""
        echo -e "${BLUE}Checking BullMQ queues...${NC}"
        QUEUE_KEYS=$(redis-cli KEYS "bull:*" 2>/dev/null | wc -l)
        if [ "$QUEUE_KEYS" -gt 0 ]; then
            echo -e "${GREEN}Found $QUEUE_KEYS BullMQ queue keys${NC}"
            echo -e "${BLUE}Active queues:${NC}"
            redis-cli KEYS "bull:*:meta" 2>/dev/null | sed 's/bull://g' | sed 's/:meta//g' | while read queue; do
                echo -e "  - $queue"
            done
        else
            echo -e "${YELLOW}No BullMQ queues found (this is normal on first run)${NC}"
        fi

        echo ""
        echo -e "${GREEN}You can now run:${NC}"
        echo -e "  ${BLUE}npm run worker:dev${NC}    - Start the background workers"
        echo -e "  ${BLUE}npm run test:redis${NC}    - Test Redis and BullMQ integration"
        echo -e "  ${BLUE}redis-cli${NC}             - Open Redis CLI"

    else
        echo -e "${RED}Status: Not Connected${NC}"
        echo -e "${YELLOW}Redis is not accessible. Please check the error messages above.${NC}"
    fi

    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Main script logic
echo -e "${BLUE}Checking Redis status...${NC}"

if check_redis; then
    echo -e "${GREEN}Redis is already running!${NC}"
    show_connection_status
    exit 0
fi

echo -e "${YELLOW}Redis is not running. Attempting to start...${NC}"
echo ""

# Try different methods to start Redis
STARTED=false

# Method 1: Docker Compose
if ! $STARTED && [ -f "docker-compose.yml" ] && check_docker; then
    if start_redis_docker_compose; then
        STARTED=true
    fi
fi

# Method 2: Docker (standalone)
if ! $STARTED && check_docker; then
    if start_redis_docker; then
        STARTED=true
    fi
fi

# Method 3: Homebrew (macOS)
if ! $STARTED; then
    if start_redis_homebrew; then
        STARTED=true
    fi
fi

# Method 4: System service (Linux/WSL)
if ! $STARTED; then
    if start_redis_service_linux; then
        STARTED=true
    fi
fi

# Check final status
if check_redis; then
    echo -e "${GREEN}Successfully started Redis!${NC}"
    show_connection_status
    exit 0
else
    echo ""
    echo -e "${RED}Failed to start Redis automatically.${NC}"
    echo -e "${YELLOW}Please start Redis manually using one of these methods:${NC}"
    echo ""
    echo -e "${BLUE}Docker:${NC}"
    echo -e "  docker run -d --name snapregister-redis -p 6379:6379 redis:7-alpine"
    echo ""
    echo -e "${BLUE}Docker Compose:${NC}"
    echo -e "  docker-compose up -d redis"
    echo ""
    echo -e "${BLUE}macOS (Homebrew):${NC}"
    echo -e "  brew services start redis"
    echo ""
    echo -e "${BLUE}Linux/WSL:${NC}"
    echo -e "  sudo service redis-server start"
    echo ""
    echo -e "${BLUE}Windows (Memurai):${NC}"
    echo -e "  Start Memurai from Windows Services or Start Menu"
    echo ""
    echo -e "${YELLOW}For detailed setup instructions, see:${NC}"
    echo -e "  ${BLUE}website/docs/REDIS_SETUP.md${NC}"
    echo ""
    exit 1
fi
