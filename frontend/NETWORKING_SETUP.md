# Frontend Networking Setup

This document describes the networking infrastructure for connecting the frontend to the backend API.

## Architecture

### Base API Layer (`services/api.ts`)

Provides a centralized way to make authenticated API requests:

```typescript
import { apiGet, apiPost, apiPut } from "../services/api";

// GET request
const data = await apiGet<MyType>("/api/endpoint");

// POST request
const result = await apiPost<ResponseType>("/api/endpoint", { data });

// PUT request
const updated = await apiPut<ResponseType>("/api/endpoint", { updates });
```

**Features:**
- Automatic Firebase token injection
- Token refresh handling
- Error handling with typed errors
- 401 handling (session expiration)

### Player Service (`services/player.ts`)

Service layer for all player-related endpoints:

```typescript
import { 
  getPlayerStats, 
  getWorkoutHistory, 
  createWorkout,
  getPlayerPreferences,
  updatePlayerPreferences 
} from "../services/player";

// Get player statistics
const stats = await getPlayerStats();

// Get workout history
const workouts = await getWorkoutHistory({ limit: 10, exercise_id: 1 });

// Create a workout
await createWorkout({
  exercise_name: "Push-up",
  exercise_category: "push",
  reps: 30,
  score: 30,
  workout_type: "solo"
});

// Get/update preferences
const prefs = await getPlayerPreferences();
await updatePlayerPreferences({ theme: "dark", difficulty_level: "hard" });
```

## React Hooks

### `usePlayerStats`

Hook for fetching and managing player statistics:

```tsx
import { usePlayerStats } from "../hooks/usePlayerStats";

function MyComponent() {
  const { stats, loading, error, refetch } = usePlayerStats();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Level: {stats?.level}</p>
      <p>XP: {stats?.experience_points}</p>
      <p>Total Workouts: {stats?.total_workouts}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### `useWorkoutHistory`

Hook for fetching workout history with filtering:

```tsx
import { useWorkoutHistory } from "../hooks/useWorkoutHistory";

function WorkoutList() {
  const { workouts, loading, error, refetch } = useWorkoutHistory({
    limit: 20,
    exercise_id: 1, // Optional filter
    workout_type: "solo" // Optional filter
  });

  return (
    <ul>
      {workouts.map(workout => (
        <li key={workout.id}>
          {workout.exercise_name}: {workout.reps} reps
        </li>
      ))}
    </ul>
  );
}
```

### `usePlayerPreferences`

Hook for managing player preferences:

```tsx
import { usePlayerPreferences } from "../hooks/usePlayerPreferences";

function Settings() {
  const { preferences, loading, updating, update } = usePlayerPreferences();

  const handleThemeChange = async (theme: string) => {
    try {
      await update({ theme });
      // Preferences automatically updated
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  return (
    <select 
      value={preferences?.theme} 
      onChange={(e) => handleThemeChange(e.target.value)}
      disabled={updating}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">Auto</option>
    </select>
  );
}
```

## Error Handling

All services throw `ApiError` objects:

```typescript
interface ApiError {
  message: string;
  status?: number;
}
```

Example error handling:

```typescript
try {
  const stats = await getPlayerStats();
} catch (error) {
  if (error.status === 401) {
    // Session expired - redirect to login
    window.location.href = "/login";
  } else if (error.status === 404) {
    // Resource not found
    console.error("Stats not found");
  } else {
    // Other errors
    console.error("Error:", error.message);
  }
}
```

## Environment Configuration

Set the API URL in `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

For production:

```env
VITE_API_URL=https://api.yourdomain.com
```

## API Endpoints

### Player Statistics
- `GET /api/player/stats` - Get player statistics

### Workout History
- `GET /api/player/workouts` - Get workout history
  - Query params: `limit`, `offset`, `exercise_id`, `workout_type`
- `POST /api/player/workouts` - Create a workout

### Player Preferences
- `GET /api/player/preferences` - Get preferences
- `PUT /api/player/preferences` - Update preferences

## TypeScript Types

All types are exported from `services/player.ts`:

```typescript
import type {
  PlayerStats,
  Workout,
  PlayerPreferences,
  CreateWorkoutRequest,
  UpdatePreferencesRequest,
} from "../services/player";
```

## Example: Complete Component

```tsx
import { useState } from "react";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { createWorkout } from "../services/player";

export function WorkoutTracker() {
  const { stats, loading, refetch } = usePlayerStats();
  const [recording, setRecording] = useState(false);

  const handleRecordWorkout = async () => {
    setRecording(true);
    try {
      await createWorkout({
        exercise_name: "Push-up",
        exercise_category: "push",
        reps: 30,
        score: 30,
        workout_type: "solo",
      });
      // Refresh stats to show updated totals
      await refetch();
    } catch (error) {
      console.error("Failed to record workout:", error);
    } finally {
      setRecording(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Your Stats</h2>
      <p>Level: {stats?.level}</p>
      <p>Total Workouts: {stats?.total_workouts}</p>
      <p>Total Reps: {stats?.total_reps}</p>
      
      <button onClick={handleRecordWorkout} disabled={recording}>
        {recording ? "Recording..." : "Record Workout"}
      </button>
    </div>
  );
}
```

## Next Steps

1. ✅ Base API utility created
2. ✅ Player service created
3. ✅ React hooks created
4. ⏳ Integrate into existing components
5. ⏳ Add WebSocket support for real-time updates (if needed)
6. ⏳ Add caching/state management (if needed)

