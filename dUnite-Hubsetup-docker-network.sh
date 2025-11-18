#!/bin/bash
# Docker Network Setup for Unite-Hub Multi-Agent System

echo "Setting up Docker network for Unite-Hub..."

# Create external network if it doesnt exist
if ! docker network inspect unite-hub-network >/dev/null 2>&1; then
  echo "Creating unite-hub-network..."
  docker network create unite-hub-network
  echo "✅ Network created successfully"
else
  echo "ℹ️  Network unite-hub-network already exists"
fi

echo ""
echo "Network setup complete!"
echo ""
echo "Next steps:"
echo "1. Start RabbitMQ: docker-compose -f docker-compose.agents.yml up -d rabbitmq"
echo "2. Verify RabbitMQ: docker-compose -f docker-compose.agents.yml logs rabbitmq"
echo "3. Start all agents: docker-compose -f docker-compose.agents.yml up -d"

