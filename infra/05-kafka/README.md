# Step 5 — Apache Kafka (KRaft Mode)

> Deploy Kafka on the Datacenter as a Docker container outside K3s. KRaft mode eliminates the need for ZooKeeper.

---

## 01 — Deploy Kafka on `db-node-2`

Because our databases run across multiple dedicated Multipass VMs, we will deploy Kafka directly onto `db-node-2` using Docker.

Run the following command from the **Developer Desktop** to launch Kafka in KRaft mode via SSH:

```bash
# Replace 10.202.73.133 with the actual IP of db-node-2
ssh ubuntu@10.202.73.133 '
  docker run -d \
    --name kafka \
    --restart unless-stopped \
    --network host \
    -e KAFKA_NODE_ID=1 \
    -e KAFKA_PROCESS_ROLES=broker,controller \
    -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093 \
    -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://10.202.73.133:9092 \
    -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
    -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
    -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
    -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
    -e KAFKA_HEAP_OPTS="-Xmx512m -Xms512m" \
    -v kafka_data:/var/lib/kafka/data \
    apache/kafka:latest
'
```

---

## 02 — Create Topics

## 02 — Create Topics

Create the topics required by our microservices:

```bash
ssh ubuntu@10.202.73.133 "docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic customer-events --partitions 1 --replication-factor 1"

ssh ubuntu@10.202.73.133 "docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab-events --partitions 1 --replication-factor 1"

# Verify
ssh ubuntu@10.202.73.133 "docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list"
```

---

## 03 — Test Produce & Consume

```bash
# Terminal 1 — Consumer
ssh ubuntu@10.202.73.133 "docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic customer-events --from-beginning"

# Terminal 2 — Producer
ssh ubuntu@10.202.73.133 "docker exec -it kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic customer-events"
# Type a message and hit Enter — it should appear in Terminal 1
```

---

## ✅ Success Criteria

- [ ] Kafka container running on Datacenter
- [ ] Topics `customer-events` and `lab-events` created
- [ ] Produce/consume test passes

> **Next →** [06 — Redis](../06-redis/)
