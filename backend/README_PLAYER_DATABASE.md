# Player Database Configuration

This document describes the database setup for individual player data in FitDuo.

## Overview

The player database system consists of three main tables plus enhanced User model fields:

1. **PlayerStats** - Tracks individual player performance metrics
2. **PlayerWorkout** - Records individual workout sessions
3. **PlayerPreferences** - Stores player settings and preferences
4. **User** (enhanced) - Additional player profile fields

## Database Models

### User Model (Enhanced)

The `User` model has been extended with player-specific fields:

```python
- display_name: Optional[str]  # Optional display name
- avatar_url: Optional[str]  # Profile picture URL
- bio: Optional[str]  # Player bio/description
- level: int (default=1)  # Player level
- experience_points: int (default=0)  # XP points
- is_active: bool (default=True)
- is_online: bool (default=False)
- last_seen_at: Optional[datetime]
- updated_at: datetime
```

### PlayerStats Model

Tracks comprehensive player statistics:

**Game Statistics:**
- `total_games`: Total games played
- `games_won`: Games won
- `games_lost`: Games lost
- `games_tied`: Games tied
- `win_rate`: Calculated win rate (games_won / total_games)
- `current_win_streak`: Current consecutive wins
- `longest_win_streak`: Best win streak

**Exercise Statistics:**
- `total_reps`: Total reps across all exercises
- `total_workouts`: Total workout sessions
- `total_workout_time`: Total time in seconds
- `current_workout_streak`: Days in a row with workouts
- `longest_workout_streak`: Best workout streak

**Best Scores (Rep-based):**
- `best_pushups`: Best push-up count
- `best_squats`: Best squat count
- `best_pullups`: Best pull-up count
- `best_burpees`: Best burpee count

**Best Times (Time-based, in seconds):**
- `best_plank_time`: Best plank duration
- `best_wall_sit_time`: Best wall sit duration

**Timestamps:**
- `last_workout_at`: Last workout timestamp
- `last_game_at`: Last game timestamp
- `updated_at`: Last update timestamp
- `created_at`: Creation timestamp

### PlayerWorkout Model

Records individual workout sessions:

- `user_id`: Foreign key to User
- `exercise_id`: Foreign key to Exercise (optional)
- `exercise_name`: Denormalized exercise name
- `exercise_category`: Denormalized category
- `reps`: Rep count (for rep-based exercises)
- `duration_seconds`: Duration (for time-based exercises)
- `score`: Calculated score for the workout
- `workout_type`: "solo", "battle", or "practice"
- `game_session_id`: Foreign key to GameSession (if part of a battle)
- `form_rating`: Optional form rating (0.0 to 1.0) from CV detection
- `notes`: Optional workout notes
- `completed_at`: Workout completion timestamp

### PlayerPreferences Model

Stores player settings:

**Notification Settings:**
- `email_notifications`: Email notifications enabled
- `push_notifications`: Push notifications enabled
- `match_notifications`: Match notifications enabled
- `achievement_notifications`: Achievement notifications enabled

**Privacy Settings:**
- `profile_visibility`: "public", "friends", or "private"
- `show_stats`: Show statistics publicly
- `show_workout_history`: Show workout history publicly

**Game Preferences:**
- `preferred_exercises`: JSON array of exercise IDs
- `difficulty_level`: "easy", "medium", "hard", or "expert"
- `auto_match`: Auto-match with other players

**Workout Preferences:**
- `default_workout_duration`: Default duration in minutes
- `rest_time_between_exercises`: Rest time in seconds
- `enable_cv_detection`: Enable computer vision form detection

**Display Preferences:**
- `units`: "metric" or "imperial"
- `theme`: "light", "dark", or "auto"
- `language`: Language code (e.g., "en")

## API Endpoints

All endpoints are under `/api/player` and require authentication.

### Statistics

**GET `/api/player/stats`**
- Get current player's statistics
- Returns: `PlayerStatsResponse` with all stats, level, and XP

### Workout History

**GET `/api/player/workouts`**
- Get player's workout history
- Query parameters:
  - `limit`: Number of results (1-100, default: 50)
  - `offset`: Pagination offset (default: 0)
  - `exercise_id`: Filter by exercise (optional)
  - `workout_type`: Filter by type (optional)
- Returns: List of `WorkoutResponse`

**POST `/api/player/workouts`**
- Record a new workout
- Body parameters:
  - `exercise_id`: Exercise ID (optional)
  - `exercise_name`: Exercise name (required if no exercise_id)
  - `exercise_category`: Exercise category (required if no exercise_id)
  - `reps`: Rep count (for rep-based)
  - `duration_seconds`: Duration (for time-based)
  - `score`: Workout score
  - `workout_type`: "solo", "battle", or "practice"
  - `game_session_id`: Game session ID (if part of battle)
  - `form_rating`: Form rating (0.0-1.0)
  - `notes`: Optional notes
- Automatically updates player stats and XP
- Returns: `{"message": "Workout recorded", "workout_id": <id>}`

### Preferences

**GET `/api/player/preferences`**
- Get player preferences
- Returns: `PreferencesResponse`

**PUT `/api/player/preferences`**
- Update player preferences
- Body: `UpdatePreferencesRequest` (all fields optional)
- Returns: Updated `PreferencesResponse`

## Database Migration

The migration has been created and can be applied:

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

## Usage Examples

### Recording a Workout

```python
# Example: Record a push-up workout
POST /api/player/workouts
{
  "exercise_name": "Push-up",
  "exercise_category": "push",
  "reps": 50,
  "score": 50,
  "workout_type": "solo",
  "form_rating": 0.85
}
```

This will:
1. Create a `PlayerWorkout` record
2. Update `PlayerStats`:
   - Increment `total_workouts`
   - Add to `total_reps`
   - Update `best_pushups` if this is a new record
   - Update workout streak
3. Add 10 XP to the user
4. Recalculate user level

### Getting Player Stats

```python
GET /api/player/stats
Authorization: Bearer <firebase_token>

Response:
{
  "user_id": 1,
  "total_games": 10,
  "games_won": 7,
  "games_lost": 2,
  "games_tied": 1,
  "win_rate": 0.7,
  "total_reps": 500,
  "total_workouts": 25,
  "best_pushups": 50,
  "current_win_streak": 3,
  "level": 2,
  "experience_points": 250,
  ...
}
```

### Updating Preferences

```python
PUT /api/player/preferences
{
  "difficulty_level": "hard",
  "enable_cv_detection": true,
  "theme": "dark"
}
```

## Automatic Features

1. **Win Rate Calculation**: Automatically calculated when stats are retrieved
2. **Workout Streak**: Automatically updated when workouts are recorded
3. **Best Scores**: Automatically updated when new records are set
4. **Level Calculation**: Level = (XP / 1000) + 1
5. **XP Rewards**: 10 XP per workout (can be customized)

## Database Relationships

```
User (1) ──< (1) PlayerStats
User (1) ──< (*) PlayerWorkout
User (1) ──< (1) PlayerPreferences
PlayerWorkout (*) ──> (1) Exercise (optional)
PlayerWorkout (*) ──> (1) GameSession (optional)
```

## Next Steps

1. ✅ Database models created
2. ✅ API endpoints implemented
3. ✅ Migration created
4. ⏳ Integration with game logic (update stats when games end)
5. ⏳ Integration with frontend
6. ⏳ Add more XP calculation logic (based on performance)
7. ⏳ Add achievements system
8. ⏳ Add leaderboards based on stats

## Testing

Test the endpoints:

```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Get stats (requires auth token)
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/player/stats

# Record a workout (requires auth token)
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"exercise_name": "Push-up", "exercise_category": "push", "reps": 30, "score": 30}' \
  http://localhost:8000/api/player/workouts
```

