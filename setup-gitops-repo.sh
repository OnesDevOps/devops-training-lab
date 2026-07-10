#!/bin/bash

# Configuration
GITEA_HOST="192.168.8.80:3000"
REPO="gitops-manifests"

echo "================================================="
echo "   Initialize GitOps Repository in Gitea"
echo "================================================="
echo "Please ensure you have registered your account"
echo "at http://$GITEA_HOST before continuing."
echo ""

read -p "Gitea Username: " GITEA_USER
read -s -p "Gitea Password: " GITEA_PASS
echo ""
echo "================================================="

# 1. Create Repository via Gitea API
echo "▶ Creating repository '$REPO' in Gitea..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://$GITEA_HOST/api/v1/user/repos" \
  -H "accept: application/json" \
  -u "$GITEA_USER:$GITEA_PASS" \
  -H "Content-Type: application/json" \
  -d "{
  \"name\": \"$REPO\",
  \"private\": false,
  \"auto_init\": true
}")

if [ "$RESPONSE" == "201" ]; then
    echo "  ✓ Repository created successfully."
elif [ "$RESPONSE" == "409" ]; then
    echo "  ! Repository already exists."
else
    echo "  ❌ Failed to create repository (HTTP $RESPONSE). Check credentials."
    exit 1
fi

echo ""
echo "================================================="
echo "🎉 GitOps repository ready!"
echo "Check it out at http://$GITEA_HOST/$GITEA_USER/$REPO"
echo "================================================="
