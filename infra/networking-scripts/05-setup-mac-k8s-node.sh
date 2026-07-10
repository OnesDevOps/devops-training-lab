#!/bin/bash
# Run this inside the cloned VM from the UTM Console!

echo "========================================="
echo "   k8s-worker-2 Initial Setup Script"
echo "========================================="

# 1. Set hostname
sudo hostnamectl set-hostname k8s-worker-2
echo "✓ Hostname set to k8s-worker-2"

# 2. Update Netplan IP (assuming it was .80, changing to .90)
if [ -f /etc/netplan/99-static-ip.yaml ]; then
    sudo sed -i 's/192.168.8.80/192.168.8.90/g' /etc/netplan/99-static-ip.yaml
    sudo netplan apply
    echo "✓ Static IP updated to 192.168.8.90"
else
    echo "⚠ Could not find /etc/netplan/99-static-ip.yaml. You may need to set the IP manually."
fi

# 3. Remove Gitea
docker rm -f gitea >/dev/null 2>&1
sudo rm -rf /var/lib/gitea >/dev/null 2>&1
echo "✓ Gitea container and data removed"

echo "========================================="
echo "Done! You can now access this node via SSH:"
echo "ssh ubuntu@192.168.8.90"
echo "========================================="
