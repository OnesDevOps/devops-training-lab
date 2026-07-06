# Step 4 — Kubernetes (K3s on Datacenter)

> Install K3s on the Datacenter (Lenovo laptop) and configure remote `kubectl` access from the Developer Desktop.

---

## 01 — Install K3s via Ansible

### Create the Playbook

Create `infra/04-kubernetes/ansible/install-k3s.yml`:

```yaml
---
- name: Install K3s on Datacenter
  hosts: datacenter
  become: true
  tasks:
    - name: Install K3s
      shell: |
        curl -sfL https://get.k3s.io | sh -s - \
          --write-kubeconfig-mode 644 \
          --disable=servicelb \
          --kube-apiserver-arg="--service-node-port-range=80-32767"
      args:
        creates: /usr/local/bin/k3s

    - name: Wait for K3s to be ready
      command: k3s kubectl get nodes
      register: result
      until: result.rc == 0
      retries: 10
      delay: 5

    - name: Fetch kubeconfig
      fetch:
        src: /etc/rancher/k3s/k3s.yaml
        dest: /tmp/k3s-config
        flat: true

    - name: Show node status
      command: k3s kubectl get nodes -o wide
      register: nodes

    - name: Display
      debug:
        var: nodes.stdout_lines
```

### Run It

```bash
ansible-playbook -i inventory/hosts.yml infra/04-kubernetes/ansible/install-k3s.yml
```

---

## 02 — Configure Remote kubectl

On the Developer Desktop:

```bash
mkdir -p ~/.kube
cp /tmp/k3s-config ~/.kube/config

# Replace 127.0.0.1 with the Datacenter's IP
sed -i "s/127.0.0.1/<datacenter-ip>/g" ~/.kube/config

# Test
kubectl get nodes
kubectl get pods --all-namespaces
```

---

## 03 — Verify K3s Components

```bash
# All system pods should be Running
kubectl get pods -n kube-system

# Expected:
# coredns, traefik, metrics-server, local-path-provisioner
```

---

## 04 — Install Metrics Server (for HPA)

K3s typically includes metrics-server. Verify:

```bash
kubectl top nodes
kubectl top pods --all-namespaces
```

If missing:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## ✅ Success Criteria

- [ ] K3s running on Datacenter (`kubectl get nodes` shows Ready)
- [ ] Remote kubectl works from Developer Desktop
- [ ] All kube-system pods are Running
- [ ] `kubectl top nodes` returns metrics

---

> **Next →** [05 — Kafka](../05-kafka/)
