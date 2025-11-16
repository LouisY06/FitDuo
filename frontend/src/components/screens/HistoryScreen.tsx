import { useNavigate } from "react-router-dom";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { Button } from "@/components/ui/button";

export function HistoryScreen() {
  const navigate = useNavigate();

  const {
    workouts,
    loading,
    error,
  } = useWorkoutHistory({
    limit: 50,
  });

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-[calc(100vh-120px)] text-neutral-50 flex">
      <div className="flex-1 flex flex-col items-center justify-start px-4 pb-12 pt-8 bg-transparent">
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl audiowide-regular tracking-wide text-lime-300">
                Full History
              </h1>
              <p className="text-xs md:text-sm text-neutral-300/80 mt-1">
                Review your recent workouts and match battles.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 text-xs audiowide-regular tracking-[0.12em] uppercase bg-black/40 border border-lime-400/70 text-lime-300 hover:bg-lime-400/10 hover:text-lime-200"
              onClick={() => navigate("/app", { replace: false })}
            >
              Back
            </Button>
          </div>

          <section className="rounded-3xl border border-neutral-800/70 bg-black/40 backdrop-blur-xl overflow-hidden">
            <div className="border-b border-neutral-800/70 px-4 py-3 flex items-center justify-between text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
              <span className="w-2/12">Date</span>
              <span className="w-4/12">Workout</span>
              <span className="w-2/12 text-center">Type</span>
              <span className="w-2/12 text-center">Score</span>
              <span className="w-2/12 text-right">Details</span>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-xs text-neutral-300">
                  Loading history...
                </div>
              )}
              {error && !loading && (
                <div className="px-4 py-6 text-center text-xs text-red-400">
                  Couldn&apos;t load workout history.
                </div>
              )}
              {!loading && !error && workouts.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-neutral-300">
                  No workouts recorded yet. Complete a workout or battle to see it
                  here.
                </div>
              )}

              {!loading &&
                !error &&
                workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="px-4 py-3 border-b border-neutral-900/70 text-[0.75rem] text-neutral-100 flex items-center hover:bg-white/5 transition-colors"
                  >
                    <span className="w-2/12 tabular-nums text-neutral-300">
                      {formatDateTime(workout.completed_at)}
                    </span>
                    <span className="w-4/12 truncate pr-2">
                      {workout.exercise_name}
                    </span>
                    <span className="w-2/12 text-center uppercase tracking-[0.16em] text-neutral-400">
                      {workout.workout_type}
                    </span>
                    <span className="w-2/12 text-center text-lime-300 tabular-nums">
                      {workout.score}
                    </span>
                    <span className="w-2/12 text-right text-neutral-400">
                      {workout.reps != null
                        ? `${workout.reps} reps`
                        : workout.duration_seconds != null
                        ? `${workout.duration_seconds}s`
                        : "-"}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


