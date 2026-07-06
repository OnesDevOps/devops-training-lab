# Step 5 — Apache Kafka (KRaft Mode)

> Deploy Kafka on the Datacenter as a Docker container outside K3s. KRaft mode eliminates the need for ZooKeeper.

---

## 01 — Deploy with Terraform

Create `infra/05-kafka/terraform/kafka.tf`:

```hcl
resource "docker_image" "kafka" {
  name = "apache/kafka:latest"
}

resource "docker_volume" "kafka_data" {
  name = "kafka-data"
}

resource "docker_container" "kafka" {
  name  = "kafka"
  image = docker_image.kafka.image_id

  ports {
    internal = 9092
    external = 9092
  }

  env = [
    "KAFKA_NODE_ID=1",
    "KAFKA_PROCESS_ROLES=broker,controller",
    "KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093",
    "KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://${var.datacenter_ip}:9092",
    "KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT",
    "KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093",
    "KAFKA_LOG_DIRS=/var/lib/kafka/data",
    "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1",
    "KAFKA_HEAP_OPTS=-Xmx512m -Xms512m",
  ]

  volumes {
    volume_name    = docker_volume.kafka_data.name
    container_path = "/var/lib/kafka/data"
  }

  memory = 1024

  networks_advanced {
    name = docker_network.lab_net.name
  }

  restart = "unless-stopped"
}
```

### Apply

```bash
cd infra/05-kafka/terraform
terraform init && terraform apply
```

---

## 02 — Create Topics

```bash
ssh datacenter "docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic customer-events --partitions 1 --replication-factor 1"

ssh datacenter "docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab-events --partitions 1 --replication-factor 1"

# Verify
ssh datacenter "docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list"
```

---

## 03 — Test Produce & Consume

```bash
# Terminal 1 — Consumer
ssh datacenter "docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic customer-events --from-beginning"

# Terminal 2 — Producer
ssh datacenter "docker exec -it kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic customer-events"
# Type a message and hit Enter — it should appear in Terminal 1
```

---

## ✅ Success Criteria

- [ ] Kafka container running on Datacenter
- [ ] Topics `customer-events` and `lab-events` created
- [ ] Produce/consume test passes

> **Next →** [06 — Redis](../06-redis/)
