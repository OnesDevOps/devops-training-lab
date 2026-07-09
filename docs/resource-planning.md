# Resource Planning

> Memory, CPU, and disk budgets for all machines and VMs in the DevOps Training Lab.

---

## Machine Resource Summary

| Machine | OS | RAM | CPU | Disk | Hosted On |
|---------|-----|-----|-----|------|-----------|
| VM 1: Developer Desktop | Ubuntu Desktop | 4 GB | 2 cores | 40 GB | MacBook (UTM) |
| VM 2: Container Registry | Debian 12 Minimal | 1 GB | 1 core | 80 GB | MacBook (UTM) |
| **Datacenter Host** | Ubuntu Desktop | 16 GB | 16 cores| 500+ GB| Lenovo Laptop |
| VM 4: `k8s-master` | Ubuntu Cloud | 1 GB | 1 core | 10 GB | Lenovo (Multipass) |
| VM 5: `k8s-worker-1` | Ubuntu Cloud | 2 GB | 2 cores | 15 GB | Lenovo (Multipass) |
| VM 9: `k8s-worker-2` | Ubuntu Server | 2 GB | 2 cores | 15 GB | Mac Workstation |
| VM 6: `db-node-1` | Ubuntu Cloud | 2 GB | 2 cores | 15 GB | Lenovo (Multipass) |
| VM 7: `db-node-2` | Ubuntu Cloud | 2.5 GB| 2 cores | 15 GB | Lenovo (Multipass) |
| VM 8: Source Control | Ubuntu Server | 1 GB | 1 core | 20 GB | MacBook (UTM) |

---

## Datacenter Memory Budget (16 GB)

> **Note:** The Lenovo laptop acts as a hypervisor host for 4 Virtual Machines using Multipass.

### Hypervisor Allocation

| Component | RAM | CPU | Notes |
|-----------|-----|-----|-------|
| Lenovo Host OS | ~8.5 GB | 9 cores | Ubuntu Desktop overhead & spare capacity |
| `k8s-master` | 1 GB | 1 core | K3s Control Plane |
| `k8s-worker-1` | 2 GB | 2 cores | App Pods (Angular, Java, .NET) |
| `k8s-worker-2` | 2 GB | 2 cores | App Pods (Cross-Cloud) |
| `db-node-1` | 2 GB | 2 cores | Postgres, Mongo, Redis |
| `db-node-2` | 2.5 GB| 2 cores | Kafka, MinIO |
| **TOTAL** | **16 GB** | **16 cores** | Fully utilized |

### K3s Worker Node Capacity (2 GB)

| Component | Min RAM | Max RAM | Notes |
|-----------|---------|---------|-------|
| Ubuntu + K3s Agent | 500 MB | 700 MB | |
| Angular Frontend (×1-2) | 64 MB | 256 MB | Nginx (HPA) |
| Customer Service (×1-2) | 256 MB | 768 MB | Java Spring Boot (HPA) |
| Lab Service (×1-2) | 128 MB | 512 MB | .NET ASP.NET Core (HPA) |
| **TOTAL (Scaled up)** | | **~2.2 GB** | ✅ Plenty of room |

### Database Nodes Capacity (2 GB & 2.5 GB)

| Component | Node | Max RAM | Notes |
|-----------|------|---------|-------|
| PostgreSQL | `db-node-1` | 500 MB | Relational DB |
| MongoDB | `db-node-1` | 1.0 GB | Document DB |
| Redis | `db-node-1` | 300 MB | Shared Cache |
| Kafka (KRaft) | `db-node-2` | 1.5 GB | Message Broker |
| MinIO | `db-node-2` | 1.0 GB | Object Storage |

---

## MacBook VM Resource Budget

| VM | OS | Idle RAM | Active RAM | Key Process |
|----|----|----------|------------|-------------|
| Dev Desktop | Ubuntu Desktop | ~400 MB | ~2-3 GB | Jenkins + builds |
| Container Registry | Debian 12 Minimal | ~30 MB | ~500 MB | Docker Registry |
| Source Control | Ubuntu Server | ~100 MB | ~500 MB | Gitea |
| **Total** | | **~580 MB** | **~4.5-5.5 GB** | |

---

## Monitoring Commands

```bash
# Datacenter — view all VMs
multipass list

# Enter a specific VM
multipass shell k8s-worker-1

# View K3s resources from Dev Workstation
kubectl top nodes
kubectl top pods --all-namespaces
```

---

> **Ready to build?** Start with [`infra/00-developer-workstation/`](../infra/00-developer-workstation/)
