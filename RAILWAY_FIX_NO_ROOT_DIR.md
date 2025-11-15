# Fix Railway Build Without Root Directory Setting

## Problem
Railway is detecting the root directory (has both `backend/` and `frontend/`), and you can't set the root directory in Railway settings.

## Solution: Use Build Scripts

I've created scripts that Railway will use to build and start from the `backend/` directory.

### Files Created:
- `railway.toml` - Railway configuration (in root)
- `build.sh` - Build script that changes to backend directory
- `start.sh` - Start script that changes to backend directory

### How It Works:
1. Railway detects the root directory
2. `railway.toml` tells Railway to use our custom build/start commands
3. Scripts change to `backend/` directory before running commands
4. Everything runs from the backend directory

---

## Alternative: Move Backend Files to Root (Not Recommended)

If scripts don't work, you could:
1. Move `backend/app/` → `app/`
2. Move `backend/requirements.txt` → `requirements.txt`
3. Move `backend/alembic/` → `alembic/`
4. Update all imports

**But this is messy - try the scripts first!**

---

## If Scripts Don't Work

### Option 1: Use Railway CLI
```bash
railway login
railway link
railway variables set WORKDIR=backend
```

### Option 2: Create Separate Repository
- Create a new GitHub repo just for backend
- Deploy that to Railway
- Keep frontend in current repo for Vercel

### Option 3: Use Dockerfile
Create a `Dockerfile` in root:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Test the Fix

After committing the scripts:
1. Push to GitHub
2. Railway should auto-redeploy
3. Check logs - should see:
   - `cd backend`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app...`

---

## Current Setup

Your `railway.toml` now has:
```toml
[build]
builder = "NIXPACKS"
buildCommand = "cd backend && pip install -r requirements.txt"

[deploy]
startCommand = "bash start.sh"
```

This should work! Railway will:
1. Run the build command (changes to backend, installs deps)
2. Run start.sh (changes to backend, starts uvicorn)

