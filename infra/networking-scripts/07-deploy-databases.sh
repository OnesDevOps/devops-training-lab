#!/bin/bash
# ==============================================================================
# Script: 07-deploy-databases.sh
# Purpose: Installs Docker and deploys the 5 stateful databases across the VMs
# Run on: Datacenter (Lenovo Laptop - 192.168.8.40)
# ==============================================================================

set -e

DB2_IP="10.202.73.133"

echo "================================================="
echo "   Deploying Database Tier"
echo "================================================="

# 1. Install Docker on both nodes
echo "▶ Installing Docker on db-node-1..."
multipass exec db-node-1 -- bash -c 'curl -fsSL https://get.docker.com | sudo sh'

echo "▶ Installing Docker on db-node-2..."
multipass exec db-node-2 -- bash -c 'curl -fsSL https://get.docker.com | sudo sh'

# 2. Deploy db-node-1 services (Postgres, Mongo, Redis)
echo ""
echo "--- Deploying services on db-node-1 ---"

echo "▶ Deploying PostgreSQL..."
multipass exec db-node-1 -- sudo docker run -d \
    --name postgres \
    --restart unless-stopped \
    -p 5432:5432 \
    -e POSTGRES_DB=customerdb \
    -e POSTGRES_USER=lab_admin \
    -e POSTGRES_PASSWORD=changeme_in_production \
    -v pgdata:/var/lib/postgresql/data \
    postgres:16-alpine \
    postgres -c shared_buffers=128MB -c max_connections=20

echo "▶ Deploying MongoDB..."
multipass exec db-node-1 -- sudo docker run -d \
    --name mongodb \
    --restart unless-stopped \
    -p 27017:27017 \
    -v mongodata:/data/db \
    mongo:7.0

echo "▶ Deploying Redis..."
multipass exec db-node-1 -- sudo docker run -d \
    --name redis \
    --restart unless-stopped \
    -p 6379:6379 \
    redis:7-alpine \
    redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

# 3. Deploy db-node-2 services (Kafka, MinIO)
echo ""
echo "--- Deploying services on db-node-2 ---"

echo "▶ Deploying Apache Kafka (KRaft)..."
multipass exec db-node-2 -- sudo docker run -d \
    --name kafka \
    --restart unless-stopped \
    --network host \
    -e KAFKA_NODE_ID=1 \
    -e KAFKA_PROCESS_ROLES=broker,controller \
    -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093 \
    -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://${DB2_IP}:9092 \
    -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
    -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
    -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
    -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
    -e KAFKA_HEAP_OPTS="-Xmx512m -Xms512m" \
    -v kafka_data:/var/lib/kafka/data \
    apache/kafka:latest

echo "▶ Deploying MinIO..."
multipass exec db-node-2 -- sudo docker run -d \
    --name minio \
    --restart unless-stopped \
    -p 9000:9000 \
    -p 9001:9001 \
    -e MINIO_ROOT_USER=admin \
    -e MINIO_ROOT_PASSWORD=password \
    -v miniodata:/data \
    minio/minio server /data --console-address ":9001"

# 4. Wait for Kafka to boot and create topics
echo ""
echo "▶ Waiting 15 seconds for Kafka to start..."
sleep 15
echo "▶ Creating Kafka topics..."
multipass exec db-node-2 -- sudo docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic customer-events --partitions 1 --replication-factor 1 || true

multipass exec db-node-2 -- sudo docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab-events --partitions 1 --replication-factor 1 || true

echo "================================================="
echo "🎉 Database Tier Successfully Deployed!"
echo "================================================="
