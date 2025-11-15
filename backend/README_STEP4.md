# Step 4: REST API Endpoints ✅

## What We Built

1. **Exercise Router** (`app/routers/exercise.py`)
   - `GET /api/exercises` - List all exercises (with optional category filter)
   - `GET /api/exercises/{exercise_id}` - Get a specific exercise
   - `POST /api/exercises` - Create a new exercise

2. **Match Router** (`app/routers/match.py`)
   - `POST /api/matches` - Create a new game session/match
   - `GET /api/matches/{match_id}` - Get a specific match
   - `GET /api/matches` - List all matches (with optional filters)

3. **Router Integration**
   - Routers integrated into main FastAPI app
   - Proper error handling with HTTP exceptions
   - Pydantic models for request/response validation

## How to Test

### 1. Start the server:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test Exercise Endpoints:

**List all exercises:**
```bash
curl http://localhost:8000/api/exercises
```

**Get specific exercise:**
```bash
curl http://localhost:8000/api/exercises/1
```

**Create new exercise:**
```bash
curl -X POST http://localhost:8000/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pull-up",
    "category": "pull",
    "description": "Bodyweight pull-up",
    "is_static_hold": false
  }'
```

**Filter by category:**
```bash
curl http://localhost:8000/api/exercises?category=push
```

### 3. Test Match Endpoints:

**List all matches:**
```bash
curl http://localhost:8000/api/matches
```

**Create a match (requires users to exist):**
```bash
curl -X POST http://localhost:8000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "player_a_id": 1,
    "player_b_id": 2,
    "exercise_id": 1
  }'
```

**Get specific match:**
```bash
curl http://localhost:8000/api/matches/1
```

**Filter matches by player:**
```bash
curl http://localhost:8000/api/matches?player_id=1
```

**Filter matches by status:**
```bash
curl http://localhost:8000/api/matches?status=waiting
```

### 4. Run Automated Tests:

```bash
cd backend
source venv/bin/activate
pip install requests  # if not already installed
python test_step4.py
```

### 5. View API Documentation:

FastAPI automatically generates interactive API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints Summary

### Exercises

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | List all exercises |
| GET | `/api/exercises?category={category}` | Filter by category |
| GET | `/api/exercises/{id}` | Get specific exercise |
| POST | `/api/exercises` | Create new exercise |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | List all matches |
| GET | `/api/matches?player_id={id}` | Filter by player |
| GET | `/api/matches?status={status}` | Filter by status |
| GET | `/api/matches/{id}` | Get specific match |
| POST | `/api/matches` | Create new match |

## Request/Response Examples

### Create Exercise Request
```json
{
  "name": "Wall Sit",
  "category": "legs",
  "description": "Hold wall sit position",
  "is_static_hold": true
}
```

### Create Match Request
```json
{
  "player_a_id": 1,
  "player_b_id": 2,
  "exercise_id": 1
}
```

### Match Response
```json
{
  "id": 1,
  "player_a_id": 1,
  "player_b_id": 2,
  "player_a_score": 0,
  "player_b_score": 0,
  "current_round": 1,
  "status": "waiting",
  "current_exercise_id": 1,
  "created_at": "2025-11-15T12:00:00"
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (e.g., duplicate exercise name)
- `404` - Not Found (e.g., exercise/match/user not found)

Example error response:
```json
{
  "detail": "Exercise not found"
}
```

## Files Created

- `backend/app/routers/__init__.py` - Router package marker
- `backend/app/routers/exercise.py` - Exercise endpoints
- `backend/app/routers/match.py` - Match endpoints
- `backend/test_step4.py` - Test script

## Files Modified

- `backend/app/main.py` - Added router includes

## Next Step

Once this is working, we'll move to Step 5: WebSocket setup for real-time game communication.

