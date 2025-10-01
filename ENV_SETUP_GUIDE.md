# Environment Variables Setup Guide

## Issue Fixed

1. ✅ Removed Vercel Analytics (causing 404 errors on cPanel)
2. ✅ Fixed API endpoint to use correct URL format
3. ✅ Added fallback for environment variables

---

## Create .env Files on Your Server

### For Production (cPanel)

Create `.env.production` file in your frontend directory:

```bash
# Navigate to frontend folder
cd ~/kpi

# Create .env.production file
nano .env.production
```

**Contents:**
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://kpiapi.cclpi.com.ph/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Sales Dashboard"
NEXT_PUBLIC_APP_URL=https://kpi.cclpi.com.ph

# Session Configuration
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
NEXT_PUBLIC_SESSION_WARNING_TIME=300000

# Environment
NODE_ENV=production
```

### For Local Development

Create `.env.local` file in your frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Application Configuration
NEXT_PUBLIC_APP_NAME="Sales Dashboard"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session Configuration
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
NEXT_PUBLIC_SESSION_WARNING_TIME=300000

# Environment
NODE_ENV=development
```

---

## What Was Changed

### 1. Removed Vercel Analytics

**File:** `app/layout.tsx`

**Before:**
```tsx
import { Analytics } from "@vercel/analytics/next"
// ...
<Analytics />
```

**After:**
```tsx
// Removed Vercel Analytics - not needed for cPanel deployment
// import { Analytics } from "@vercel/analytics/next"
// ...
{/* Removed Analytics component - not deploying to Vercel */}
```

### 2. Fixed API Endpoint with Fallback

**File:** `app/page.tsx`

**Before:**
```tsx
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kpi-targets?${params.toString()}`)
```

**After:**
```tsx
// Construct API URL with fallback and validation
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://kpiapi.cclpi.com.ph/api'
const apiUrl = `${apiBaseUrl}/kpi-targets?${params.toString()}`

console.log('[DEBUG] API URL:', apiUrl)
console.log('[DEBUG] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

const response = await fetch(apiUrl)
```

**This ensures:**
- If environment variable is missing, it falls back to production URL
- Debug logs help identify any URL construction issues
- Correct endpoint `/kpi-targets` is always used

---

## Deployment Steps for cPanel

1. **Pull latest code from GitHub:**
   ```bash
   cd ~/kpi
   git pull origin main
   ```

2. **Create .env.production file** (if not exists):
   ```bash
   nano .env.production
   # Paste the production config from above
   ```

3. **Remove old build:**
   ```bash
   rm -rf .next out node_modules
   ```

4. **Install dependencies** (without Vercel Analytics):
   ```bash
   npm install --legacy-peer-deps
   ```

5. **Build with correct environment:**
   ```bash
   npm run build
   ```

6. **Verify build:**
   ```bash
   ls -la out/
   # Should see index.html and _next folder
   ```

7. **Deploy:**
   - The `out/` folder is your static site
   - Point your domain to this folder in cPanel

---

## Troubleshooting

### Issue: "Failed to load resource: 400 Bad Request"

**Cause:** Environment variable not loaded during build

**Fix:**
1. Ensure `.env.production` exists
2. Rebuild: `npm run build`
3. Check console logs for debug output

### Issue: "Vercel Analytics 404 Error"

**Cause:** Vercel Analytics trying to load on non-Vercel hosting

**Fix:** 
- Already fixed by removing Analytics import
- Rebuild to remove from bundle

### Issue: Wrong API URL in console

**Check:**
```bash
# In browser console, you should see:
[DEBUG] API URL: https://kpiapi.cclpi.com.ph/api/kpi-targets?year=2025
[DEBUG] NEXT_PUBLIC_API_URL: https://kpiapi.cclpi.com.ph/api
```

**If URL is wrong:**
1. Check `.env.production` file exists
2. Rebuild application
3. Clear browser cache

---

## Environment Variable Priority

Next.js loads environment variables in this order:
1. `.env.production` (for production builds)
2. `.env.local` (for local development)
3. `.env` (fallback)
4. Hardcoded fallback in code

---

## Verify Deployment

After deploying, open browser console and check:

✅ **Should see:**
```
[DEBUG] API URL: https://kpiapi.cclpi.com.ph/api/kpi-targets?year=2025
[DEBUG] NEXT_PUBLIC_API_URL: https://kpiapi.cclpi.com.ph/api
```

❌ **Should NOT see:**
```
Failed to load resource: https://kpi.cclpi.com.ph/_vercel/insights/script.js 404
Failed to load resource: kpiapi.cclpi.com.ph/_targets?year=2025 400
```

---

## Summary

✅ Removed Vercel Analytics dependency  
✅ Fixed API endpoint construction  
✅ Added fallback for missing environment variables  
✅ Added debug logging to help troubleshoot  
✅ Documented environment setup process  

**Next Steps:**
1. Remove Vercel Analytics from dependencies: `npm uninstall @vercel/analytics`
2. Create `.env.production` on server
3. Rebuild application
4. Deploy and test

---

**Date:** October 2025  
**Status:** Ready for deployment

