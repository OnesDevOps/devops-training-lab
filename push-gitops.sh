#!/bin/bash

GITEA_HOST="192.168.8.80:3000"

echo "================================================="
echo "   Push GitOps Manifests to Gitea"
echo "================================================="
read -p "Gitea Username: " GITEA_USER
read -s -p "Gitea Password: " GITEA_PASS
echo ""
echo "================================================="

# URL encode the password in case it has special chars
ENCODED_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$GITEA_PASS'''))")

cd gitops-manifests
git init
git add .
git commit -m "Initial commit of Kubernetes manifests"
git branch -M main
git remote add origin "http://$GITEA_USER:$ENCODED_PASS@$GITEA_HOST/$GITEA_USER/gitops-manifests.git"
git push -u origin main

echo ""
echo "================================================="
echo "🎉 GitOps manifests successfully pushed!"
echo "Check them out at http://$GITEA_HOST/$GITEA_USER/gitops-manifests"
echo "================================================="
