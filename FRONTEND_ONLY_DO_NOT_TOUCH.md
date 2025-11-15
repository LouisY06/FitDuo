# ⚠️ FRONTEND ONLY - DO NOT MODIFY

## 🔴 IMPORTANT: Backend Engineers Should NOT Modify These Files

This document lists all frontend-specific files and directories that **backend engineers should NOT modify** during the coding process. These files are managed exclusively by frontend developers.

---

## 📁 Complete Directory Structure (DO NOT MODIFY)

### Entire Frontend Directory
```
frontend/
```
**Status:** ❌ **DO NOT TOUCH** - Entire directory is frontend-only

---

## 📄 Specific Files and Directories

### 1. Frontend Source Code (`frontend/src/`)
**Status:** ❌ **DO NOT MODIFY**

#### Components (`frontend/src/components/`)
- `App.tsx` - Main React application component
- `LoginPage.tsx` - Authentication UI components
- `WorkoutDiscovery.tsx` - Workout selection UI
- `FitnessTrackerScreen.tsx` - Fitness tracking UI
- `BottomNavBar.tsx` - Navigation component
- `VantaBackground.tsx` - Visual background effects

#### Core Application Files
- `frontend/src/main.tsx` - React application entry point
- `frontend/src/App.css` - Application styles
- `frontend/src/index.css` - Global styles

#### Types (`frontend/src/types/`)
- `vanta.d.ts` - TypeScript type definitions for Vanta.js

#### Assets (`frontend/src/assets/`)
- All image, icon, and asset files

---

### 2. Computer Vision Module (`frontend/cv/`)
**Status:** ❌ **DO NOT MODIFY** - Entire module is frontend-only

#### CV Services (`frontend/cv/services/`)
- `cv-detector.ts` - Computer vision detection service
- `cv-setup.ts` - CV initialization and setup
- `cv-detector.example.tsx` - Example implementation

#### CV Hooks (`frontend/cv/hooks/`)
- `useCVDetector.ts` - React hook for CV detection

#### CV Types (`frontend/cv/types/`)
- `cv.ts` - TypeScript types for CV functionality

#### CV Auth (`frontend/cv/auth.ts`)
- `auth.ts` - Frontend authentication client (API calls to backend)

#### CV Documentation
- `CV_INTEGRATION.md` - CV integration documentation
- `README_CV.md` - CV module README

---

### 3. Frontend Configuration Files
**Status:** ❌ **DO NOT MODIFY**

- `frontend/package.json` - Node.js dependencies and scripts
- `frontend/package-lock.json` - Dependency lock file
- `frontend/vite.config.ts` - Vite build tool configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tsconfig.app.json` - TypeScript app configuration
- `frontend/tsconfig.node.json` - TypeScript node configuration
- `frontend/eslint.config.js` - ESLint configuration
- `frontend/index.html` - HTML entry point

---

### 4. Frontend Public Assets (`frontend/public/`)
**Status:** ❌ **DO NOT MODIFY**

- All static assets (images, icons, favicons, etc.)

---

### 5. Frontend Node Modules (`frontend/node_modules/`)
**Status:** ❌ **DO NOT MODIFY**

- Automatically generated dependency directory

---

### 6. Frontend Documentation
**Status:** ⚠️ **READ ONLY** - For reference only

- `frontend/README.md` - Frontend setup and documentation

---

## 🔵 What Backend Engineers SHOULD Work With

### Backend Directory (`backend/`)
✅ **Your workspace** - All Python/FastAPI code:
- `backend/app/` - Main application code
- `backend/app/routers/` - API endpoints
- `backend/app/models/` - Database models
- `backend/app/services/` - Business logic
- `backend/app/middleware/` - Auth and middleware
- `backend/requirements.txt` - Python dependencies
- `backend/alembic/` - Database migrations

### Root Level Files
✅ **Can modify**:
- `README.md` - Project documentation (coordinate with team)
- `PLAN.md` - Project planning (coordinate with team)

---

## 🚨 API Contract - The Only Connection Point

The **ONLY** interface between frontend and backend is through:

1. **REST API Endpoints** (`backend/app/routers/`)
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/auth/forgot-password`
   - Exercise endpoints
   - Match endpoints
   - LLM endpoints

2. **WebSocket Connections** (`backend/app/routers/websocket.py`)
   - Real-time game synchronization
   - Rep counting updates

3. **Environment Variables**
   - `VITE_API_URL` - Frontend uses this to connect to backend

**✅ Backend engineers should:**
- Modify API endpoints in `backend/app/routers/`
- Update API response schemas
- Adjust WebSocket message formats
- Update backend environment variables

**❌ Backend engineers should NOT:**
- Modify frontend code that calls these APIs
- Change frontend UI components
- Update frontend configuration files
- Modify CV detection logic (it's client-side only)

---

## 📝 Quick Reference Checklist

Before modifying any file, ask:
- [ ] Is this file in the `backend/` directory? → ✅ **OK to modify**
- [ ] Is this file in the `frontend/` directory? → ❌ **DO NOT MODIFY**
- [ ] Am I changing API response formats? → ✅ **OK** (but coordinate with frontend team)
- [ ] Am I changing frontend UI/UX? → ❌ **DO NOT MODIFY**

---

## 🤝 Coordination Guidelines

If you need changes to frontend functionality:

1. **Document the API changes** in backend documentation
2. **Update API response schemas** with clear examples
3. **Communicate with frontend team** about breaking changes
4. **Provide migration guides** for API updates

**Never modify frontend code directly** - coordinate with frontend developers instead.

---

## 📞 Questions?

If you're unsure whether a file should be modified:
- Check this document first
- Consult with frontend developers
- When in doubt, **don't modify it**

---

**Last Updated:** 2024
**Maintained By:** Development Team

---

## 📌 Quick Reference Card

Copy this and keep it visible:

```
❌ DO NOT MODIFY:
   - frontend/ (entire directory)
   - All React/TypeScript files
   - Frontend config files
   - CV module

✅ YOUR WORKSPACE:
   - backend/ (entire directory)
   - API endpoints
   - Database models
   - Business logic
```

For details, see `FRONTEND_ONLY_DO_NOT_TOUCH.md` at project root.

