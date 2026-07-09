# 01 — Architecture Overview

> This document describes the high-level architecture of the DevOps Training Lab. It explains what each component is, why it exists, and how they all connect together.

---

## 1.1 The Big Picture

The lab simulates an enterprise microservices environment across **four machines**: three Ubuntu VMs on a MacBook (developer tools, container registry, and source control) and one physical Ubuntu server as the remote datacenter.

### System Context Diagram (PlantUML)

```plantuml
@startuml system_context
!theme cerulean-outline

title System Context Diagram — DevOps Training Lab

actor "DevOps Engineer" as dev

node "MacBook M5 Pro (UTM Host)" as mac {

    node "VM 1: Developer Desktop\n(Ubuntu)" as vm1 {
        component [IDE / Code Editor] as ide
        component [Jenkins CI/CD] as jenkins
        component [Terraform + Ansible] as iac
        component [kubectl] as kctl
    }

    node "VM 2: Container Registry\n(Ubuntu Server)" as vm2 {
        component [Docker Registry\nPrivate Docker Registry] as registry
    }

    node "VM 8: Source Control\n(Ubuntu Server)" as vm8 {
        component [Gitea\nGit Server] as gitea
    }
}

node "Lenovo Laptop — Datacenter\n(Multipass Hypervisor)" as dc {
    component [k8s-master VM\n(K3s Control Plane)] as k3smaster {
        component [Argo CD] as argocd
    }
    component [k8s-worker-1 VM\n(App Workloads)] as k3sworker
    component [k8s-worker-2 VM\n(Mac Workloads)] as k3sworker2
    component [db-node VMs\n(Kafka, Mongo, PG, Redis, MinIO)] as native
}

dev --> ide : Writes code
ide --> gitea : Commits Code & Manifests
gitea --> jenkins : Webhook Triggers CI
jenkins --> registry : Build & Push image
jenkins --> gitea : Update K8s Manifest Image Tag
argocd --> gitea : Watch for Manifest Changes
argocd --> k3sworker : Deploy Pods
argocd --> k3sworker2 : Deploy Pods
iac --> dc : Provision & configure
k3sworker --> registry : Pull images
@enduml
```

---

## 1.2 Four-Machine Topology

### Machine Overview

| # | Machine | Type | OS | RAM | Role |
|---|---------|------|----|-----|------|
| 1 | Developer Desktop | UTM VM | Ubuntu Desktop | 4 GB | Code, CI/CD, IaC, kubectl |
| 2 | Container Registry | UTM VM | Debian 12 Minimal | 1 GB | Docker Registry — private Docker images |
| 4 | Datacenter | Physical (Lenovo) | Multipass Hypervisor | 16 GB | Hosts 4 VMs (k8s-master, k8s-worker-1, 2x db-nodes) |
| 9 | Mac Worker | UTM/OrbStack VM | Ubuntu Server | 2 GB | `k8s-worker-2` — Expands Kubernetes cluster capacity |
| 8 | Source Control | UTM VM | Ubuntu Server | 1 GB | Gitea — Self-hosted Git repositories |

### Developer Desktop (VM 1)

All **human-driven** and **control-plane** activity happens here:

| Tool | Role |
|------|------|
| **Git CLI** | Local source control |
| **Jenkins** | CI/CD orchestrator — builds, tests, deploys |
| **Terraform** | Declares infrastructure on the Datacenter |
| **Ansible** | Installs software, configures remote hosts |
| **kubectl** | Manages K3s cluster remotely |

### Container Registry (VM 2)

| Component | Role |
|-----------|------|
| **Docker Registry** | Enterprise Docker registry with auth, RBAC, and vulnerability scanning |

> **Why Docker Registry?** Builds are confidential. Docker Registry provides authentication, role-based access control, audit logging, and optional image vulnerability scanning — all critical for enterprise security.

### Source Control (VM 8)

| Component | Role |
|-----------|------|
| **Gitea** | Lightweight, self-hosted Git service providing GitOps configuration hosting. |

> **Why the split between GitHub and Gitea?** To simulate a hybrid environment and adhere to GitOps best practices, we have separated concerns. The **Source Code** is hosted publicly on GitHub to allow easy cloning and remote IDE access. However, the **GitOps Manifests** (Kubernetes deployments) are hosted completely on-premises on our local Gitea instance. This ensures that our private cloud infrastructure state remains completely local, and Argo CD can sync from a local network repository without needing outbound internet access.

### Datacenter (Lenovo Laptop)

This is the **production-like deployment target** — it runs only workloads:

| Component | Role |
|-----------|------|
| **Multipass** | Native Ubuntu hypervisor that provisions lightweight VMs |
| **k8s-master VM** | Runs the K3s Kubernetes Control Plane |
| **k8s-worker-1 VM** | Runs the application microservices with HPA |
| **k8s-worker-2 VM** | Secondary worker node hosted on Mac to scale capacity |
| **db-node VMs** | Runs Kafka, Redis, PostgreSQL, MongoDB, and MinIO |

---

## 1.3 Full Infrastructure Diagram

```plantuml
@startuml infrastructure_deployment
!theme cerulean-outline

title Infrastructure Deployment Diagram

node "VM 1: Developer Desktop" as vm1 #LightBlue {
    component [Git Repos] as git
    component [Jenkins CI/CD] as jenkins
    component [Terraform\n+ Ansible] as iac
    component [kubectl] as kctl

    git -down-> jenkins : Webhook / Poll
}

node "VM 2: Container Registry" as vm2 #LightYellow {
    component [Docker Registry\nPort 80 (HTTP)] as registry
}

cloud "Network (LAN)" as net

node "Datacenter (Lenovo Multipass Hypervisor)" as dc #LightGreen {

    node "VM: k8s-master" {
        component [K3s Control Plane]
    }
    
    node "VM: k8s-worker-1" {
        [Microservice Pods]
    }
    node "VM: k8s-worker-2 (Mac)" {
        [Microservice Pods]
    }
    
    frame "K3s Cluster (Kubernetes)" as k3s {
        node "Pod: Angular Frontend\n(Nginx, min 1 / max 2)" as fe #PaleGoldenRod
        node "Pod: Java Spring Boot\nCustomer Backend\n(min 1 / max 2)" as java #LightCoral
        node "Pod: .NET ASP.NET Core\nLab Backend\n(min 1 / max 2)" as dotnet #LightSteelBlue
    }

    node "VMs: db-node-1 / db-node-2" {
        frame "Stateful Clusters" as native {
            database "Kafka\n(KRaft Mode)" as kafka #Tomato
            database "Redis" as redis #Orange
            database "PostgreSQL" as pg #RoyalBlue
            database "MongoDB" as mongo #MediumPurple
            database "MinIO\n(Object Storage)" as minio #YellowGreen
        }
    }


    fe -down-> java : REST API
    fe -down-> dotnet : REST API

    java <-right-> kafka : Produce / Consume
    dotnet <-left-> kafka : Produce / Consume

    java <-right-> redis : Cache R/W
    dotnet <-left-> redis : Cache R/W

    java -down-> pg : JDBC
    dotnet -down-> mongo : MongoDB Driver
}

jenkins ..> registry : Push images
jenkins ..> k3s : kubectl apply
iac ..> dc : Provision & Configure
k3s ..> registry : Pull images

@enduml
```

---

## 1.4 Application Architecture

The lab simulates two business domains served by two independent backend microservices:

```plantuml
@startuml application_flow
!theme cerulean-outline

title Application Architecture — Data Flow

actor "End User\n(Browser)" as user

rectangle "K3s Cluster" {
    component [Angular SPA\n(Served by Nginx)] as angular
    component [Java Spring Boot\n"Customer Service"] as customer_svc
    component [.NET ASP.NET Core\n"Lab Service"] as lab_svc
}

rectangle "Native Data Layer" {
    queue "Kafka Topic:\ncustomer-events" as topic1
    queue "Kafka Topic:\nlab-events" as topic2
    database "Redis" as redis
    database "PostgreSQL\n(Customer DB)" as pg
    database "MongoDB\n(Lab DB)" as mongo
}

user -> angular : HTTPS
angular -> customer_svc : REST API\n/api/customers/**
angular -> lab_svc : REST API\n/api/labs/**

customer_svc -> pg : Read/Write
customer_svc -> redis : Cache
customer_svc -> topic1 : Produce

lab_svc -> mongo : Read/Write
lab_svc -> redis : Cache
lab_svc -> topic2 : Produce

topic1 -> lab_svc : Consume (cross-domain)
topic2 -> customer_svc : Consume (cross-domain)

@enduml
```

### How It Works

1. **End User** opens the Angular app in their browser.
2. **Angular Frontend** is served by Nginx inside K3s. It calls backends via REST through the Ingress.
3. **Customer Service (Java Spring Boot):** Owns customers. Uses PostgreSQL, Redis, publishes to Kafka.
4. **Lab Service (.NET ASP.NET Core):** Owns labs. Uses MongoDB, Redis, publishes to Kafka.
5. **Cross-Domain Sync:** Each service consumes the other's Kafka events for eventual consistency.

---

## 1.5 Why These Technology Choices?

| Technology | Why We Chose It | What You'll Learn |
|------------|-----------------|-------------------|
| **K3s** | Lightweight Kubernetes for constrained environments | kubectl, manifests, HPA |
| **Angular** | Enterprise frontend framework | Multi-stage Docker builds, Nginx |
| **Java Spring Boot** | Industry-standard enterprise backend | JVM tuning in containers, JDBC |
| **ASP.NET Core** | Cross-platform .NET for polyglot microservices | .NET CLI, multi-arch images |
| **Kafka (KRaft)** | Event streaming without ZooKeeper | Topics, producers, consumers |
| **Redis** | Sub-millisecond caching | Cache-aside pattern, TTL |
| **PostgreSQL** | Advanced relational database | SQL, migrations |
| **MongoDB** | Flexible document database | Document modeling |
| **Docker Registry** | Enterprise container registry | RBAC, vulnerability scanning |
| **Jenkins** | Most deployed CI/CD server | Jenkinsfile, pipelines |
| **Terraform** | Declarative infrastructure as code | HCL, state management |
| **Ansible** | Agentless configuration management | Playbooks, idempotency |

---

> **Next →** [Component Deep Dive](./component-deep-dive.md)
