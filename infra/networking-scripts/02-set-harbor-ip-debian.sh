#!/bin/bash
# Run this on the Harbor Container Registry VM (Debian 12 Minimal)
# Sets the IP to 192.168.8.60

IP_ADDRESS="192.168.8.60"
NETMASK="255.255.255.0"
GATEWAY="192.168.8.1"

# Find the active network interface (e.g., enp0s3)
INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)

if [ -z "$INTERFACE" ]; then
    echo "Error: Could not determine active network interface."
    exit 1
fi

echo "Configuring interfaces for $INTERFACE with IP 192.168.8.60..."

# Debian minimal typically uses /etc/network/interfaces
# We will overwrite the main interfaces file to prevent DHCP conflicts
cat <<EOF | sudo tee /etc/network/interfaces
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto $INTERFACE
allow-hotplug $INTERFACE
iface $INTERFACE inet static
    address 192.168.8.60
    netmask 255.255.255.0
    gateway 192.168.8.1
    hwaddress ether ce:68:0e:ab:60:60
    dns-nameservers 8.8.8.8 8.8.4.4
EOF

# Restart the networking service
sudo systemctl restart networking

echo "IP successfully changed to 192.168.8.60."
echo "Note: Your SSH session might disconnect now if you were connected remotely."
