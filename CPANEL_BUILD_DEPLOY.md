# cPanel Build & Deploy Instructions

## ✅ Issues Fixed

1. ✅ Removed Vercel Analytics (was causing 404 errors)
2. ✅ Fixed API endpoint with fallback URL
3. ✅ Cleaned up unnecessary dependencies
4. ✅ Reduced bundle size significantly

---

## 🚀 Deploy to cPanel - Step by Step

### Option 1: Build Locally, Upload to cPanel (Recommended)

#### Step 1: Build on Your Local Machine (Windows)

```bash
cd C:\xampp\htdocs\salesdashboard\frontend

# Ensure .env.production exists with correct API URL
# File should contain: NEXT_PUBLIC_API_URL=https://kpiapi.cclpi.com.ph/api

# Clean previous build
Remove-Item .next,out,node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Install dependencies
npm install --legacy-peer-deps

# Build for production
npm run build

# The 'out' folder is now ready to deploy
```

#### Step 2: Upload to cPanel

**Option A: Via File Manager**
1. Zip the `out` folder: `Compress-Archive -Path out -DestinationPath out.zip`
2. Login to cPanel → File Manager
3. Navigate to `/home/yourusername/kpi/`
4. Upload `out.zip`
5. Extract the zip file
6. Delete old `out` folder contents first if needed

**Option B: Via Git (Include built files)**
```bash
# Add out folder to git temporarily
git add out -f
git commit -m "Add built static files for cPanel"
git push origin main

# Then in cPanel Git Version Control: Click "Pull"
```

### Option 2: Build on cPanel Terminal (If Node.js Available)

```bash
cd ~/kpi
git pull origin main

# Create .env.production if not exists
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://kpiapi.cclpi.com.ph/api
NEXT_PUBLIC_APP_NAME="Sales Dashboard"
NEXT_PUBLIC_APP_URL=https://kpi.cclpi.com.ph
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
NEXT_PUBLIC_SESSION_WARNING_TIME=300000
NODE_ENV=production
EOF

# Build
npm install --legacy-peer-deps
npm run build

# Point domain to ~/kpi/out/ folder
```

---

## 📝 Post-Deployment Configuration

### 1. Point Domain to Output Folder

In cPanel → Domains:
- **Domain:** kpi.cclpi.com.ph
- **Document Root:** `/home/yourusername/kpi/out`
- **Save**

### 2. Create .htaccess in 'out' folder

**Location:** `/home/yourusername/kpi/out/.htaccess`

**Contents:**
```apache
# Enable rewrite engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 3. Install SSL Certificate

1. Go to cPanel → SSL/TLS Status
2. Find `kpi.cclpi.com.ph`
3. Click "Run AutoSSL" or install Let's Encrypt

---

## ✅ Verification Steps

### 1. Test API Endpoint

Open browser console (F12) and visit: https://kpi.cclpi.com.ph

**You should see:**
```
[DEBUG] API URL: https://kpiapi.cclpi.com.ph/api/kpi-targets?year=2025
[DEBUG] NEXT_PUBLIC_API_URL: https://kpiapi.cclpi.com.ph/api
```

**You should NOT see:**
```
❌ Failed to load resource: /_targets?year=2025 400
❌ Failed to load resource: /_vercel/insights/script.js 404
```

### 2. Test Functionality

- [ ] Login page loads
- [ ] Can login with credentials
- [ ] Dashboard displays KPI cards
- [ ] No console errors
- [ ] API calls succeed

---

## 📦 Package Changes

### Removed Dependencies:

| Package | Reason |
|---------|--------|
| `@vercel/analytics` | Not deploying to Vercel |
| `@remix-run/react` | Not using Remix framework |
| `@sveltejs/kit` | Not using Svelte framework |
| `express` | Next.js has built-in server |
| `fs` | Node.js module, not for client |
| `path` | Node.js module, not for client |
| `svelte` | Not using Svelte |
| `vue` | Not using Vue |
| `vue-router` | Not using Vue |

**Result:** 121 packages removed, 371 packages remaining

---

## 🎯 Bundle Size Improvement

**Before:**
- Shared JS: ~150 kB
- Total packages: 492

**After:**
- Shared JS: 101 kB ✅ (-49 kB)
- Total packages: 371 ✅ (-121 packages)

---

## 🔄 Update Workflow

### When You Make Changes:

```bash
# 1. On local machine
cd C:\xampp\htdocs\salesdashboard\frontend
# Make your changes
npm run build
git add .
git commit -m "Your changes"
git push origin main

# 2. On cPanel
# Option A: Pull and rebuild
cd ~/kpi
git pull origin main
npm install --legacy-peer-deps
npm run build

# Option B: Upload built 'out' folder directly
```

---

## 🚨 Important Notes

### For Static Export (output: 'export'):

1. **Environment variables are baked in at build time**
   - You must have `.env.production` when building
   - Rebuilding is required after changing environment variables

2. **API routes don't work**
   - That's okay - we're using external Laravel API

3. **All pages are pre-rendered**
   - Faster loading
   - Better for SEO
   - Perfect for cPanel hosting

---

## Troubleshooting

### Wrong API URL in Production

**Fix:**
```bash
# 1. Verify .env.production exists and has correct URL
cat .env.production | grep NEXT_PUBLIC_API_URL

# 2. Rebuild
rm -rf .next out
npm run build

# 3. Redeploy
```

### Console Shows: NEXT_PUBLIC_API_URL: undefined

**Fix:**
1. Create `.env.production` file
2. Rebuild application
3. The fallback will use production URL anyway

### Still Getting 400 Errors

**Check:**
1. Backend API is running: `curl https://kpiapi.cclpi.com.ph/api/users`
2. CORS is configured in backend to allow `kpi.cclpi.com.ph`
3. Check backend logs for actual error

---

## Summary

✅ **Vercel Analytics Removed** - No more 404 errors  
✅ **API URL Fixed** - Correct endpoint with fallback  
✅ **Dependencies Cleaned** - Smaller, faster builds  
✅ **Debug Logging Added** - Easier troubleshooting  
✅ **Documentation Complete** - Clear deployment steps  

**Your app is now optimized for cPanel deployment!** 🎉

---

**Build Status:** ✅ Successful  
**Bundle Size:** 101 kB  
**Ready for:** cPanel Static Hosting  
**API Endpoint:** https://kpiapi.cclpi.com.ph/api/kpi-targets

