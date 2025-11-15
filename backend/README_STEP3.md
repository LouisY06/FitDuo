# Step 3: Database Setup and Models ✅

## What We Built

1. **Database Connection** (`app/database/connection.py`)
   - SQLModel engine setup
   - SQLite for local development (defaults to `contender.db`)
   - PostgreSQL support via `DATABASE_URL` environment variable
   - Session dependency for FastAPI

2. **Database Models** (`app/models/`)
   - **User**: Linked to Firebase Authentication via `firebase_uid`
   - **Exercise**: Defines available exercises with categories
   - **GameSession**: Tracks battles between two players

3. **Alembic Migrations**
   - Configured to work with SQLModel
   - Initial migration created for all tables

4. **Database Test Endpoint**
   - `GET /db/test` - Verifies database connection and model operations

## How to Test

### 1. Start the server:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test the database endpoint:

```bash
curl http://localhost:8000/db/test
```

Expected response:
```json
{
  "status": "success",
  "database_connected": true,
  "tables_created": true,
  "counts": {
    "users": 0,
    "exercises": 1,
    "game_sessions": 0
  },
  "test_exercise_created": true,
  "test_exercise_id": 1
}
```

**Run automated tests:**
```bash
cd backend
source venv/bin/activate
pip install requests  # if not already installed
python test_step3.py
```

### 3. Verify Database File Created

Check that `contender.db` was created:
```bash
ls -lh backend/contender.db
```

### 4. Test Database Operations

You can also test directly with Python:
```python
from app.database.connection import get_session
from app.models import Exercise
from sqlmodel import select

session = next(get_session())
exercises = session.exec(select(Exercise)).all()
print(f"Found {len(exercises)} exercises")
```

## Database Models

### User
- `id`: Primary key (auto-increment)
- `firebase_uid`: Unique Firebase Authentication UID (indexed)
- `username`: User's display name
- `email`: Optional email
- `created_at`: Timestamp
- `profile_data`: Optional JSON string for additional data

### Exercise
- `id`: Primary key (auto-increment)
- `name`: Exercise name (unique, indexed)
- `category`: Exercise category - "push", "pull", "core", "legs", "cardio" (indexed)
- `description`: Optional description
- `is_static_hold`: Boolean - true for time-based exercises (Plank, Wall Sit)

### GameSession
- `id`: Primary key (auto-increment)
- `player_a_id`: Foreign key to User
- `player_b_id`: Foreign key to User
- `player_a_score`: Current score for player A
- `player_b_score`: Current score for player B
- `current_round`: Current round number
- `status`: Game status - "waiting", "active", "round_end", "finished"
- `current_exercise_id`: Foreign key to Exercise (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Database Migrations

### Run migrations:
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### Create new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

### View migration history:
```bash
alembic history
```

## Switching to PostgreSQL

When ready to use PostgreSQL (for production):

1. Set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. Install PostgreSQL driver:
   ```bash
   pip install psycopg2-binary
   ```

3. Update `requirements.txt` to include `psycopg2-binary`

4. Run migrations:
   ```bash
   alembic upgrade head
   ```

## Files Created

- `backend/app/database/connection.py` - Database connection and session management
- `backend/app/models/__init__.py` - Model exports
- `backend/app/models/user.py` - User model
- `backend/app/models/exercise.py` - Exercise model
- `backend/app/models/game_session.py` - GameSession model
- `backend/alembic/` - Migration directory
- `backend/alembic.ini` - Alembic configuration
- `backend/test_step3.py` - Test script
- `backend/contender.db` - SQLite database file (created on first run)

## Next Step

Once this is working, we'll move to Step 4: Creating REST API endpoints for matches and exercises.

