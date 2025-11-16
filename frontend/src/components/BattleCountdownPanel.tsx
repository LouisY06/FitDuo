import { useEffect, useState } from "react";

type BattleCountdownPanelProps = {
  /** Seconds to count down from once `active` flips true */
  initialSeconds?: number;
  /** Current reps completed (typically driven by camera / sensor pipeline) */
  reps: number;
  /** Optional target reps to show progress against */
  targetReps?: number;
  /** Whether countdown should be running / visible */
  active?: boolean;
  /** Called once countdown hits zero */
  onCountdownComplete?: () => void;
};

/**
 * Neon battle-ready countdown + live rep counter.
 *
 * - Big VT323-style animated countdown, lime glow, BattleScreen halo vibes
 * - Rep counter with subtle pulse/glow whenever `reps` increases
 * - Tailwind-only, so it can be dropped into BattleScreen or /app/battle/:gameId
 */
export function BattleCountdownPanel({
  initialSeconds = 3,
  reps,
  targetReps,
  active = true,
  onCountdownComplete,
}: BattleCountdownPanelProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(active ? initialSeconds : null);
  const [lastReps, setLastReps] = useState(reps);
  const [repJustIncreased, setRepJustIncreased] = useState(false);

  // Drive animated countdown
  useEffect(() => {
    if (!active) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(initialSeconds);

    if (initialSeconds <= 0) return;

    const start = Date.now();
    let frame: number;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = initialSeconds - elapsed;

      if (remaining > 0) {
        setTimeLeft(remaining);
        frame = window.requestAnimationFrame(tick);
      } else {
        setTimeLeft(0);
        if (onCountdownComplete) {
          onCountdownComplete();
        }
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active, initialSeconds, onCountdownComplete]);

  // Glow / pulse when reps increase
  useEffect(() => {
    if (reps > lastReps) {
      setRepJustIncreased(true);
      const timeout = setTimeout(() => setRepJustIncreased(false), 220);
      setLastReps(reps);
      return () => clearTimeout(timeout);
    }
    setLastReps(reps);
  }, [reps, lastReps]);

  const percentage =
    typeof targetReps === "number" && targetReps > 0
      ? Math.min(100, Math.round((reps / targetReps) * 100))
      : null;

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-lime-500/30 bg-black/70 px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
      {/* Countdown row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[0.65rem] uppercase tracking-[0.25em] text-neutral-500">
            Countdown
          </span>
          <span className="text-xs text-neutral-400">
            Match starts when this hits zero.
          </span>
        </div>

        <div
          className={[
            "relative flex h-20 w-20 items-center justify-center rounded-2xl border border-lime-500/50 bg-gradient-to-br from-lime-500/20 via-emerald-500/10 to-lime-400/30",
            "shadow-[0_0_25px_rgba(99,255,0,0.5)]",
            "transition-transform duration-150",
            timeLeft !== null && timeLeft <= 3 ? "scale-105" : "scale-100",
          ].join(" ")}
        >
          <span
            className={[
              "text-5xl font-bold text-lime-300",
              "font-[var(--countdown-font,VT323,monospace)]",
              "drop-shadow-[0_0_18px_rgba(99,255,0,0.9)]",
              "transition-all duration-150",
              timeLeft !== null && timeLeft <= 3
                ? "scale-110 text-lime-200"
                : "scale-100 text-lime-300",
            ].join(" ")}
          >
            {timeLeft !== null && timeLeft > 0 ? timeLeft : "GO"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-5 mb-4 h-px w-full bg-gradient-to-r from-transparent via-lime-500/40 to-transparent" />

      {/* Reps + progress */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[0.65rem] uppercase tracking-[0.25em] text-neutral-500">
            Live reps
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={[
                "text-3xl font-semibold text-lime-400",
                "transition-transform duration-200",
                repJustIncreased ? "scale-125" : "scale-100",
              ].join(" ")}
            >
              {reps}
            </span>
            {percentage !== null && (
              <span className="text-xs text-neutral-400">
                / {targetReps} reps ·{" "}
                <span className="text-lime-400 font-medium">{percentage}%</span>
              </span>
            )}
          </div>
        </div>

        {percentage !== null && (
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[0.65rem] uppercase tracking-[0.2em] text-neutral-600">
              <span>Progress</span>
              <span className="text-lime-400/80">{percentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-lime-200 shadow-[0_0_18px_rgba(99,255,0,0.7)] transition-[width] duration-200 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


