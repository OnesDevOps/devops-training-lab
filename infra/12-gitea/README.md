# Step 12 — Gitea (Source Control)

> Deploy a self-hosted Gitea instance to act as our private, on-premises replacement for GitHub.

---

## 01 — Overview

In an Enterprise Private Cloud, source code and Kubernetes manifests must be hosted internally. We use **Gitea** because it is extremely lightweight, fast, and supports Webhooks (required to trigger Jenkins) and GitOps workflows (required for Argo CD).

| Setting | Value |
|---------|-------|
| VM Host | MacBook (UTM) |
| OS | Ubuntu Server (Cloned from Dependency Cache) |
| IP Address | `192.168.8.80` |
| Software | Gitea (via Docker) |

---

## 02 — Clean Up the Cloned VM

Since this VM was cloned from the Dependency Cache, it likely has Nexus running on it. You must remove Nexus before installing Gitea to free up ports and resources.

SSH into your Gitea VM (`192.168.8.80`) and run:

```bash
# Stop and remove the Nexus container
docker stop nexus
docker rm nexus

# Delete the Nexus persistent data
sudo rm -rf /opt/nexus-data
```

---

## 03 — Deploy Gitea

We will run Gitea using Docker. First, create a directory for its data, then launch the container.

```bash
# Create the data directory
sudo mkdir -p /var/lib/gitea
sudo chown -R 1000:1000 /var/lib/gitea

# Run the Gitea container
docker run -d \
  --name gitea \
  --restart always \
  -p 3000:3000 \
  -p 222:22 \
  -e USER_UID=1000 \
  -e USER_GID=1000 \
  -v /var/lib/gitea:/data \
  gitea/gitea:latest
```

---

## 04 — Initial Setup

1. Open a browser on your Developer Desktop and navigate to `http://192.168.8.80:3000`.
2. You will be greeted by the **Initial Configuration** screen.
3. Leave the database settings as **SQLite3** (perfect for our lab).
4. Expand **Administrator Account Settings** at the bottom.
5. Create an admin user (e.g., `admin` / `password123`).
6. Click **Install Gitea**.

---

## 05 — Create Repositories

Once logged in, create two repositories:

1. **`devops-lab-apps`**: This will hold the source code for the Angular, Java, and .NET apps.
2. **`devops-lab-manifests`**: This will hold the Kubernetes YAML manifests (Deployment, Service, Ingress). Argo CD will watch this repository.

---

## ✅ Success Criteria

- [ ] Nexus is completely removed from the VM
- [ ] Gitea is running and accessible at `http://192.168.8.80:3000`
- [ ] You have created an admin account
- [ ] You have created the `devops-lab-apps` and `devops-lab-manifests` repositories
