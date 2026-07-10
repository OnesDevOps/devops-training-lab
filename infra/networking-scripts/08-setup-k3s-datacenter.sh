#!/bin/bash
# ==============================================================================
# Script: 08-setup-k3s-datacenter.sh
# Purpose: Initializes the K3s cluster on the Datacenter VMs
# Run on: Datacenter (Lenovo Laptop - 192.168.8.40)
# ==============================================================================

set -e

MASTER_IP="10.202.73.92"
K3S_URL="https://${MASTER_IP}:6443"

echo "================================================="
echo "   Initializing K3s Kubernetes Cluster"
echo "================================================="

# 1. Install K3s Control Plane
echo "▶ Installing K3s Control Plane on k8s-master..."
multipass exec k8s-master -- bash -c 'curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 --disable=servicelb'

# Wait a few seconds for K3s to generate the token
sleep 5

# 2. Extract Token
echo "▶ Extracting K3s secure node-token..."
K3S_TOKEN=$(multipass exec k8s-master -- sudo cat /var/lib/rancher/k3s/server/node-token)
# Trim any potential whitespace
K3S_TOKEN=$(echo "$K3S_TOKEN" | xargs)

# 3. Join Datacenter Worker
echo "▶ Joining k8s-worker-1 to the cluster..."
multipass exec k8s-worker-1 -- bash -c "curl -sfL https://get.k3s.io | K3S_URL=${K3S_URL} K3S_TOKEN=${K3S_TOKEN} sh -"

echo "================================================="
echo "🎉 Datacenter Initialization Complete!"
echo "================================================="
echo ""
echo "⚠️ IMPORTANT NEXT STEPS FOR YOUR MAC ⚠️"
echo ""
echo "1. Run this command on your Mac to join the Mac worker node (k8s-worker-2):"
echo "ssh ubuntu@192.168.8.90 \"curl -sfL https://get.k3s.io | K3S_URL=${K3S_URL} K3S_TOKEN=${K3S_TOKEN} sh -\""
echo ""
echo "2. Once that finishes, run these commands on your Mac to extract the kubeconfig:"
echo "ssh ubuntu@10.202.73.92 'sudo cat /etc/rancher/k3s/k3s.yaml' > ~/.kube/config"
echo "sed -i '' 's/127.0.0.1/10.202.73.92/g' ~/.kube/config"
echo ""
echo "3. Finally, verify the cluster from your Mac:"
echo "kubectl get nodes"
echo "================================================="
