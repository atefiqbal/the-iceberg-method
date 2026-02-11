#!/bin/bash

# The Iceberg Method - Phase 1 Deployment Script
# This script helps automate the deployment process

set -e

echo "🚀 The Iceberg Method - Phase 1 Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✓ CLI tools ready${NC}"
echo ""

# Menu
echo "Select deployment option:"
echo "1) Deploy Backend to Railway"
echo "2) Deploy Frontend to Vercel"
echo "3) Deploy Both (Backend → Frontend)"
echo "4) Generate Encryption Key"
echo "5) Seed Test Data (Production)"
echo "6) View Deployment Status"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Deploying Backend to Railway...${NC}"
        cd backend

        # Check if logged in
        if ! railway whoami &> /dev/null; then
            echo "Please login to Railway:"
            railway login
        fi

        # Deploy
        railway up

        echo -e "${GREEN}✓ Backend deployed!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Go to Railway dashboard and add PostgreSQL + Redis"
        echo "2. Configure environment variables (see DEPLOYMENT.md)"
        echo "3. Run migrations: railway run npm run migration:run"
        ;;

    2)
        echo -e "${YELLOW}Deploying Frontend to Vercel...${NC}"
        cd frontend

        # Check if logged in
        if ! vercel whoami &> /dev/null; then
            echo "Please login to Vercel:"
            vercel login
        fi

        # Deploy
        vercel --prod

        echo -e "${GREEN}✓ Frontend deployed!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Add BACKEND_URL environment variable in Vercel dashboard"
        echo "2. Redeploy: vercel --prod"
        ;;

    3)
        echo -e "${YELLOW}Deploying Full Stack...${NC}"

        # Backend first
        echo "Step 1: Backend..."
        cd backend
        railway login 2>/dev/null || true
        railway up

        echo ""
        echo -e "${GREEN}✓ Backend deployed${NC}"
        echo ""
        read -p "Enter your Railway backend URL (e.g., https://xxx.railway.app): " BACKEND_URL

        # Frontend
        echo ""
        echo "Step 2: Frontend..."
        cd ../frontend
        vercel login 2>/dev/null || true

        # Set env var
        vercel env add BACKEND_URL production
        echo $BACKEND_URL

        vercel --prod

        echo -e "${GREEN}✓ Full stack deployed!${NC}"
        ;;

    4)
        echo -e "${YELLOW}Generating encryption key...${NC}"
        ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        echo ""
        echo "Your encryption key:"
        echo -e "${GREEN}${ENCRYPTION_KEY}${NC}"
        echo ""
        echo "Add this to Railway environment variables as ENCRYPTION_KEY"
        ;;

    5)
        echo -e "${YELLOW}Seeding production test data...${NC}"
        cd backend
        railway run npx ts-node scripts/seed-test-data.ts
        echo -e "${GREEN}✓ Test data seeded${NC}"
        ;;

    6)
        echo -e "${YELLOW}Checking deployment status...${NC}"
        echo ""
        echo "Backend (Railway):"
        cd backend
        railway status
        echo ""
        echo "Frontend (Vercel):"
        cd ../frontend
        vercel ls
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done! 🎉${NC}"
echo ""
echo "See DEPLOYMENT.md for full deployment guide"
