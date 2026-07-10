#!/bin/bash
# ==============================================================================
# Script: 06-provision-datacenter.sh
# Purpose: Installs Multipass and provisions the 4 Virtual Machines on the Datacenter
# Run on: Datacenter (Lenovo Laptop - 192.168.8.40)
# ==============================================================================

set -e

echo "================================================="
echo "   Provisioning Datacenter VMs (Multipass)"
echo "================================================="

# 1. Install Multipass if it's not installed
if ! command -v multipass &> /dev/null; then
    echo "▶ Installing Canonical Multipass..."
    sudo snap install multipass
else
    echo "✓ Multipass is already installed."
fi

# 2. Function to launch a VM if it doesn't exist
launch_vm() {
    local NAME=$1
    local CPU=$2
    local RAM=$3
    local DISK=$4

    if multipass info "$NAME" &> /dev/null; then
        echo "✓ VM '$NAME' already exists."
    else
        echo "▶ Launching '$NAME' (CPU: $CPU, RAM: $RAM, Disk: $DISK)..."
        multipass launch --name "$NAME" --cpus "$CPU" --memory "$RAM" --disk "$DISK" 22.04
    fi
}

# 3. Launch the required VMs
echo ""
echo "--- Spinning up Virtual Machines ---"
launch_vm "k8s-master" 2 2G 10G
launch_vm "k8s-worker-1" 2 2G 15G
launch_vm "db-node-1" 2 2G 15G
launch_vm "db-node-2" 2 2500M 15G

# 4. Enable IP Forwarding on the host so the Mac can route traffic to these VMs
echo ""
echo "--- Configuring IP Forwarding and NAT ---"
echo "▶ Enabling IPv4 Forwarding in the kernel..."
sudo sysctl -w net.ipv4.ip_forward=1
sudo sh -c 'echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf'

# 5. Extract the Multipass subnet
echo "▶ Extracting Multipass Subnet..."
MULTIPASS_IP=$(multipass info k8s-master | grep IPv4 | awk '{print $2}')
SUBNET=$(echo $MULTIPASS_IP | cut -d'.' -f1-3)".0/24"
echo "  Multipass Subnet detected as: $SUBNET"

# 6. Set up iptables NAT rule so VMs have internet access
echo "▶ Setting up iptables MASQUERADE for subnet $SUBNET..."
# Find the primary network interface (usually wlp... or enp...)
PRIMARY_IF=$(ip route | grep default | awk '{print $5}')
sudo iptables -t nat -A POSTROUTING -s "$SUBNET" -o "$PRIMARY_IF" -j MASQUERADE

# Save iptables rules (requires iptables-persistent, we'll just install it if missing)
if ! dpkg -l | grep -q iptables-persistent; then
    echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
    echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
    sudo apt-get install -y iptables-persistent
fi
sudo netfilter-persistent save

echo "================================================="
echo "🎉 Provisioning Complete!"
echo "================================================="
echo "Your VMs are running. Here are their IP addresses:"
multipass list

echo ""
echo "⚠️ IMPORTANT NEXT STEP FOR YOUR MAC ⚠️"
echo "Run this command on your Mac Developer Desktop to route traffic to these VMs:"
echo "sudo route -n add -net $SUBNET 192.168.8.40"
echo "================================================="
