#!/bin/bash

# Configuration
GITEA_HOST="192.168.8.80:3000"
REPOS=("customer-service" "frontend" "lab-service")

echo "================================================="
echo "   GitHub to Gitea Migration Script"
echo "================================================="
echo "Please ensure you have registered your account"
echo "at http://$GITEA_HOST before continuing."
echo ""

read -p "Gitea Username: " GITEA_USER
read -s -p "Gitea Password: " GITEA_PASS
echo ""
echo "================================================="

# URL encode the password to safely embed it in the Git remote URL
ENCODED_PASS=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$GITEA_PASS")

# Get base directory
BASE_DIR="$(pwd)/src"

for REPO in "${REPOS[@]}"; do
    echo ""
    echo "▶ Processing repository: $REPO"
    
    # 1. Create Repository via Gitea API
    echo "  [1/4] Creating repository in Gitea..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://$GITEA_HOST/api/v1/user/repos" \
      -H "accept: application/json" \
      -u "$GITEA_USER:$GITEA_PASS" \
      -H "Content-Type: application/json" \
      -d "{
      \"name\": \"$REPO\",
      \"private\": false
    }")
    
    if [ "$RESPONSE" == "201" ]; then
        echo "        ✓ Repository created successfully."
    elif [ "$RESPONSE" == "409" ]; then
        echo "        ! Repository already exists. Proceeding..."
    else
        echo "        ❌ Failed to create repository (HTTP $RESPONSE). Check credentials."
        exit 1
    fi

    # 2. Pull latest from GitHub
    echo "  [2/4] Pulling latest code from GitHub..."
    cd "$BASE_DIR/$REPO" || { echo "        ❌ Directory $BASE_DIR/$REPO not found!"; exit 1; }
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
    
    # 3. Add Gitea Remote
    echo "  [3/4] Configuring Gitea remote..."
    git remote remove gitea 2>/dev/null
    git remote add gitea "http://$GITEA_USER:$ENCODED_PASS@$GITEA_HOST/$GITEA_USER/$REPO.git"
    
    # 4. Push to Gitea
    echo "  [4/4] Pushing code to Gitea..."
    git push -u gitea main 2>/dev/null || git push -u gitea master
    
    echo "  ✓ $REPO migration complete!"
done

echo ""
echo "================================================="
echo "🎉 All repositories successfully migrated!"
echo "Check them out at http://$GITEA_HOST/$GITEA_USER"
echo "================================================="
