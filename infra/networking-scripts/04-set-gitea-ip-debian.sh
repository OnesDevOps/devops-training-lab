#!/bin/bash
# Run this inside the UTM console of the newly cloned Gitea VM

INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)

cat <<INNER_EOF | sudo tee /etc/network/interfaces
source /etc/network/interfaces.d/*
auto lo
iface lo inet loopback

auto $INTERFACE
allow-hotplug $INTERFACE
iface $INTERFACE inet static
    address 192.168.8.80
    netmask 255.255.255.0
    gateway 192.168.8.1
    dns-nameservers 8.8.8.8 8.8.4.4
INNER_EOF

sudo systemctl restart networking
