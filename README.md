# DevOps Training Lab

> A hands-on, enterprise-grade microservices infrastructure lab for training DevOps engineers.

**Gitea Organization:** [http://192.168.8.80:3000/nisalatp](http://192.168.8.80:3000/nisalatp)

---

## 🖥️ Lab Environment — 4 Machines

```
MacBook M5 Pro (UTM Host)                         Lenovo Laptop (Standalone)
┌────────────────────────────────────────────┐     ┌──────────────────────────┐
│  VM 1: Developer Desktop (Ubuntu)          │     │  Datacenter (Ubuntu)     │
│  VM 2: Container Registry (Ubuntu Server)  │────▶│  K3s + Kafka + Redis     │
│  VM 3: Dependency Cache (Ubuntu Server)    │     │  PostgreSQL + MongoDB    │
└────────────────────────────────────────────┘     └──────────────────────────┘
```

| Machine | Role | Hosted On |
|---------|------|-----------|
| **Developer Desktop** | Git, Jenkins, Ansible, Terraform, kubectl | MacBook (UTM VM) |
| **Container Registry** | Docker Registry (`registry:2`) — private Docker image storage | MacBook (UTM VM) |
| **Dependency Cache** | Nexus — Maven, npm, NuGet proxy/cache | MacBook (UTM VM) |
| **Datacenter** | Multipass Hypervisor (k8s-master, k8s-worker, db-node-1, db-node-2) | Lenovo Laptop |

---

## 📁 Repository Structure

```
.
├── docs/           Architecture & design documentation
├── src/            Application source code (Angular, Java, .NET)
└── infra/          Infrastructure setup — sequential, numbered labs
```

## 🚀 Lab Steps (Follow In Order)

| Step | Folder | What You'll Do |
|------|--------|---------------|
| 0 | `infra/00-developer-workstation/` | Set up Developer Desktop VM (tools, SSH) |
| 1 | `infra/01-datacenter-prerequisites/` | Prepare the Datacenter (Docker, system config) |
| 2 | `infra/02-container-registry/` | Deploy official Docker registry (VM 2) |
| 3 | `infra/03-dependency-cache/` | Deploy Nexus dependency cache (VM 3) |
| 4 | `infra/04-kubernetes/` | Install K3s on Datacenter |
| 5 | `infra/05-kafka/` | Deploy Apache Kafka (KRaft mode) |
| 6 | `infra/06-redis/` | Deploy Redis cache |
| 7 | `infra/07-postgresql/` | Deploy PostgreSQL database |
| 8 | `infra/08-mongodb/` | Deploy MongoDB database |
| 9 | `infra/09-deploy-applications/` | Build images, push to registry, deploy to K3s |
| 10 | `infra/10-cicd-pipeline/` | Set up Jenkins CI/CD automation |

> Start with [docs/](./docs/) to understand the architecture, then follow the numbered `infra/` folders.

## 📖 Documentation

- [Architecture Overview](./docs/architecture-overview.md)
- [Component Deep Dive](./docs/component-deep-dive.md)
- [Network & Communication](./docs/network-and-communication.md)
- [Resource Planning](./docs/resource-planning.md)

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular + Nginx |
| Backend (Customer) | Java 21 + Spring Boot 3 |
| Backend (Lab) | .NET 8 + ASP.NET Core |
| Orchestration | K3s (Kubernetes) |
| Messaging | Apache Kafka (KRaft) |
| Caching | Redis |
| Object Storage | MinIO |
| Relational DB | PostgreSQL |
| Document DB | MongoDB |
| Container Registry | Docker Registry (`registry:2`) |
| Dependency Cache | Nexus Repository Manager |
| CI/CD | Jenkins |
| IaC | Terraform + Ansible |
