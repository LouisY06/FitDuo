# Step 1: Basic FastAPI App ✅

## What We Built

A minimal FastAPI application with two endpoints:
- `GET /` - Root endpoint that returns API status
- `GET /health` - Health check endpoint

## How to Test

### 1. Start the server:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test the endpoints:

**Option A: Using curl**
```bash
# Test root endpoint
curl http://localhost:8000/

# Test health endpoint
curl http://localhost:8000/health
```

**Option B: Using the test script**
```bash
# Make sure server is running, then:
cd backend
source venv/bin/activate
pip install requests  # if not already installed
python test_step1.py
```

**Option C: Using browser**
- Open http://localhost:8000/ in your browser
- Open http://localhost:8000/health in your browser

### 3. Expected Results

- Root endpoint should return: `{"message": "The Contender API", "status": "running"}`
- Health endpoint should return: `{"status": "healthy"}`

## Files Created

- `backend/app/__init__.py` - Package marker
- `backend/app/main.py` - FastAPI application
- `backend/requirements.txt` - Dependencies (FastAPI, Uvicorn, python-dotenv)
- `backend/test_step1.py` - Test script

## Next Step

Once this is working, we'll move to Step 2: Adding CORS and configuration management.

