# Frontend Services

This directory contains all API service layers for communicating with the backend.

## Services

### `api.ts`
Base API utility for making authenticated requests. Provides:
- `apiGet<T>()` - GET requests
- `apiPost<T>()` - POST requests
- `apiPut<T>()` - PUT requests
- `apiDelete<T>()` - DELETE requests
- Automatic token management
- Error handling

### `auth.ts`
Authentication service for Firebase Auth and backend sync.

### `player.ts`
Player service for:
- Player statistics (`getPlayerStats()`)
- Workout history (`getWorkoutHistory()`, `createWorkout()`)
- Player preferences (`getPlayerPreferences()`, `updatePlayerPreferences()`)

## React Hooks

### `usePlayerStats`
Hook for fetching player statistics:
```tsx
const { stats, loading, error, refetch } = usePlayerStats();
```

### `useWorkoutHistory`
Hook for fetching workout history:
```tsx
const { workouts, loading, error, refetch } = useWorkoutHistory({
  limit: 10,
  exercise_id: 1
});
```

### `usePlayerPreferences`
Hook for managing player preferences:
```tsx
const { preferences, loading, updating, error, update } = usePlayerPreferences();

// Update preferences
await update({ theme: "dark", difficulty_level: "hard" });
```

## Usage Example

```tsx
import { getPlayerStats, createWorkout } from "../services/player";

// Get stats
const stats = await getPlayerStats();
console.log(`Level: ${stats.level}, XP: ${stats.experience_points}`);

// Create a workout
const result = await createWorkout({
  exercise_name: "Push-up",
  exercise_category: "push",
  reps: 30,
  score: 30,
  workout_type: "solo"
});
```

## Error Handling

All services throw `ApiError` objects:
```tsx
try {
  const stats = await getPlayerStats();
} catch (error) {
  if (error.status === 401) {
    // Handle authentication error
  } else {
    // Handle other errors
    console.error(error.message);
  }
}
```

