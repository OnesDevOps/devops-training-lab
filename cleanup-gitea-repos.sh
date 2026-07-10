#!/bin/bash

GITEA_HOST="192.168.8.80:3000"
REPOS=("customer-service" "frontend" "lab-service")

echo "================================================="
echo "   Cleanup Redundant Source Repos on Gitea"
echo "================================================="
echo "This will delete the source code repositories from"
echo "Gitea, since they are now hosted on GitHub."
echo ""

read -p "Gitea Username: " GITEA_USER
read -s -p "Gitea Password: " GITEA_PASS
echo ""
echo "================================================="

for REPO in "${REPOS[@]}"; do
    echo "▶ Deleting repository '$REPO'..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://$GITEA_HOST/api/v1/repos/$GITEA_USER/$REPO" \
      -H "accept: application/json" \
      -u "$GITEA_USER:$GITEA_PASS")

    if [ "$RESPONSE" == "204" ] || [ "$RESPONSE" == "200" ]; then
        echo "  ✓ Repository deleted successfully."
    elif [ "$RESPONSE" == "404" ]; then
        echo "  - Repository already deleted or not found."
    else
        echo "  ❌ Failed to delete repository (HTTP $RESPONSE)."
    fi
done

echo ""
echo "================================================="
echo "🎉 Cleanup complete!"
echo "================================================="
