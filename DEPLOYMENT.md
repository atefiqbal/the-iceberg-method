# Phase 1 Deployment Guide

Complete guide to deploy The Iceberg Method Phase 1 to production.

## Architecture Overview

- **Frontend**: Next.js 14 (Vercel)
- **Backend**: NestJS (Railway)
- **Database**: PostgreSQL (Railway)
- **Cache**: Redis (Railway)
- **Estimated Cost**: $5-10/month

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub (use atefiqbal account)
3. Link your GitHub repository

### 1.2 Create New Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
cd backend
railway init
```

### 1.3 Add Services
In Railway dashboard:
1. **Add PostgreSQL**: Click "+ New" → Database → PostgreSQL
2. **Add Redis**: Click "+ New" → Database → Redis
3. **Add Backend**: Click "+ New" → GitHub Repo → the-iceberg-method

### 1.4 Configure Environment Variables
In Railway backend service, add these variables:

```bash
# Node
NODE_ENV=production
PORT=4000

# Database (auto-filled by Railway)
DATABASE_URL=${PGDATABASE_URL}
DB_HOST=${PGHOST}
DB_PORT=${PGPORT}
DB_USERNAME=${PGUSER}
DB_PASSWORD=${PGPASSWORD}
DB_DATABASE=${PGDATABASE}

# Analytics Database (same as main for now)
ANALYTICS_DATABASE_URL=${PGDATABASE_URL}
ANALYTICS_DB_HOST=${PGHOST}
ANALYTICS_DB_PORT=${PGPORT}
ANALYTICS_DB_USERNAME=${PGUSER}
ANALYTICS_DB_PASSWORD=${PGPASSWORD}
ANALYTICS_DB_DATABASE=${PGDATABASE}

# Redis (auto-filled by Railway)
REDIS_URL=${REDIS_URL}
REDIS_HOST=${REDISHOST}
REDIS_PORT=${REDISPORT}

# Shopify OAuth (get from Shopify Partners)
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_orders,read_customers,read_products,read_checkouts

# JWT (generate random string)
JWT_SECRET=your_secure_random_jwt_secret_key_here
JWT_EXPIRATION=7d

# Encryption (generate 32-byte hex key)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here

# App URL (update after frontend deployed)
APP_URL=https://your-frontend-url.vercel.app

# Klaviyo (optional for testing)
KLAVIYO_API_KEY=your_klaviyo_api_key

# Logging
LOG_LEVEL=info
```

### 1.5 Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.6 Configure Build
In Railway, set:
- **Root Directory**: `/backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

### 1.7 Run Migrations
After first deploy, run in Railway CLI:
```bash
railway run npm run migration:run
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI (already installed)
```bash
vercel --version
```

### 2.2 Login to Vercel
```bash
vercel login
```

### 2.3 Deploy Frontend
```bash
cd frontend
vercel --prod
```

During deployment, answer:
- **Set up and deploy**: Yes
- **Which scope**: Your personal account
- **Link to existing project**: No
- **Project name**: the-iceberg-method
- **Directory**: ./
- **Override settings**: No

### 2.4 Configure Environment Variables
In Vercel dashboard (https://vercel.com/dashboard):
1. Go to your project → Settings → Environment Variables
2. Add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
BACKEND_URL=https://your-backend-url.railway.app
```

### 2.5 Redeploy
```bash
vercel --prod
```

---

## Step 3: Configure Shopify App

### 3.1 Create Shopify App
1. Go to https://partners.shopify.com/
2. Apps → Create app → Custom app
3. App name: "The Iceberg Method"
4. App URL: `https://your-frontend-url.vercel.app`
5. Allowed redirection URLs:
   - `https://your-backend-url.railway.app/auth/shopify/callback`
   - `https://your-frontend-url.vercel.app/auth/shopify`

### 3.2 Update Backend ENV
Add Shopify credentials to Railway backend environment variables.

---

## Step 4: Test Deployment

### 4.1 Health Checks
```bash
# Backend health
curl https://your-backend-url.railway.app/health

# Frontend
curl https://your-frontend-url.vercel.app
```

### 4.2 Seed Test Data
```bash
railway run npx ts-node scripts/seed-test-data.ts
```

### 4.3 Test OAuth Flow
1. Visit: `https://your-frontend-url.vercel.app`
2. Click "Connect Shopify"
3. Complete OAuth flow
4. Verify deliverability dashboard loads

---

## Step 5: Domain Setup (Optional)

### 5.1 Add Custom Domain to Vercel
1. Vercel Dashboard → Domains
2. Add domain: `app.yourdomain.com`
3. Configure DNS as instructed

### 5.2 Update Backend ENV
```bash
APP_URL=https://app.yourdomain.com
```

---

## Deployment Checklist

- [ ] Railway account created
- [ ] PostgreSQL database created
- [ ] Redis cache created
- [ ] Backend deployed to Railway
- [ ] Database migrations run
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Shopify app created
- [ ] OAuth flow tested
- [ ] Test merchant seeded
- [ ] Deliverability dashboard accessible
- [ ] All 4 gate scenarios tested

---

## Troubleshooting

### Backend won't start
- Check Railway logs: `railway logs`
- Verify all ENV variables are set
- Check database connection

### Frontend shows 500 errors
- Verify BACKEND_URL is correct
- Check Vercel logs
- Verify backend is running

### OAuth fails
- Check Shopify app redirect URLs match exactly
- Verify SHOPIFY_API_KEY and SHOPIFY_API_SECRET
- Check APP_URL is correct

### Database connection fails
- Verify DATABASE_URL is correct
- Check Railway PostgreSQL service is running
- Verify migrations ran successfully

---

## Cost Breakdown

**Railway (Backend + DB + Redis):**
- Starter Plan: $5/month
- Includes: 512MB RAM, shared CPU, 1GB storage
- Scales automatically

**Vercel (Frontend):**
- Hobby Plan: Free
- Includes: Unlimited deployments, 100GB bandwidth
- Upgrade to Pro ($20/month) for production domains

**Total**: $5-25/month depending on usage

---

## Next Steps

After successful deployment:
1. Connect real Klaviyo account
2. Monitor deliverability gate in production
3. Set up monitoring/alerts (Sentry)
4. Begin Phase 2: Core Flows
