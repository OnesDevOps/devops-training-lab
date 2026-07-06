# 01 — Architecture Overview

> This document describes the high-level architecture of the DevOps Training Lab. It explains what each component is, why it exists, and how they all connect together.

---

## 1.1 The Big Picture

The lab simulates an enterprise microservices environment across **four machines**: three Ubuntu VMs on a MacBook (developer tools, container registry, dependency cache) and one physical Ubuntu server as the remote datacenter.

### System Context Diagram (PlantUML)

```plantuml
@startuml system_context
!theme cerulean-outline

title System Context Diagram — DevOps Training Lab

actor "DevOps Engineer" as dev

node "MacBook M5 Pro (UTM Host)" as mac {

    node "VM 1: Developer Desktop\n(Ubuntu)" as vm1 {
        component [IDE / Code Editor] as ide
        component [Git] as git
        component [Jenkins CI/CD] as jenkins
        component [Terraform + Ansible] as iac
        component [kubectl] as kctl
    }

    node "VM 2: Container Registry\n(Ubuntu Server)" as vm2 {
        component [Harbor\nPrivate Docker Registry] as harbor
    }

    node "VM 3: Dependency Cache\n(Ubuntu Server)" as vm3 {
        component [Nexus Repository Mgr\nMaven / npm / NuGet] as nexus
    }
}

node "Lenovo Laptop — Datacenter\n(Ubuntu, i7, 16GB RAM)" as dc {
    component [K3s Cluster] as k3s
    component [Native Services\n(Kafka, Redis, PG, Mongo)] as native
}

dev --> ide : Writes code
ide --> git : Commits
git --> jenkins : Triggers build
jenkins --> harbor : Push images
jenkins --> k3s : Deploy apps
iac --> dc : Provision & configure
k3s --> harbor : Pull images
jenkins --> nexus : Fetch dependencies

@enduml
```

---

## 1.2 Four-Machine Topology

### Machine Overview

| # | Machine | Type | OS | RAM | Role |
|---|---------|------|----|-----|------|
| 1 | Developer Desktop | UTM VM | Ubuntu Desktop | 4 GB | Code, CI/CD, IaC, kubectl |
| 2 | Container Registry | UTM VM | Debian 12 Minimal | 1 GB | Harbor — private Docker images |
| 3 | Dependency Cache | UTM VM | Debian 12 Minimal | 1.5 GB | Nexus — Maven, npm, NuGet cache |
| 4 | Datacenter | Physical (Lenovo) | Ubuntu Desktop | 16 GB | K3s, Kafka, Redis, PG, Mongo |

### Developer Desktop (VM 1)

All **human-driven** and **control-plane** activity happens here:

| Tool | Role |
|------|------|
| **Git** | Source control — pushes trigger CI/CD |
| **Jenkins** | CI/CD orchestrator — builds, tests, deploys |
| **Terraform** | Declares infrastructure on the Datacenter |
| **Ansible** | Installs software, configures remote hosts |
| **kubectl** | Manages K3s cluster remotely |

### Container Registry (VM 2)

| Component | Role |
|-----------|------|
| **Harbor** | Enterprise Docker registry with auth, RBAC, and vulnerability scanning |

> **Why Harbor?** Builds are confidential. Harbor provides authentication, role-based access control, audit logging, and optional image vulnerability scanning — all critical for enterprise security.

### Dependency Cache (VM 3)

| Component | Role |
|-----------|------|
| **Nexus Repository Manager** | Proxies and caches Maven Central, npmjs.org, and NuGet.org |

> **Why separate from the registry?** In enterprise environments, artifact caches and container registries often run on different infrastructure for isolation and scaling. Separating them also teaches students about dependency management as a distinct concern.

### Datacenter (Lenovo Laptop)

This is the **production-like deployment target** — it runs only workloads:

| Component | Role |
|-----------|------|
| **K3s** | Lightweight Kubernetes — runs all apps in pods |
| **Kafka** | Async messaging between backends (Docker, outside K3s) |
| **Redis** | Shared cache (Docker, outside K3s) |
| **PostgreSQL** | Relational DB for Customer Service (Docker, outside K3s) |
| **MongoDB** | Document DB for Lab Service (Docker, outside K3s) |

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
    component [Harbor\nPort 443 (HTTPS)\nPort 80 (HTTP)] as harbor
}

node "VM 3: Dependency Cache" as vm3 #LightCyan {
    component [Nexus\nPort 8081 (UI)\nMaven / npm / NuGet] as nexus
}

cloud "Network (LAN)" as net

node "Datacenter (Lenovo)" as dc #LightGreen {

    frame "K3s Cluster (Kubernetes)" as k3s {
        node "Pod: Angular Frontend\n(Nginx, min 1 / max 2)" as fe #PaleGoldenRod
        node "Pod: Java Spring Boot\nCustomer Backend\n(min 1 / max 2)" as java #LightCoral
        node "Pod: .NET ASP.NET Core\nLab Backend\n(min 1 / max 2)" as dotnet #LightSteelBlue
    }

    frame "Native Services (Docker, outside K3s)" as native {
        database "Kafka\n(KRaft Mode)" as kafka #Tomato
        database "Redis" as redis #Orange
        database "PostgreSQL" as pg #RoyalBlue
        database "MongoDB" as mongo #ForestGreen
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

jenkins ..> harbor : Push images
jenkins ..> nexus : Fetch deps during build
jenkins ..> k3s : kubectl apply
iac ..> dc : Provision & Configure
k3s ..> harbor : Pull images

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
| **Harbor** | Enterprise container registry | RBAC, vulnerability scanning |
| **Nexus** | Universal dependency cache | Proxy repos, artifact management |
| **Jenkins** | Most deployed CI/CD server | Jenkinsfile, pipelines |
| **Terraform** | Declarative infrastructure as code | HCL, state management |
| **Ansible** | Agentless configuration management | Playbooks, idempotency |

---

> **Next →** [Component Deep Dive](./component-deep-dive.md)
