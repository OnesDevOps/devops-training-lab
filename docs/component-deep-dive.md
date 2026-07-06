# 02 — Component Deep Dive

> This document provides a detailed breakdown of every component in the DevOps Training Lab. For each component, you'll learn **what it is**, **why it's here**, **how it's deployed**, and **key configuration considerations**.

---

## Table of Contents

1. [K3s — Kubernetes Cluster](#21-k3s--kubernetes-cluster)
2. [Angular Frontend](#22-angular-frontend)
3. [Java Spring Boot — Customer Service](#23-java-spring-boot--customer-service)
4. [.NET ASP.NET Core — Lab Service](#24-net-aspnet-core--lab-service)
5. [Apache Kafka (KRaft Mode)](#25-apache-kafka-kraft-mode)
6. [Redis](#26-redis)
7. [PostgreSQL](#27-postgresql)
8. [MongoDB](#28-mongodb)
9. [Jenkins](#29-jenkins)
10. [Terraform](#210-terraform)
11. [Ansible](#211-ansible)
12. [Harbor — Container Registry](#212-harbor--container-registry)
13. [Nexus — Dependency Cache](#213-nexus--dependency-cache)

---

## 2.1 K3s — Kubernetes Cluster

### What Is It?

**K3s** is a certified, lightweight Kubernetes distribution built by Rancher (now SUSE). It packages the entire Kubernetes control plane into a single binary under 100MB. It is fully conformant with upstream Kubernetes — anything that works on K8s works on K3s.

### Component Diagram (PlantUML)

```plantuml
@startuml k3s_detail
!theme cerulean-outline

title K3s Cluster — Internal Architecture

frame "K3s Cluster (Single Node)" as k3s {
    
    component [K3s Server\n(API Server + Scheduler\n+ Controller Manager\n+ etcd)] as server
    
    component [Kubelet] as kubelet
    component [Containerd] as cri
    component [Traefik Ingress\n(Built-in)] as ingress
    component [CoreDNS\n(Built-in)] as dns

    frame "Workload Pods" {
        node "angular-frontend\nDeployment" as fe {
            component [Nginx + Angular SPA\nPort 80] as fe_c
        }
        node "customer-service\nDeployment" as cs {
            component [Spring Boot\nPort 8080] as cs_c
        }
        node "lab-service\nDeployment" as ls {
            component [ASP.NET Core\nPort 5000] as ls_c
        }
    }

    frame "HPA (Horizontal Pod Autoscaler)" as hpa {
        component [Metrics Server] as metrics
    }

    server --> kubelet
    kubelet --> cri : Manages containers
    ingress --> fe_c : Route: /
    ingress --> cs_c : Route: /api/customers
    ingress --> ls_c : Route: /api/labs
    metrics --> kubelet : Scrapes CPU/Memory
}

@enduml
```

### Why K3s Over Full Kubernetes?

| Feature | Full K8s (kubeadm) | K3s |
|---------|-------------------|-----|
| RAM usage (idle) | ~2-4 GB | ~512 MB |
| Binary size | Hundreds of MBs | ~70 MB |
| etcd | External cluster required | Embedded SQLite/etcd |
| Install time | 30+ minutes | < 30 seconds |
| K8s conformance | ✅ | ✅ |
| Ingress controller | Separate install | Traefik built-in |

### Key Configuration Points

- **Single-node mode:** Both server and agent run on the same Datacenter host (Lenovo laptop).
- **Traefik Ingress:** Pre-installed. Routes external traffic to pods based on path rules.
- **Containerd:** The container runtime. K3s does NOT use Docker for running pods.
- **`kubeconfig`:** Located at `/etc/rancher/k3s/k3s.yaml`. Copy this to your Developer Desktop VM for remote `kubectl` access.

### Resource Limits

All deployments will have explicit resource limits to prevent any single pod from starving the system:

```yaml
# Example: resource limits in a Deployment manifest
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## 2.2 Angular Frontend

### What Is It?

**Angular** is a TypeScript-based frontend framework by Google for building Single-Page Applications (SPAs). In this lab, the Angular app is compiled into static files and served by an **Nginx** web server inside a Kubernetes pod.

### How It's Deployed

```plantuml
@startuml angular_build
!theme cerulean-outline

title Angular — Build & Deployment Pipeline

rectangle "Developer Workstation" {
    component [Angular Source Code\n(TypeScript, HTML, SCSS)] as src
    component [npm / ng build\n--configuration=production] as build
    component [Static Files\n(dist/)] as dist
}

rectangle "Docker Build (Multi-stage)" {
    component [Stage 1: Node.js\nInstall deps & build] as stage1
    component [Stage 2: Nginx\nCopy dist/ to /usr/share/nginx/html] as stage2
}

rectangle "K3s Cluster" {
    component [Pod: angular-frontend\nNginx serving static files\nPort 80] as pod
}

src --> build
build --> dist
dist --> stage1
stage1 --> stage2
stage2 --> pod : Docker push → K3s pull

@enduml
```

### Key Concepts for Trainees

- **Multi-stage Docker build:** The Docker image is built in two stages. Stage 1 uses Node.js to compile TypeScript → JavaScript. Stage 2 copies only the compiled output into a tiny Nginx image. This keeps the final image small (~30MB).
- **Nginx config:** A custom `nginx.conf` handles SPA routing (all paths return `index.html`), API proxying, and gzip compression.
- **Environment config:** API base URLs are injected at build time or via `environment.ts`.

### Resource Budget

| Setting | Value |
|---------|-------|
| Memory Request | 64Mi |
| Memory Limit | 256Mi |
| CPU Request | 50m |
| CPU Limit | 250m |
| Min Replicas (HPA) | 1 |
| Max Replicas (HPA) | 2 |

---

## 2.3 Java Spring Boot — Customer Service

### What Is It?

**Spring Boot** is a Java-based framework for building production-ready microservices. The Customer Service owns the `customers` business domain — managing customer records, profiles, and related workflows.

### Responsibilities

- CRUD operations for customer entities
- Reads/writes to **PostgreSQL**
- Caches hot data in **Redis**
- Publishes `customer-events` to **Kafka** (e.g., `CustomerCreated`, `CustomerUpdated`)
- Consumes `lab-events` from Kafka for cross-domain sync

### Architecture (PlantUML)

```plantuml
@startuml java_service
!theme cerulean-outline

title Customer Service (Spring Boot) — Internal Architecture

component [REST Controller\n/api/customers/**] as rest
component [Service Layer] as svc
component [Repository Layer\n(Spring Data JPA)] as repo
component [Kafka Producer] as kprod
component [Kafka Consumer\n(lab-events)] as kcons
component [Redis Template] as rcache

database "PostgreSQL" as pg
queue "Kafka: customer-events" as ktopic_out
queue "Kafka: lab-events" as ktopic_in
database "Redis" as redis

rest --> svc
svc --> repo
svc --> rcache
svc --> kprod

repo --> pg : JDBC (HikariCP)
kprod --> ktopic_out : Produce
ktopic_in --> kcons : Consume
kcons --> svc
rcache --> redis : Lettuce client

@enduml
```

### Key Configuration Points

- **JVM Memory:** Explicitly set `-Xmx384m` in the Dockerfile's `ENTRYPOINT` to prevent the JVM from consuming all available container memory.
- **HikariCP:** Connection pool for PostgreSQL. Set `maximumPoolSize=5` for the constrained environment.
- **Spring Kafka:** Use `spring.kafka.bootstrap-servers` pointing to the Kafka Docker container's host IP and port.
- **Spring Data Redis:** Use `spring.redis.host` pointing to the Redis container.

### Resource Budget

| Setting | Value |
|---------|-------|
| Memory Request | 256Mi |
| Memory Limit | 512Mi |
| CPU Request | 100m |
| CPU Limit | 500m |
| Min Replicas (HPA) | 1 |
| Max Replicas (HPA) | 2 |

---

## 2.4 .NET ASP.NET Core — Lab Service

### What Is It?

**ASP.NET Core** is a cross-platform, high-performance .NET framework for building web APIs. The Lab Service owns the `labs` business domain — managing lab records, test results, and related data.

### Responsibilities

- CRUD operations for lab entities
- Reads/writes to **MongoDB**
- Caches hot data in **Redis**
- Publishes `lab-events` to **Kafka**
- Consumes `customer-events` from Kafka for cross-domain sync

### Architecture (PlantUML)

```plantuml
@startuml dotnet_service
!theme cerulean-outline

title Lab Service (.NET) — Internal Architecture

component [API Controller\n/api/labs/**] as api
component [Service Layer] as svc
component [Repository Layer\n(MongoDB.Driver)] as repo
component [Kafka Producer\n(Confluent.Kafka)] as kprod
component [Kafka Consumer\n(customer-events)] as kcons
component [Redis Cache\n(StackExchange.Redis)] as rcache

database "MongoDB" as mongo
queue "Kafka: lab-events" as ktopic_out
queue "Kafka: customer-events" as ktopic_in
database "Redis" as redis

api --> svc
svc --> repo
svc --> rcache
svc --> kprod

repo --> mongo : MongoDB Driver
kprod --> ktopic_out : Produce
ktopic_in --> kcons : Consume
kcons --> svc
rcache --> redis

@enduml
```

### Key Configuration Points

- **.NET Memory:** Set `DOTNET_GCHeapHardLimit` environment variable in the Dockerfile to cap managed heap.
- **MongoDB.Driver:** Configure connection string pointing to the Mongo container.
- **Confluent.Kafka NuGet:** The standard .NET Kafka client library.
- **StackExchange.Redis:** The most popular .NET Redis client.

### Resource Budget

| Setting | Value |
|---------|-------|
| Memory Request | 128Mi |
| Memory Limit | 512Mi |
| CPU Request | 100m |
| CPU Limit | 500m |
| Min Replicas (HPA) | 1 |
| Max Replicas (HPA) | 2 |

---

## 2.5 Apache Kafka (KRaft Mode)

### What Is It?

**Apache Kafka** is a distributed event-streaming platform capable of handling millions of events per second. It allows services to communicate asynchronously by publishing and subscribing to **topics**.

### Why KRaft Mode?

Traditionally, Kafka required **Apache ZooKeeper** for cluster coordination (leader election, metadata). **KRaft mode** (Kafka Raft) eliminates this dependency entirely — Kafka manages its own metadata consensus. This saves significant RAM and reduces operational complexity.

### Deployment (PlantUML)

```plantuml
@startuml kafka_kraft
!theme cerulean-outline

title Kafka (KRaft Mode) — Deployment

node "Datacenter (Lenovo)" as dc {
    
    rectangle "Docker Container: Kafka" as kafka_container {
        component [Kafka Broker\n+ KRaft Controller\n(Combined Mode)] as broker
        component [Topic: customer-events\nPartitions: 1, RF: 1] as t1
        component [Topic: lab-events\nPartitions: 1, RF: 1] as t2
        
        broker --> t1
        broker --> t2
    }

    note right of kafka_container
        Image: apache/kafka:latest
        Port: 9092 (PLAINTEXT)
        Port: 9093 (CONTROLLER)
        Volume: kafka-data:/var/lib/kafka/data
        Memory Limit: 1GB
    end note
}

component [Customer Service\n(Producer + Consumer)] as cs
component [Lab Service\n(Producer + Consumer)] as ls

cs --> t1 : Produce customer-events
t2 --> cs : Consume lab-events
ls --> t2 : Produce lab-events
t1 --> ls : Consume customer-events

@enduml
```

### Key Configuration Points

- **Single broker, combined mode:** In KRaft mode, the broker and controller run in the same process. Perfect for a dev/lab environment.
- **Partitions = 1:** Single partition per topic is sufficient for this lab. In production, you'd use multiple partitions for parallelism.
- **Replication factor = 1:** We have only one broker. In production, RF ≥ 3.
- **Memory:** Kafka's JVM heap is set to 512MB. Combined with OS page cache, the container is capped at 1GB.
- **Data persistence:** A Docker volume (`kafka-data`) ensures topic data survives container restarts.

---

## 2.6 Redis

### What Is It?

**Redis** is an in-memory data structure store used as a cache, session store, and message broker. It is **extremely fast** — capable of hundreds of thousands of operations per second with sub-millisecond latency.

### Role in This Architecture

- **Shared cache** between the Java and .NET services. Both services can cache frequently read data to reduce database load.
- **Session store** for user session data (optional exercise).
- **Not used as a message broker** in this lab — Kafka handles async messaging.

### Key Configuration Points

| Setting | Value |
|---------|-------|
| Docker Image | `redis:7-alpine` |
| Port | 6379 |
| Max Memory | 256MB |
| Eviction Policy | `allkeys-lru` (Least Recently Used) |
| Persistence | RDB snapshots (for lab purposes) |

---

## 2.7 PostgreSQL

### What Is It?

**PostgreSQL** (often called "Postgres") is the world's most advanced open-source relational database. It supports complex queries, ACID transactions, JSON data, and full-text search.

### Role in This Architecture

- **Exclusive data store for the Customer Service (Java Spring Boot).**
- Stores structured customer data: profiles, addresses, contact information, etc.
- Schema managed via **Flyway** or **Liquibase** migrations (run by Spring Boot on startup).

### Key Configuration Points

| Setting | Value |
|---------|-------|
| Docker Image | `postgres:16-alpine` |
| Port | 5432 |
| Shared Buffers | 128MB |
| Max Connections | 20 |
| Data Volume | `pgdata:/var/lib/postgresql/data` |
| Default Database | `customerdb` |

---

## 2.8 MongoDB

### What Is It?

**MongoDB** is a document-oriented NoSQL database that stores data in flexible, JSON-like documents (BSON). It is ideal for data with varying structure or rapidly evolving schemas.

### Role in This Architecture

- **Exclusive data store for the Lab Service (.NET ASP.NET Core).**
- Stores semi-structured lab data: test results, reports, configurations, etc.
- The flexible schema allows lab records to have different fields without requiring migrations.

### Key Configuration Points

| Setting | Value |
|---------|-------|
| Docker Image | `mongo:7` |
| Port | 27017 |
| WiredTiger Cache Size | 256MB |
| Data Volume | `mongodata:/data/db` |
| Default Database | `labdb` |

---

## 2.9 Jenkins

### What Is It?

**Jenkins** is the most widely deployed open-source CI/CD automation server. It executes **pipelines** defined in `Jenkinsfile`s that build, test, and deploy applications automatically.

### Role in This Architecture

- Runs on the **Developer Desktop VM (Ubuntu)**.
- Watches Git repositories for changes.
- Builds Docker images for all three applications (using dependencies cached in Nexus).
- Pushes images to the **Harbor Container Registry**.
- Deploys updated manifests to the K3s cluster on the Datacenter via remote `kubectl`.

### Pipeline Overview (PlantUML)

```plantuml
@startuml jenkins_pipeline
!theme cerulean-outline

title Jenkins CI/CD Pipeline — Per Application

|Developer|
start
:Push code to\nGit repository;

|Jenkins (Dev Desktop)|
:Detect change\n(Webhook / Poll SCM);
:Checkout source code;
:Run unit tests\n(via Nexus Cache);
:Build Docker image\n(docker build);
:Push image to\nHarbor Registry;
:Apply K8s manifests\n(kubectl apply -f);

|K3s (Datacenter)|
:Pull new image\nfrom Harbor;
:Rolling update\nof Deployment pods;
stop

@enduml
```

---

## 2.10 Terraform

### What Is It?

**Terraform** is HashiCorp's Infrastructure-as-Code (IaC) tool. You write declarative configuration files (HCL) that describe the desired state of your infrastructure, and Terraform makes it so.

### Role in This Architecture

- Runs on the **Developer Desktop VM**.
- Provisions Docker containers on the remote Datacenter (using the Docker provider over SSH/TCP).
- Manages the lifecycle of Kafka, Redis, PostgreSQL, and MongoDB containers.
- Manages Docker volumes and networks.

### What Terraform Manages

```plantuml
@startuml terraform_scope
!theme cerulean-outline

title Terraform Managed Resources

rectangle "Terraform State" as tf {
    component [Docker Network:\ndevops-lab-net] as net
    component [Docker Container:\nkafka] as kafka
    component [Docker Container:\nredis] as redis
    component [Docker Container:\npostgresql] as pg
    component [Docker Container:\nmongodb] as mongo
    component [Docker Volume:\nkafka-data] as v1
    component [Docker Volume:\npgdata] as v2
    component [Docker Volume:\nmongodata] as v3
    component [Docker Volume:\nredis-data] as v4
}

kafka --> net
redis --> net
pg --> net
mongo --> net

kafka --> v1
pg --> v2
mongo --> v3
redis --> v4

@enduml
```

---

## 2.11 Ansible

### What Is It?

**Ansible** is an agentless IT automation tool. It connects to remote hosts via SSH and runs **playbooks** (YAML files) to install software, manage configurations, and orchestrate multi-step processes.

### Role in This Architecture

- Runs on the **Developer Desktop VM**.
- Installs Docker and K3s on the Datacenter.
- Configures system settings (sysctl, firewall, etc.).
- Can be combined with Terraform or used independently for configuration management.

### Ansible vs. Terraform — When to Use Each

| Task | Use Terraform | Use Ansible |
|------|:---:|:---:|
| Provision a Docker container | ✅ | ❌ |
| Install Docker on Ubuntu | ❌ | ✅ |
| Install K3s | ❌ | ✅ |
| Configure sysctl / firewall | ❌ | ✅ |
| Manage container volumes/networks | ✅ | ❌ |
| Deploy K8s manifests | ❌ | ✅ (or kubectl) |
| Template configuration files | ❌ | ✅ |

> **Rule of Thumb:** Use **Terraform** for _provisioning_ (creating/destroying resources). Use **Ansible** for _configuration_ (installing software, editing files, managing state).

---

## 2.12 Harbor — Container Registry

### What Is It?

**Harbor** is an open-source, trusted cloud-native container registry that stores, signs, and scans content. It provides enterprise-level security, identity, and management features.

### Role in This Architecture

- Runs on a dedicated **Debian 12 Minimal VM** hosted in UTM on the MacBook.
- Acts as the central, private storage for all Docker images built by Jenkins.
- The K3s cluster on the Datacenter pulls application images exclusively from this registry.
- Ensures all application code and built artifacts remain completely internal and confidential.

---

## 2.13 Nexus — Dependency Cache

### What Is It?

**Sonatype Nexus Repository Manager (OSS)** is a repository manager that caches dependencies from public repositories (Maven Central, npmjs, NuGet Gallery) locally.

### Role in This Architecture

- Runs on a dedicated **Debian 12 Minimal VM** hosted in UTM on the MacBook.
- Serves as a transparent caching proxy for the Developer Desktop VM during Jenkins builds.
- Drastically speeds up build times by serving cached Java `.jar`s, Node `.tgz` modules, and .NET `.nupkg`s over the local network instead of the internet.
- Provides resilience in case upstream package registries experience downtime.

---

> **Next →** [Network & Communication](./network-and-communication.md)
