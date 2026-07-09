# Step 4 — Kubernetes (Multi-Node K3s)

> Install the K3s Control Plane on the `k8s-master` VM, join the `k8s-worker-1` VM (Datacenter) and `k8s-worker-2` VM (Mac) to form a cluster, and configure remote `kubectl` access from your Developer Desktop.

---

## 01 — Install K3s Control Plane (Master)

Connect to your Developer Desktop and run the K3s installation script directly on the `k8s-master` VM using SSH:

```bash
# Replace 10.202.73.92 with your actual k8s-master IP
ssh ubuntu@10.202.73.92 "curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 --disable=servicelb"
```

### Get the Join Token and IP
To join the worker nodes, you need the master's IP address and its secure join token.

```bash
# Get the Join Token (run from Dev Desktop via SSH)
ssh ubuntu@10.202.73.92 "sudo cat /var/lib/rancher/k3s/server/node-token"
```

---

## 02 — Join the Worker Nodes

Now, execute the installation script inside the worker VMs, passing it the URL and Token from the master:

```bash
# Replace 10.202.73.146 with your actual k8s-worker-1 IP (Lenovo Datacenter)
ssh ubuntu@10.202.73.146 "curl -sfL https://get.k3s.io | K3S_URL=https://10.202.73.92:6443 K3S_TOKEN=your_token_here sh -"

# Join k8s-worker-2 (Mac Workstation)
ssh ubuntu@192.168.8.90 "curl -sfL https://get.k3s.io | K3S_URL=https://10.202.73.92:6443 K3S_TOKEN=your_token_here sh -"
```

---

## 03 — Configure Remote kubectl (SSH Tunnel)

To manage this new cluster from your Developer Desktop, you need to extract the `kubeconfig` file and point it to the cluster. 

> **Important Learning (MTU Fragmentation)**: When connecting from an external Dev VM to the internal Multipass VMs via static routing, you may encounter an MTU (Maximum Transmission Unit) fragmentation issue. Raw TCP connections (like `curl`) work perfectly, but large packets containing TLS certificates (like `kubectl`) get silently dropped by the Datacenter bridge, resulting in a `TLS handshake timeout`. 
> 
> **The Solution**: Instead of fighting MTU sizes, we establish an SSH tunnel to the Datacenter. This wraps the large `kubectl` packets inside SSH encryption, bypassing the fragmentation issue entirely and creating a robust, unbreakable connection to the cluster!

On your **Developer Desktop**:

```bash
# 1. Fetch the kubeconfig from the Datacenter host
mkdir -p ~/.kube
scp nisala@<LENOVO_IP>:~/k3s.yaml ~/.kube/config

# 2. Point kubectl to use the local end of our SSH tunnel (127.0.0.1)
# (It defaults to 127.0.0.1, so no editing of the IP is required if you use an SSH tunnel!)
# Just ensure permissions are correct:
chmod 600 ~/.kube/config

# 3. Establish the background SSH Tunnel to the k8s-master via the Datacenter Host
# (Replace 10.202.73.92 with the k8s-master IP, and LENOVO_IP with your Datacenter IP)
ssh -f -N -L 6443:10.202.73.92:6443 nisala@<LENOVO_IP>
```

### Test the Connection
```bash
kubectl get nodes
```
*You should see `k8s-master`, `k8s-worker-1`, and `k8s-worker-2` listed as `Ready`.*

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
- [ ] `k8s-worker-1` and `k8s-worker-2` have successfully joined the cluster
- [ ] `kubectl get nodes` works from the Developer Desktop
- [ ] Both nodes report a `Ready` status

---

> **Next →** [05 — Kafka](../05-kafka/)
