# Deployment Checklist - School Dashboard

## Pre-Deployment Testing (Local)

### Backend
- [ ] `npm install` in backend directory
- [ ] Create `.env` file with required variables:
  ```
  JWT_SECRET=dev_secret_key_32_chars_min
  MONGODB_URI=your_mongodb_uri
  FRONTEND_URL=http://localhost:3000
  ```
- [ ] Run `npm run dev` - server starts on port 5000
- [ ] Test `/api/health` endpoint returns `{ status: 'ok' }`
- [ ] Call `/api/auth/seed` to populate test data
- [ ] Test login: POST `/api/auth/login` with `{ email: "admin@school.com", password: "admin123" }`
- [ ] Verify token is returned
- [ ] Test `/api/auth/me` with token in Authorization header

### Frontend
- [ ] `npm install` in frontend directory
- [ ] Run `npm run dev` - opens on port 3000
- [ ] Test login with admin credentials
- [ ] Verify token is stored in localStorage
- [ ] Verify user data is persisted
- [ ] Refresh page - user session should restore
- [ ] Logout and verify cleanup

## Vercel Deployment

### Step 1: Connect Repository
- [ ] Push code to GitHub
- [ ] Connect GitHub repo to Vercel

### Step 2: Set Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:

```
JWT_SECRET = [Generate secure secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
MONGODB_URI = [Your MongoDB connection string]
FRONTEND_URL = https://[your-vercel-domain].vercel.app
NODE_ENV = production
```

### Step 3: Verify Build Configuration
- [ ] Check `vercel.json` exists in root directory
- [ ] Verify `buildCommand` is correct
- [ ] Verify `outputDirectory` points to frontend/dist
- [ ] Check `rewrites` configuration

### Step 4: Deploy
- [ ] Trigger deployment on Vercel (automatic on push or manual)
- [ ] Wait for build to complete
- [ ] Check build logs for errors

### Step 5: Post-Deployment Testing
- [ ] Open production URL in browser
- [ ] Test login with credentials
- [ ] Verify JWT token in localStorage
- [ ] Clear localStorage and refresh - should redirect to login
- [ ] Check browser console for errors
- [ ] Check Vercel function logs for errors

## Troubleshooting

### Build Fails
**Check:**
- [ ] `npm install` works locally
- [ ] `npm run build` works locally in frontend
- [ ] All environment variables are set correctly
- [ ] Node.js version compatibility

**Solution:**
```bash
# Clear Vercel cache and rebuild
vercel --prod --force
```

### Login Fails on Production
**Check in Vercel Function Logs:**
- [ ] Is JWT_SECRET set?
- [ ] Can the function connect to MongoDB?
- [ ] Is the token being created?
- [ ] Is the authorization header being sent?

**Solution:**
```bash
# Test the endpoint directly
curl -X GET https://[domain].vercel.app/api/health

# Test login
curl -X POST https://[domain].vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'
```

### Session Not Persisting
**Check:**
- [ ] Token is correctly stored in localStorage
- [ ] Authorization header format is: `Bearer [token]`
- [ ] Token hasn't expired (check JWT expiry)
- [ ] MongoDB connection is stable

## Verification Command
Test production API after deployment:

```bash
# Set your production domain
DOMAIN="https://your-app.vercel.app"

# 1. Check health
curl $DOMAIN/api/health

# 2. Login
TOKEN=$(curl -s -X POST $DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}' | jq -r '.token')

# 3. Test protected endpoint
curl -X GET $DOMAIN/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Should return user object if working
```

## Success Criteria
✅ All tests pass locally
✅ Environment variables set on Vercel
✅ Build completes without errors
✅ Production login works
✅ Token persists in localStorage
✅ Session restores after page refresh
✅ Protected routes require valid token
✅ Logout clears session properly

---

## Quick Start After Fixes

1. **Local Development:**
   ```bash
   cd backend
   npm install
   echo "JWT_SECRET=test_secret_key_32_characters_minimum
   MONGODB_URI=your_mongodb_uri
   FRONTEND_URL=http://localhost:3000" > .env
   npm run dev
   
   # In another terminal
   cd frontend
   npm install
   npm run dev
   ```

2. **Deploy to Vercel:**
   - Push to GitHub
   - Vercel auto-deploys
   - Set environment variables in Vercel dashboard
   - Test production login

3. **Seed Database (if needed):**
   ```bash
   curl https://your-domain.vercel.app/api/auth/seed
   ```
