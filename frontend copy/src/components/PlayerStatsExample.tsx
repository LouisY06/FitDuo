/**
 * Example component demonstrating player stats networking
 * This shows how to use the player service and hooks
 */

import { usePlayerStats } from "../hooks/usePlayerStats";
import { useWorkoutHistory } from "../hooks/useWorkoutHistory";
import { createWorkout } from "../services/player";

export function PlayerStatsExample() {
  const { stats, loading, error, refetch } = usePlayerStats();
  const { workouts, loading: workoutsLoading } = useWorkoutHistory({ limit: 5 });

  const handleRecordWorkout = async () => {
    try {
      await createWorkout({
        exercise_name: "Push-up",
        exercise_category: "push",
        reps: 30,
        score: 30,
        workout_type: "solo",
      });
      // Refresh stats after recording workout
      refetch();
    } catch (err) {
      console.error("Failed to record workout:", err);
    }
  };

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!stats) {
    return <div>No stats available</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Player Statistics</h2>
      
      <div>
        <h3>Level & XP</h3>
        <p>Level: {stats.level}</p>
        <p>Experience Points: {stats.experience_points}</p>
      </div>

      <div>
        <h3>Game Stats</h3>
        <p>Total Games: {stats.total_games}</p>
        <p>Wins: {stats.games_won}</p>
        <p>Losses: {stats.games_lost}</p>
        <p>Win Rate: {(stats.win_rate * 100).toFixed(1)}%</p>
        <p>Current Win Streak: {stats.current_win_streak}</p>
      </div>

      <div>
        <h3>Workout Stats</h3>
        <p>Total Workouts: {stats.total_workouts}</p>
        <p>Total Reps: {stats.total_reps}</p>
        <p>Current Workout Streak: {stats.current_workout_streak} days</p>
        <p>Best Pushups: {stats.best_pushups}</p>
        <p>Best Squats: {stats.best_squats}</p>
      </div>

      <div>
        <h3>Recent Workouts</h3>
        {workoutsLoading ? (
          <p>Loading workouts...</p>
        ) : (
          <ul>
            {workouts.map((workout) => (
              <li key={workout.id}>
                {workout.exercise_name}: {workout.reps || workout.duration_seconds}s
                (Score: {workout.score})
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={handleRecordWorkout}>
        Record Test Workout
      </button>
    </div>
  );
}

