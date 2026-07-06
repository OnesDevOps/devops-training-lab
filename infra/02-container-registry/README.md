# Step 2 — Container Registry (Debian 12 Minimal VM)

> Deploy a private Docker image registry on an Debian 12 Minimal VM. The datacenter's K3s cluster pulls all application images from this registry. Builds are confidential — images never leave your network.

---

## Overview

| Setting | Value |
|---------|-------|
| VM Host | MacBook (UTM) |
| OS | Debian 12 Minimal |
| RAM | 1 GB |
| CPU | 1 core |
| Disk | 80 GB (stores all Docker images) |
| Network | Bridged (must be reachable from Datacenter) |
| Software | Harbor (enterprise Docker registry) |

---

## 01 — Create the Debian VM in UTM

1. Download Debian 12 **netinst** ISO from [debian.org/distrib](https://www.debian.org/distrib/)
2. In UTM: **Create New VM → Virtualize → Linux**
3. Assign: 1 GB RAM, 1 core, 80 GB disk
4. Boot from ISO and follow the installer (minimal install, no desktop environment)

### Post-Install — Install Docker

```bash
# Install prerequisites
sudo apt update && sudo apt install -y ca-certificates curl gnupg

# Add Docker repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

Note the VM's IP:
```bash
ip addr show eth0 | grep "inet "
```
> **Replace `<registry-ip>` with this IP throughout.**

---

## 02 — Deploy Harbor

Harbor is an enterprise container registry with authentication, RBAC, and vulnerability scanning.

### 2.1 Download Harbor Installer

```bash
cd /tmp
curl -sL https://github.com/goharbor/harbor/releases/download/v2.11.0/harbor-offline-installer-v2.11.0.tgz -o harbor.tgz
tar xzf harbor.tgz
cd harbor
```

### 2.2 Configure Harbor

```bash
cp harbor.yml.tmpl harbor.yml
vi harbor.yml
```

Edit these fields:

```yaml
hostname: <registry-ip>

# For lab, use HTTP (disable HTTPS block)
http:
  port: 80

# Comment out the entire https: block
# https:
#   port: 443
#   certificate: ...
#   private_key: ...

harbor_admin_password: ChangeMeNow!

data_volume: /data/harbor
```

### 2.3 Install Harbor

```bash
./install.sh
```

This pulls Harbor's Docker images and starts all containers (~5-8 images: core, portal, db, redis, registry, jobservice, etc.).

### 2.4 Verify

```bash
docker ps   # Should show ~8 Harbor containers
curl -s http://localhost/api/v2.0/health | python3 -m json.tool
```

Open `http://<registry-ip>` in your browser:
- **Username:** `admin`
- **Password:** `ChangeMeNow!` (change it on first login)

---

## 03 — Create a Project for Lab Images

1. Login to Harbor UI → **Projects → New Project**
2. **Name:** `devops-lab`
3. **Access Level:** Private
4. Click **OK**

All lab images will be pushed as: `<registry-ip>/devops-lab/<image>:<tag>`

---

## 04 — Configure Clients to Use This Registry

### On the Developer Desktop (VM 1)

```bash
# Trust the insecure (HTTP) registry
sudo tee /etc/docker/daemon.json << EOF
{
  "insecure-registries": ["<registry-ip>:80", "<registry-ip>"]
}
EOF
sudo systemctl restart docker

# Test login
docker login <registry-ip>
# Username: admin
# Password: <your-harbor-password>
```

### On the Datacenter (Lenovo)

```bash
# Same insecure registry config
sudo tee /etc/docker/daemon.json << EOF
{
  "insecure-registries": ["<registry-ip>:80", "<registry-ip>"]
}
EOF
sudo systemctl restart docker
```

### Configure K3s on the Datacenter

```bash
sudo mkdir -p /etc/rancher/k3s
sudo tee /etc/rancher/k3s/registries.yaml << EOF
mirrors:
  "<registry-ip>":
    endpoint:
      - "http://<registry-ip>"
configs:
  "<registry-ip>":
    auth:
      username: admin
      password: <your-harbor-password>
EOF
sudo systemctl restart k3s
```

---

## 05 — Test Push and Pull

```bash
# On Developer Desktop
docker pull alpine:latest
docker tag alpine:latest <registry-ip>/devops-lab/alpine:test
docker push <registry-ip>/devops-lab/alpine:test

# Verify in Harbor UI → Projects → devops-lab → Repositories
```

---

## ✅ Success Criteria

- [ ] Debian VM running with Docker
- [ ] Harbor accessible at `http://<registry-ip>`
- [ ] `devops-lab` project created (private)
- [ ] Developer Desktop can `docker push` to Harbor
- [ ] Datacenter can `docker pull` from Harbor
- [ ] K3s registries.yaml configured

---

> **Next →** [03 — Dependency Cache](../03-dependency-cache/)
