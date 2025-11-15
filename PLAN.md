# FitDuo - Complete Implementation Plan

## Phase 0: Project Setup & Architecture

### Frontend Initialization
- Create `frontend/` directory with Vite + React + TypeScript template
- Install dependencies: `react-webcam`, `@mediapipe/tasks-vision`, Tailwind CSS
- Configure `tailwind.config.js` and `vite.config.js`
- Set up environment variables file (`.env`) for WebSocket server URL

### Backend Initialization
- Create `backend/` directory with Python virtual environment
- Create `requirements.txt` with: FastAPI, Uvicorn, SQLModel, PostgreSQL driver, Gemini SDK, WebSockets
- Set up `backend/app/` package structure with `__init__.py` files
- Create `backend/.env` for database URL and Gemini API key
- Configure `backend/app/config.py` for environment variable loading

### Database Setup
- Create `docker-compose.yml` at root for PostgreSQL service
- Set up database connection in `backend/app/database/connection.py` using SQLModel
- Initialize Alembic for migrations

### Project Configuration
- Create `.gitignore` covering Python, Node.js, and environment files
- Update `README.md` with setup instructions and architecture overview

## Phase 1: Frontend MVP - Local CV and UI Shell

### Core Components
- **`frontend/src/components/CameraFeed.tsx`**: Webcam access using `react-webcam`, video element with canvas overlay
- **`frontend/src/services/cv-detector.ts`**: MediaPipe Pose initialization and landmark extraction, rep detection logic (elbow angle calculation for push-ups)
- **`frontend/src/components/RepCounter.tsx`**: Local state counter that increments on successful rep cycle
- **`frontend/src/components/Scoreboard.tsx`**: Display component for Player A (self) and Player B (opponent) scores
- **`frontend/src/components/BattleView.tsx`**: Main container with side-by-side scoreboards, camera feed, and rep counter

### WebSocket Client Stub
- **`frontend/src/services/websocket.ts`**: WebSocket client class with connection management, message schemas (REP_INCREMENT), placeholder connection to localhost

### TypeScript Types
- **`frontend/src/types/game.ts`**: Interfaces for GameState, Player, RepEvent, WebSocketMessage

### Styling
- Configure Tailwind for responsive layout (desktop and mobile)
- Style BattleView with modern, competitive UI

## Phase 2: Backend MVP - Game Logic and WebSockets

### Database Models (SQLModel)
- **`backend/app/models/user.py`**: User model with id, username, profile data
- **`backend/app/models/exercise.py`**: Exercise model with id, name, category (push, pull, core, etc.)
- **`backend/app/models/game_session.py`**: GameSession with match_id, player_a_id, player_b_id, scores, current_round, status

### FastAPI Application
- **`backend/app/main.py`**: FastAPI app initialization with CORS middleware, include routers
- **`backend/app/routers/match.py`**: REST endpoint `POST /match/create` to create new game sessions
- **`backend/app/routers/websocket.py`**: WebSocket handler `/ws/{game_id}` with connection manager, active player mapping, message routing

### Real-Time Game Logic
- **`backend/app/services/game_logic.py`**: `handle_rep_increment()` function that updates DB score and broadcasts to opponent via WebSocket
- Round end detection logic that determines loser and updates game state
- WebSocket message broadcasting to all connected players in a game

### Database Migrations
- Initialize Alembic: `alembic init alembic`
- Create initial migration for User, Exercise, GameSession tables

## Phase 3: AI Core Integration - The Brain

### LLM Service
- **`backend/app/services/llm_service.py`**: Async Gemini API client using `google.generativeai`
- **`generate_form_rules(exercise_name)`**: Returns JSON schema with 3 essential form rules (e.g., `{"elbow_angle": {"min": 90}}`)
- **`recommend_strategy(player_a_score, player_b_score, player_b_weakness)`**: Returns recommended Exercise ID and rationale for next round
- **`generate_narrative(round_result)`**: Returns commentary text for TTS
- Error handling with fallback to deterministic exercise selection if API fails

### Integration Points
- Form rules sent to frontend via WebSocket on exercise selection
- Strategy recommendation sent after round end
- Narrative text sent for TTS playback

### Configuration
- Add Gemini API key to `backend/.env`
- Add rate limiting and retry logic for API calls

## Phase 4: Advanced Features & Deployment Readiness

### Hype Generator (Narrative)
- **`frontend/src/services/tts.ts`**: Browser TTS API integration to read LLM-generated narrative
- Trigger TTS on receiving narrative message via WebSocket

### Dynamic Difficulty
- **`backend/app/services/game_logic.py`**: Add handicap logic using BattleHistory
- LLM-based difficulty adjustment for dominant players
- Update game state with difficulty modifiers

### Static Holds Logic
- **`frontend/src/services/cv-detector.ts`**: Extend CV logic for time-based challenges (Plank, Wall Sit)
- Monitor pose stability over time, track duration
- Send HOLD_DURATION updates via WebSocket

### Deployment Preparation
- **`backend/Dockerfile`**: Multi-stage Docker build for FastAPI app
- **`docker-compose.yml`**: Add backend service, update for production
- **`backend/app/config.py`**: Environment-based configuration (dev/prod)
- Add health check endpoints
- Update README with deployment instructions

### Testing & Documentation
- Add API documentation via FastAPI's automatic OpenAPI docs
- Create example `.env.example` files for both frontend and backend
- Document WebSocket message protocol

