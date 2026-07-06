# Step 1 — Datacenter Prerequisites (Hypervisor)

> Prepare the Lenovo Datacenter by installing the Multipass hypervisor and provisioning our fleet of 4 Virtual Machines.

---

## Overview

In this step you will:
1. Install Multipass on the Lenovo physical host
2. Provision the Kubernetes VMs (`k8s-master`, `k8s-worker-1`)
3. Provision the Database VMs (`db-node-1`, `db-node-2`)

---

## 01 — Install Multipass

Connect to the Lenovo Datacenter and install Multipass via Snap:

```bash
ssh datacenter "sudo snap install multipass"
```

---

## 02 — Provision the VM Fleet

We will carve up the Lenovo's 16 cores and 16GB of RAM into 4 distinct servers. Run these commands on the Datacenter to build your new fleet:

```bash
# 1. The Kubernetes Control Plane (1 CPU, 1GB RAM)
ssh datacenter "multipass launch -n k8s-master -c 1 -m 1G -d 10G"

# 2. The Kubernetes Worker Node for Microservices (2 CPU, 2GB RAM)
ssh datacenter "multipass launch -n k8s-worker-1 -c 2 -m 2G -d 15G"

# 3. Database Cluster Node 1 (2 CPU, 2GB RAM)
ssh datacenter "multipass launch -n db-node-1 -c 2 -m 2G -d 15G"

# 4. Database Cluster Node 2 (2 CPU, 2.5GB RAM)
ssh datacenter "multipass launch -n db-node-2 -c 2 -m 2.5G -d 15G"
```

*(This will take a few minutes as it downloads the latest Ubuntu image and creates the virtual hardware).*

---

## 03 — Verify the Fleet

List the running virtual machines to confirm they are online and note their IP addresses:

```bash
ssh datacenter "multipass list"
```

---

## ✅ Success Criteria

- [ ] Multipass is installed on the Lenovo host
- [ ] `k8s-master` VM is Running
- [ ] `k8s-worker-1` VM is Running
- [ ] `db-node-1` VM is Running
- [ ] `db-node-2` VM is Running

---

> **Next →** [02 — Container Registry](../02-container-registry/)
