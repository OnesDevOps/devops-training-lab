# Step 0 — Developer Workstation Setup

> Set up your local development machine with all the tools needed to manage infrastructure remotely. This guide covers **Ubuntu (primary)**, macOS, and Windows.

---

## Architecture Context

```
┌──────────────────────────────────────────┐
│           Your Physical Machine          │
│  (MacBook, Windows PC, or Linux Desktop) │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │   Developer Workstation (Ubuntu)   │  │
│  │   (Native, WSL2, or UTM/VM)       │  │
│  │                                    │  │
│  │   • Git             • Ansible      │  │
│  │   • Terraform       • kubectl      │  │
│  │   • Jenkins         • Docker       │  │
│  │   • IDE access      • SSH keys     │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ SSH
                  ▼
┌──────────────────────────────────────────┐
│       Remote Datacenter (Ubuntu)         │
│       i7, 16GB RAM                       │
│       K3s, Kafka, Redis, PG, Mongo       │
└──────────────────────────────────────────┘
```

> **Key Insight:** All DevOps tools run inside an **Ubuntu environment**, regardless of your host OS. This ensures a consistent experience for all trainees.

---

## Choose Your Platform

| Your Host OS | Recommended Setup | Guide Section |
|---|---|---|
| **macOS** | Ubuntu VM via UTM (or Parallels/VMware) | [Section A](#a-macos--ubuntu-vm-via-utm) |
| **Windows** | WSL2 with Ubuntu, or Hyper-V VM | [Section B](#b-windows--wsl2-or-hyper-v) |
| **Linux (Ubuntu)** | Native — no VM needed | [Section C](#c-linux-ubuntu--native) |

---

## A. macOS — Ubuntu VM via UTM

### A.1 Prerequisites

- [UTM](https://mac.getutm.app/) installed on your Mac
- Ubuntu Server or Desktop ISO (22.04 LTS or later)
- At least 4GB RAM and 2 CPU cores allocated to the VM

### A.2 Create the Ubuntu VM

1. Open UTM → **Create a New Virtual Machine** → **Virtualize** (for Apple Silicon)
2. Select **Linux** → Browse to your Ubuntu ISO
3. Configure resources:
   - **RAM:** 4096 MB (4 GB)
   - **CPU Cores:** 2
   - **Disk:** 40 GB
4. Complete the Ubuntu installation
5. Note the VM's IP address:
   ```bash
   ip addr show | grep inet
   ```

### A.3 Network Configuration

Ensure the UTM VM can reach the remote datacenter:

- **UTM Network Mode:** Use **Bridged** networking so the VM gets a LAN IP address on the same network as the datacenter.
- If bridged isn't possible, use **Shared** networking and set up port forwarding or ensure the VM can route to the datacenter's IP.

### A.4 Proceed to Tool Installation

Once your Ubuntu VM is running, jump to **[Section C](#c-linux-ubuntu--native)** to install all the DevOps tools.

---

## B. Windows — WSL2 or Hyper-V

### B.1 Option 1: WSL2 (Recommended)

```powershell
# Open PowerShell as Administrator
wsl --install -d Ubuntu-22.04
```

After reboot, open **Ubuntu** from the Start menu and set up your user.

### B.2 Option 2: Hyper-V VM

1. Enable Hyper-V: **Settings → Apps → Optional Features → More Windows Features → Hyper-V**
2. Create a new VM with Ubuntu Server ISO
3. Allocate 4GB RAM, 2 cores, 40GB disk

### B.3 Network Configuration

- **WSL2:** Networking is shared with the Windows host by default. Ensure the datacenter IP is reachable: `ping <datacenter-ip>`
- **Hyper-V:** Use **External Switch** for bridged networking

### B.4 Proceed to Tool Installation

Once your Ubuntu environment is running, follow **[Section C](#c-linux-ubuntu--native)**.

---

## C. Linux (Ubuntu) — Native

> **This is the section all platforms converge on.** Whether you're running Ubuntu natively, in UTM, WSL2, or Hyper-V, follow these steps.

### C.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### C.2 Install Core Tools

```bash
# Git
sudo apt install -y git

# Docker
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Terraform
sudo apt install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt install -y terraform

# Ansible
sudo apt install -y pipx
pipx install ansible-core
pipx ensurepath
# Restart your shell or source ~/.bashrc after this

# Java (needed for Jenkins)
sudo apt install -y openjdk-21-jre-headless
```

### C.3 Install Jenkins

```bash
# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
echo "Jenkins initial password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at `http://localhost:8080` (or `http://<vm-ip>:8080` from your host browser).

### C.4 Verify All Installations

```bash
echo "=== Tool Versions ==="
git --version
docker --version
kubectl version --client 2>/dev/null | head -1
terraform --version | head -1
ansible --version | head -1
java -version 2>&1 | head -1
jenkins --version 2>/dev/null || systemctl status jenkins --no-pager | head -5
echo "=== All Checks Complete ==="
```

---

## D. Configure SSH Access to Datacenter

> This step is the same regardless of your platform.

### D.1 Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "devops-lab" -f ~/.ssh/devops_lab_key
```

### D.2 Copy Key to Datacenter

```bash
ssh-copy-id -i ~/.ssh/devops_lab_key.pub <your-user>@<datacenter-ip>
```

### D.3 Create SSH Config Entry

Add to `~/.ssh/config`:

```
Host datacenter
    HostName <datacenter-ip>
    User <your-user>
    IdentityFile ~/.ssh/devops_lab_key
    StrictHostKeyChecking no
```

### D.4 Test Connection

```bash
ssh datacenter "hostname && uname -a && free -h"
```

---

## E. Configure Ansible Inventory

Create the inventory file used throughout the lab:

```bash
mkdir -p ~/devops-lab/inventory
```

Create `~/devops-lab/inventory/hosts.yml`:

```yaml
all:
  hosts:
    datacenter:
      ansible_host: <datacenter-ip>
      ansible_user: <your-user>
      ansible_ssh_private_key_file: ~/.ssh/devops_lab_key
  vars:
    ansible_python_interpreter: /usr/bin/python3
```

Test it:

```bash
ansible -i ~/devops-lab/inventory/hosts.yml datacenter -m ping
```

Expected output:
```
datacenter | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

---

## F. Clone the Repository

```bash
git clone https://github.com/OnesDevOps/devops-training-lab.git
cd devops-training-lab
```

---

## ✅ Success Criteria

- [ ] Ubuntu environment running (native, UTM VM, or WSL2)
- [ ] All tools installed and verified (Git, Docker, kubectl, Terraform, Ansible, Jenkins, Java)
- [ ] SSH key-based access to datacenter works without password prompt
- [ ] `ansible ping` returns `SUCCESS` for the datacenter host
- [ ] Repository cloned and ready
- [ ] Jenkins accessible at `http://localhost:8080`

---

> **Next →** [01 — Datacenter Prerequisites](../01-datacenter-prerequisites/)
