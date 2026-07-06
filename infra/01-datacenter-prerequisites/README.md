# Step 1 — Datacenter Prerequisites

> Prepare the Ubuntu datacenter server by configuring the system and installing Docker. All tasks are executed remotely from your MacBook using Ansible.

---

## Overview

In this step you will:
1. Configure system settings (timezone, sysctl, firewall)
2. Install Docker Engine
3. Create the shared Docker network for native services
4. Verify everything is ready

---

## 01 — System Setup

### What You'll Configure

| Setting | Purpose |
|---------|---------|
| Timezone | Consistent timestamps across logs |
| Swap | Disable for Kubernetes compatibility |
| Firewall (UFW) | Open required ports |
| sysctl | Kernel parameters for Kafka and containers |

### Run the Playbook

```bash
ansible-playbook -i inventory/hosts.yml infra/01-datacenter-prerequisites/ansible/playbooks/01-system-setup.yml
```

---

## 02 — Install Docker

### Run the Playbook

```bash
ansible-playbook -i inventory/hosts.yml infra/01-datacenter-prerequisites/ansible/playbooks/02-install-docker.yml
```

### Verify Docker Installation

```bash
ssh datacenter "docker --version && docker ps && echo 'Docker OK'"
```

---

## 03 — Create Docker Network

The shared `devops-lab-net` bridge network must exist before deploying any native services:

```bash
ssh datacenter "docker network create devops-lab-net && docker network ls"
```

> This network is used by Kafka, Redis, PostgreSQL, and MongoDB containers to communicate with each other.

---

## ✅ Success Criteria

- [ ] System settings applied (timezone, sysctl, swap disabled)
- [ ] Firewall ports open (22, 80, 443, 5432, 6379, 6443, 9092, 27017)
- [ ] Docker installed and running
- [ ] `devops-lab-net` Docker network created
- [ ] Your user can run `docker` without `sudo`

---

> **Next →** [02 — Container Registry](../02-container-registry/)
