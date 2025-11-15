# ✅ Backend Engineer Workspace

## 🎯 Your Domain: Files You CAN and SHOULD Modify

This document outlines the files and directories that **backend engineers are responsible for** and should work with.

---

## 📁 Backend Directory Structure

### ✅ Main Application Code (`backend/app/`)

#### Routers (`backend/app/routers/`)
**Status:** ✅ **YOUR WORKSPACE** - API endpoints you control

- `auth.py` - Authentication endpoints
  - `/api/auth/login`
  - `/api/auth/signup`
  - `/api/auth/forgot-password`
  
- `exercise.py` - Exercise-related endpoints
  
- `match.py` - Match/game session endpoints
  
- `websocket.py` - WebSocket connections for real-time communication
  
- `llm.py` - LLM service integration endpoints

#### Models (`backend/app/models/`)
**Status:** ✅ **YOUR WORKSPACE** - Database models

- `user.py` - User model
- `exercise.py` - Exercise model
- `game_session.py` - Game session model

#### Services (`backend/app/services/`)
**Status:** ✅ **YOUR WORKSPACE** - Business logic

- `llm_service.py` - LLM integration service
- `game_logic.py` - Game logic and rules
- `connection_manager.py` - WebSocket connection management

#### Middleware (`backend/app/middleware/`)
**Status:** ✅ **YOUR WORKSPACE** - Authentication and middleware

- `auth.py` - Authentication middleware

#### Configuration (`backend/app/`)
**Status:** ✅ **YOUR WORKSPACE**

- `main.py` - FastAPI application setup
- `config.py` - Configuration and environment variables
- `database/connection.py` - Database connection setup

---

### ✅ Database Migrations (`backend/alembic/`)

**Status:** ✅ **YOUR WORKSPACE**

- `alembic.ini` - Alembic configuration
- `env.py` - Alembic environment setup
- `versions/` - Migration scripts
  - Create new migrations here as needed

---

### ✅ Dependencies and Configuration

**Status:** ✅ **YOUR WORKSPACE**

- `backend/requirements.txt` - Python package dependencies
- `backend/config/` - Configuration files
  - `README_FIREBASE.md` - Firebase configuration docs

---

### ✅ Tests (`backend/`)

**Status:** ✅ **YOUR WORKSPACE**

- `test_step1.py` through `test_step8.py` - Test scripts
- Create additional test files as needed

---

### ✅ Documentation (`backend/`)

**Status:** ✅ **YOUR WORKSPACE**

- `README_STEP1.md` through `README_STEP8.md` - Step-by-step documentation
- Create additional backend documentation as needed

---

## 🔴 What You Should NOT Modify

### ❌ Frontend Directory (`frontend/`)
**See:** `../FRONTEND_ONLY_DO_NOT_TOUCH.md` for complete list

Key exclusions:
- All React components
- All TypeScript/JavaScript files
- Frontend configuration files (package.json, vite.config.ts, etc.)
- Computer vision code (runs client-side)
- Frontend authentication client code

---

## 🔵 API Contract - Your Interface with Frontend

### REST API Endpoints

You control these endpoints in `backend/app/routers/`:

#### Authentication (`auth.py`)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Password reset

**Response Format:**
```json
{
  "token": "string (optional)",
  "user": {
    "id": number,
    "email": "string",
    "username": "string"
  },
  "message": "string (optional)"
}
```

#### Exercise Endpoints (`exercise.py`)
- Define exercise-related endpoints here

#### Match Endpoints (`match.py`)
- Define game session/match endpoints here

#### LLM Endpoints (`llm.py`)
- Define LLM service endpoints here

### WebSocket Connections (`websocket.py`)

Real-time communication for:
- Rep counting updates
- Game state synchronization
- Player actions

**WebSocket Message Format:**
- Define message schemas in your WebSocket handler
- Ensure consistency with frontend expectations

---

## 📝 Best Practices

### 1. API Changes
- ✅ Modify endpoint logic in `backend/app/routers/`
- ✅ Update response schemas as needed
- ⚠️ **Communicate breaking changes** to frontend team
- ❌ Don't modify how frontend calls your APIs

### 2. Database Changes
- ✅ Create migrations in `backend/alembic/versions/`
- ✅ Update models in `backend/app/models/`
- ✅ Run migrations: `alembic upgrade head`

### 3. Environment Variables
- ✅ Modify `backend/app/config.py`
- ✅ Update `.env` file (not in git)
- ⚠️ Document required environment variables

### 4. Testing
- ✅ Write tests in `backend/test_*.py` files
- ✅ Test API endpoints directly
- ✅ Test WebSocket connections

---

## 🚀 Development Workflow

1. **Make changes** in `backend/app/` directories
2. **Update API documentation** if endpoints change
3. **Run tests** to verify changes
4. **Test with frontend** via API calls
5. **Commit changes** to backend code only

---

## 🔍 Quick Reference

| Task | Location | Action |
|------|----------|--------|
| Add API endpoint | `backend/app/routers/` | ✅ Modify |
| Update database model | `backend/app/models/` | ✅ Modify |
| Change business logic | `backend/app/services/` | ✅ Modify |
| Update dependencies | `backend/requirements.txt` | ✅ Modify |
| Change frontend UI | `frontend/src/components/` | ❌ **Don't touch** |
| Modify CV detection | `frontend/cv/` | ❌ **Don't touch** |
| Update frontend config | `frontend/vite.config.ts` | ❌ **Don't touch** |

---

## 📞 Need Frontend Changes?

If you need frontend functionality changes:

1. **Document the requirement** clearly
2. **Specify API changes** you'll make
3. **Coordinate with frontend developers**
4. **Wait for frontend team** to implement

**Never modify frontend code yourself.**

---

**Remember:** Your domain is `backend/` - stay in your lane! 🎯

