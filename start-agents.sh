#!/bin/bash

# ==============================================
# Unite-Hub Multi-Agent System Startup Script
# ==============================================

set -e

echo "🚀 Starting Unite-Hub Multi-Agent System..."
echo ""

# Check if docker compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found. Please create it with required credentials."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Set default RabbitMQ credentials if not set
export RABBITMQ_USER=${RABBITMQ_USER:-unite_hub}
export RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-unite_hub_pass}

echo "📋 Configuration:"
echo "   Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL}"
echo "   RabbitMQ User: ${RABBITMQ_USER}"
echo ""

# Step 1: Start main infrastructure (if not running)
echo "1️⃣  Starting main infrastructure..."
docker-compose up -d redis

# Wait for Redis
echo "⏳ Waiting for Redis..."
sleep 5

# Step 2: Create network if it doesn't exist
echo "2️⃣  Creating Docker network..."
docker network create unite-hub-network 2>/dev/null || echo "   Network already exists"

# Step 3: Start multi-agent system
echo "3️⃣  Starting multi-agent system..."
docker-compose -f docker-compose.agents.yml up -d

# Step 4: Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Step 5: Show status
echo ""
echo "✅ Multi-Agent System Status:"
docker-compose -f docker-compose.agents.yml ps

echo ""
echo "📊 RabbitMQ Management UI:"
echo "   URL: http://localhost:15672"
echo "   Username: ${RABBITMQ_USER}"
echo "   Password: ${RABBITMQ_PASSWORD}"

echo ""
echo "📋 Useful Commands:"
echo "   View logs: docker-compose -f docker-compose.agents.yml logs -f [service]"
echo "   Stop agents: docker-compose -f docker-compose.agents.yml down"
echo "   Restart agent: docker-compose -f docker-compose.agents.yml restart [service]"
echo ""
echo "✅ Multi-agent system is running!"
