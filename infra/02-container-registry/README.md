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

## 01 — Create the Ubuntu VM in UTM

1. Clone the DevComputer VM or create a new Ubuntu Server VM in UTM
2. Boot the VM and configure the static IP to `192.168.8.60` (as done previously)

### Post-Install — Install Docker

```bash
# Install prerequisites
sudo apt update && sudo apt install -y ca-certificates curl gnupg

# Add Docker repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
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

## 02 — Deploy Docker Registry

Since Harbor's official images are currently AMD64-only, we use the official lightweight Docker Registry (`registry:2`) for ARM64 compatibility on Apple Silicon.

### 2.1 Start the Registry

Run the following command to start the registry in the background. It will automatically restart if the VM reboots.

```bash
docker run -d \
  -p 80:5000 \
  --restart=always \
  --name registry \
  -v /data/registry:/var/lib/registry \
  registry:2
```

### 2.2 Verify

Verify the container is running:
```bash
docker ps
```

You can test the API endpoint to ensure it is responding:
```bash
curl -s http://localhost/v2/_catalog
```
It should return an empty JSON object: `{"repositories":[]}`.

---

## 03 — Configure Clients to Use This Registry

### On the Developer Desktop (VM 1)

Since we are running the registry on port 80 without HTTPS (for the lab), we must configure Docker clients to trust it as an insecure registry.

```bash
# Trust the insecure (HTTP) registry
sudo tee /etc/docker/daemon.json << EOF
{
  "insecure-registries": ["192.168.8.60:80", "192.168.8.60"]
}
EOF
sudo systemctl restart docker
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

# Verify using the curl command we ran earlier
```

---

## ✅ Success Criteria

- [ ] Debian VM running with Docker
- [ ] Docker Registry accessible via curl API
- [ ] Developer Desktop can `docker push` to registry
- [ ] Datacenter can `docker pull` from registry
- [ ] K3s registries.yaml configured

---

> **Next →** [03 — Dependency Cache](../03-dependency-cache/)
