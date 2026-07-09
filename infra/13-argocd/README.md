# Step 13 — Argo CD (GitOps Delivery)

> Install Argo CD into the K3s cluster to enable a true GitOps pull-based deployment workflow.

---

## 01 — Overview

Traditionally, Jenkins pushes code directly to Kubernetes via `kubectl apply`. In a GitOps workflow, Jenkins pushes updated Kubernetes manifests back to Gitea, and **Argo CD** automatically detects those changes and pulls them into the cluster. This ensures that the Gitea repository is the absolute source of truth for your infrastructure.

---

## 02 — Install Argo CD

Argo CD installs directly into your Kubernetes cluster. Because the Argo CD installation manifest is massive, running it remotely over a fragile tunnel can cause timeouts. The most robust way is to run the installation **directly inside the k8s-master VM**.

Also, to avoid GitHub API rate limits (`429 Too Many Requests`), we pull the official manifest from the JSdelivr CDN!

Run these commands from your Datacenter Host (`192.168.8.40`):

```bash
# Create the Argo CD namespace
multipass exec k8s-master -- kubectl create namespace argocd

# Install Argo CD directly on the master (skipping validation to save CPU)
multipass exec k8s-master -- kubectl apply -n argocd -f https://cdn.jsdelivr.net/gh/argoproj/argo-cd@stable/manifests/install.yaml --validate=false
```

Wait a few moments for the pods to spin up:
```bash
multipass exec k8s-master -- kubectl get pods -n argocd
```

---

## 03 — Access the Web UI

By default, the Argo CD API server is not exposed externally. We will temporarily patch it to use a `NodePort` so we can access it from our browser.

From your Datacenter Host or DevComputer:
```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'

# Find the assigned NodePort (e.g., 30xxx)
kubectl get svc argocd-server -n argocd
```

> **Important Learning (Mac Accessibility)**: If your Kubernetes nodes are running inside a nested VM on your Mac, your Mac's physical browser won't be able to route directly to the NodePort IP!
> **The Solution**: Create an SSH tunnel from a new terminal tab on your Mac directly to the Datacenter Host:
> `ssh -N -L 8080:10.202.73.92:<YOUR_NODE_PORT> nisala@192.168.8.40`
> 
> Then navigate to `https://localhost:8080` in your browser!
> *(Note: It uses a self-signed certificate, so you will need to bypass the security warning in your browser).*

---

## 04 — Login and Authenticate

The default username is `admin`. The initial password is auto-generated and stored in a Kubernetes secret. Retrieve it by running:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

Log in using `admin` and that password.

---

## 05 — Connect Argo CD to Gitea

1. In the Argo CD UI, navigate to **Settings** > **Repositories**.
2. Click **Connect Repo using HTTPS**.
3. **Repository URL**: `http://192.168.8.80:3000/admin/devops-lab-manifests.git`
4. **Username**: `admin`
5. **Password**: Your Gitea password
6. Click **Connect**.

Argo CD is now securely linked to your Gitea manifest repository!

---

## ✅ Success Criteria

- [ ] Argo CD pods are running in the `argocd` namespace
- [ ] You can access the Argo CD Web UI
- [ ] You successfully authenticated with the auto-generated admin password
- [ ] Argo CD is connected to your Gitea repository without TLS errors
