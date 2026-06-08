# School Dashboard - Login Bug Fix Guide

## Bugs Fixed

### 1. **Missing JWT `/api/auth/me` Endpoint** ✅ CRITICAL
**Problem**: The AuthContext calls `authAPI.getMe()` on app mount to restore user session, but this endpoint didn't exist in the serverless API (`api/index.js`), causing immediate logout.

**Fix**: Added protected `/api/auth/me` endpoint in `api/index.js`:
```javascript
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = req.user;
    res.json({ user });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});
```

### 2. **Missing JWT Middleware** ✅ CRITICAL
**Problem**: No JWT verification middleware in the serverless function, so protected routes weren't actually protected.

**Fix**: Added `protect` middleware that verifies JWT tokens:
```javascript
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  const decoded = jwt.verify(token, JWT_SECRET);
  const User = await getModel('User');
  req.user = await User.findById(decoded.id).select('-password');
  if (!req.user) {
    return res.status(401).json({ message: 'User not found' });
  }
  next();
};
```

### 3. **Insecure JWT_SECRET Handling** ✅ SECURITY
**Problem**: 
- `api/index.js` used fallback string `'fallback'` instead of requiring environment variable
- `backend/server.js` didn't validate JWT_SECRET was set

**Fix**: 
- Added validation that exits if JWT_SECRET not set:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
```
- Updated login to use `JWT_SECRET` instead of fallback

### 4. **Hardcoded MongoDB URI** ✅ SECURITY
**Problem**: MongoDB URI with credentials was hardcoded in `api/index.js`

**Fix**: Made it use environment variable:
```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'fallback_for_local_dev';
```

### 5. **Insufficient CORS Configuration** ✅ DEPLOYMENT
**Problem**: CORS was enabled for all origins, could cause issues in production

**Fix**: Added specific origin whitelisting:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));
```

## Deployment Instructions

### Step 1: Set Environment Variables on Vercel
In your Vercel project settings, add these environment variables:

```
JWT_SECRET = "your_super_secure_random_string_min_32_characters"
MONGODB_URI = "your_mongodb_connection_string"
FRONTEND_URL = "https://your-app-domain.vercel.app"
NODE_ENV = "production"
```

**How to generate a secure JWT_SECRET:**
```bash
# On your terminal, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Verify Build Configuration
The `vercel.json` file is correctly configured:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Step 3: Test Login Flow
1. **Locally (before deploying)**:
   - Create `.env` file in root with your MongoDB URI and a test JWT_SECRET
   - Create `.env.local` in `frontend/` with `VITE_API_URL=http://localhost:5000/api` (for dev)
   - Run: `cd backend && npm run dev`
   - Run: `cd frontend && npm run dev`
   - Test login with `admin@school.com` / `admin123`

2. **After deploying to Vercel**:
   - Clear browser cache and localStorage
   - Try logging in
   - Check browser console for any errors
   - Check Vercel function logs

### Step 4: Seed Database (First Time Only)
After deploying, call the seed endpoint once to populate test data:
```bash
curl https://your-app-domain.vercel.app/api/auth/seed
```

## Files Modified

1. ✅ `api/index.js` - Added JWT middleware and /api/auth/me endpoint
2. ✅ `backend/server.js` - Added JWT_SECRET validation and proper CORS
3. ✅ `.env.example` - Created environment variable documentation

## Testing Checklist

- [ ] Local login works with credentials
- [ ] Local login persists after refresh
- [ ] JWT token is stored in localStorage
- [ ] Vercel deployment has all env vars set
- [ ] Production login works
- [ ] Protected routes require valid token
- [ ] Invalid token redirects to login
- [ ] User session persists after page reload

## Common Issues & Solutions

**"Login failed" after deploying:**
- Check Vercel env variables are set (especially JWT_SECRET and MONGODB_URI)
- Check MONGODB_URI is correct and MongoDB allows connections from Vercel IPs
- Clear browser localStorage and try again

**"/api/auth/me returns 401":**
- Token is not being sent with Authorization header
- JWT_SECRET on Vercel doesn't match what was used to create token
- Token is expired

**CORS errors in console:**
- Update FRONTEND_URL environment variable on Vercel to match your domain
- Make sure VITE_API_URL is not set in frontend .env (should default to '/api')

**"Cannot find module" errors:**
- Run `npm install` in both backend and frontend directories
- Check Node.js version matches requirements
