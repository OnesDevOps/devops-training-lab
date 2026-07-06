# Step 4 — Kubernetes (Multi-Node K3s)

> Install the K3s Control Plane on the `k8s-master` VM, join the `k8s-worker-1` VM to form a cluster, and configure remote `kubectl` access from your Developer Desktop.

---

## 01 — Install K3s Control Plane (Master)

Connect to your Developer Desktop and run the K3s installation script directly on the `k8s-master` VM using SSH:

```bash
# Replace 10.202.73.92 with your actual k8s-master IP
ssh ubuntu@10.202.73.92 "curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 --disable=servicelb"
```

### Get the Join Token and IP
To join the worker node, you need the master's IP address and its secure join token.

```bash
# Get the Join Token (run from Dev Desktop via SSH)
ssh ubuntu@10.202.73.92 "sudo cat /var/lib/rancher/k3s/server/node-token"
```

---

## 02 — Join the Worker Node

Now, execute the installation script inside the `k8s-worker-1` VM, passing it the URL and Token from the master:

```bash
# Replace 10.202.73.146 with your actual k8s-worker-1 IP
# Replace <MASTER_IP> and <NODE_TOKEN> with the values from Step 1
ssh ubuntu@10.202.73.146 "curl -sfL https://get.k3s.io | K3S_URL=https://<MASTER_IP>:6443 K3S_TOKEN=<NODE_TOKEN> sh -"
```

---

## 03 — Configure Remote kubectl

To manage this new cluster from your Developer Desktop, extract the `kubeconfig` file from the master VM.

On the **Developer Desktop (Mac)**:

```bash
# Add a static route so your Dev Desktop can reach the internal Multipass VMs.
# Replace <LENOVO_IP> with the Wi-Fi IP of your Lenovo laptop!
# (If you already added this route during testing, you can skip this step)
# sudo ip route add 10.202.73.0/24 via <LENOVO_IP>

# SSH into the master node and grab the config (replace with its actual 10.202.73.x IP)
ssh ubuntu@10.202.73.92 "sudo cat /etc/rancher/k3s/k3s.yaml" > ~/.kube/config

# Edit the config file: Replace 127.0.0.1 with the k8s-master IP (e.g., 10.202.73.92)
nano ~/.kube/config
```

### Test the Connection
```bash
kubectl get nodes
```
*You should see both `k8s-master` and `k8s-worker-1` listed as `Ready`.*

---

## 04 — Verify K3s Components

Ensure the cluster has fully initialized by checking the system pods:

```bash
kubectl get pods -n kube-system

# Expected:
# coredns, traefik, metrics-server, local-path-provisioner
```

---

## ✅ Success Criteria

- [ ] Control Plane is running on `k8s-master`
- [ ] `k8s-worker-1` has successfully joined the cluster
- [ ] `kubectl get nodes` works from the Developer Desktop
- [ ] Both nodes report a `Ready` status

---

> **Next →** [05 — Kafka](../05-kafka/)
