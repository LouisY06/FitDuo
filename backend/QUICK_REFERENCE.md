# ⚡ Quick Reference for Backend Engineers

## ✅ Your Workspace
- `backend/app/routers/` - API endpoints
- `backend/app/models/` - Database models  
- `backend/app/services/` - Business logic
- `backend/app/middleware/` - Auth middleware
- `backend/alembic/` - Database migrations

## ❌ DO NOT TOUCH
- `frontend/` - Entire frontend directory
- All React/TypeScript files
- Frontend configuration files
- Computer Vision code

## 📚 Full Documentation
- **Your workspace:** See `BACKEND_WORKSPACE.md` in this directory
- **Files to avoid:** See `../FRONTEND_ONLY_DO_NOT_TOUCH.md` at project root

## 🔗 API Contract
The only connection between frontend and backend:
- REST endpoints in `backend/app/routers/`
- WebSocket in `backend/app/routers/websocket.py`
- Environment variables (backend config only)

## 💡 Rule of Thumb
**If it's not in `backend/`, don't modify it!**

