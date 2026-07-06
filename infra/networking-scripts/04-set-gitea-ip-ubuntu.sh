#!/bin/bash
INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)

cat <<INNER_EOF | sudo tee /etc/netplan/99-static-ip.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    $INTERFACE:
      dhcp4: no
      match:
        name: $INTERFACE
      addresses:
        - 192.168.8.80/24
      routes:
        - to: default
          via: 192.168.8.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
INNER_EOF

sudo netplan apply
