# Production Deployment from GitHub

## ✅ Frontend Successfully Pushed!

**GitHub Repository:** https://github.com/bendamz30/kpi.cclpi.com.ph.git

---

## 🚀 Deploy to Production (kpi.cclpi.com.ph)

### Initial Setup (First Time Only)

SSH into your production server:

```bash
# Clone the repository
cd /var/www
git clone https://github.com/bendamz30/kpi.cclpi.com.ph.git frontend
cd frontend

# Copy and configure environment
cp env.production.example .env.production

# Your .env.production is already configured with:
# NEXT_PUBLIC_API_URL=https://kpiapi.cclpi.com.ph/api
# NEXT_PUBLIC_APP_URL=https://kpi.cclpi.com.ph
# NODE_ENV=production

# Install dependencies
npm install --legacy-peer-deps

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Follow the instructions from pm2 startup
```

---

## 🔄 Update Deployment (When You Push Changes)

### Step 1: Push from Local Machine (Windows)

```bash
cd C:\xampp\htdocs\salesdashboard\frontend
git add .
git commit -m "Your change description"
git push origin main
```

### Step 2: Deploy on Production Server

```bash
cd /var/www/frontend

# Pull latest changes
git pull origin main

# Update dependencies (only if package.json changed)
npm install --legacy-peer-deps

# Rebuild
npm run build

# Restart PM2
pm2 restart sales-dashboard

# Check status
pm2 status
pm2 logs sales-dashboard --lines 50
```

---

## ⚡ Quick Update Script

Create `/var/www/frontend/update.sh`:

```bash
#!/bin/bash
echo "========================================="
echo "Updating Frontend from GitHub"
echo "========================================="

cd /var/www/frontend

# Pull changes
echo "Pulling latest changes..."
git pull origin main

# Check if package.json changed
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    echo "package.json changed, updating dependencies..."
    npm install --legacy-peer-deps
fi

# Rebuild
echo "Building application..."
npm run build

# Restart PM2
echo "Restarting PM2..."
pm2 restart sales-dashboard

echo "========================================="
echo "Deployment completed!"
echo "========================================="

# Show logs
pm2 logs sales-dashboard --lines 50
```

Make it executable:
```bash
chmod +x /var/www/frontend/update.sh
```

Then just run:
```bash
/var/www/frontend/update.sh
```

---

## ✅ Verification

After deployment:

1. **Check PM2 Status:**
   ```bash
   pm2 status
   ```

2. **View Logs:**
   ```bash
   pm2 logs sales-dashboard
   ```

3. **Test in Browser:**
   - Visit: https://kpi.cclpi.com.ph
   - Login and test functionality

4. **Check API Connection:**
   - Dashboard should load data
   - Check browser console for errors (F12)

---

## 🔧 Troubleshooting

### Build Fails
```bash
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### PM2 Issues
```bash
pm2 delete sales-dashboard
pm2 start ecosystem.config.js
pm2 save
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000
# Kill it if needed
kill -9 <PID>
```

---

## 📊 Your URLs

- **Production:** https://kpi.cclpi.com.ph
- **API Backend:** https://kpiapi.cclpi.com.ph/api
- **GitHub Repo:** https://github.com/bendamz30/kpi.cclpi.com.ph.git

---

**Last Push:** October 2025  
**Commit:** Add production deployment fixes

