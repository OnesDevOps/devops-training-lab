# Resource Planning

> Memory, CPU, and disk budgets for all four machines in the DevOps Training Lab.

---

## Machine Resource Summary

| Machine | OS | RAM | CPU | Disk | Hosted On |
|---------|-----|-----|-----|------|-----------|
| VM 1: Developer Desktop | Ubuntu Desktop | 4 GB | 2 cores | 40 GB | MacBook (UTM) |
| VM 2: Container Registry | Debian 12 Minimal | 1 GB | 1 core | 80 GB | MacBook (UTM) |
| VM 3: Dependency Cache | Debian 12 Minimal | 1.5 GB | 1 core | 60 GB | MacBook (UTM) |
| Datacenter | Ubuntu Desktop | 16 GB | 8 cores | 100+ GB | Lenovo Laptop |
| **MacBook Total (VMs)** | | **6.5 GB** | **4 cores** | **180 GB** | |

> **Why Debian 12 Minimal for VMs 2 & 3?** Alpine idles at ~60 MB RAM vs Ubuntu's ~400 MB. Since these VMs only run Docker containers, a full desktop/server OS is unnecessary. This saves ~700 MB across both VMs.

---

## Datacenter Memory Budget (16 GB)

> **Note:** The Datacenter runs Ubuntu Desktop. The GNOME desktop environment uses ~500-800 MB. You can disable it to reclaim memory: `sudo systemctl set-default multi-user.target && sudo reboot`

### Baseline (Min Replicas)

| Component | Where | Min | Max | Notes |
|-----------|-------|-----|-----|-------|
| Ubuntu Desktop + System | Host | 2.0 GB | 2.5 GB | Kernel, systemd, sshd, GNOME |
| Docker Engine | Host | 200 MB | 200 MB | Daemon overhead |
| K3s Control Plane | Host | 500 MB | 750 MB | API server, Flannel, CoreDNS, Traefik |
| Kafka (KRaft) | Docker | 768 MB | 1024 MB | JVM heap 512MB + buffers |
| Redis | Docker | 100 MB | 300 MB | `maxmemory 256mb` |
| PostgreSQL | Docker | 200 MB | 300 MB | `shared_buffers=128MB` |
| MongoDB | Docker | 300 MB | 400 MB | `wiredTigerCacheSizeGB=0.25` |
| Angular Frontend (×1) | K3s | 64 MB | 256 MB | Nginx |
| Customer Service (×1) | K3s | 256 MB | 512 MB | JVM: `-Xmx384m` |
| Lab Service (×1) | K3s | 128 MB | 512 MB | .NET: `GCHeapHardLimit` |
| **TOTAL** | | **~4.5 GB** | **~6.8 GB** | |
| **FREE** | | **~11.5 GB** | **~9.2 GB** | ✅ Plenty of room |

### Scaled Up (Max 2 Replicas Each)

| Category | Max Total |
|----------|----------|
| OS + Docker + K3s | ~3.5 GB |
| Data Services (Kafka, Redis, PG, Mongo) | ~2.0 GB |
| App Pods (Angular×2, Java×2, .NET×2) | ~2.6 GB |
| **TOTAL** | **~8.1 GB** |
| **FREE** | **~7.9 GB** ✅ |

---

## MacBook VM Resource Budget

| VM | OS | Idle RAM | Active RAM | Key Process |
|----|----|----------|------------|-------------|
| Dev Desktop | Ubuntu Desktop | ~400 MB | ~2-3 GB | Jenkins + builds |
| Container Registry | Debian 12 Minimal | ~60 MB | ~1 GB | Harbor containers |
| Dependency Cache | Debian 12 Minimal | ~60 MB | ~1.2 GB | Nexus (Java-based) |
| **Total** | | **~520 MB** | **~4-5 GB** | |

---

## Monitoring Commands

```bash
# Datacenter — host memory
ssh datacenter "free -h"

# Datacenter — container memory
ssh datacenter "docker stats --no-stream"

# Datacenter — K3s resources
kubectl top nodes
kubectl top pods --all-namespaces

# Check for OOM kills
kubectl get events --field-selector reason=OOMKilling
```

---

> **Ready to build?** Start with [`infra/00-developer-workstation/`](../infra/00-developer-workstation/)
