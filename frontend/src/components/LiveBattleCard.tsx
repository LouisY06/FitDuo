import React from "react";

type ExerciseMode = "reps" | "hold";

type GameState = "countdown" | "live" | "ended_time" | "ended_inactivity";

interface LiveBattleProps {
  gameId?: string;
  mode: ExerciseMode; // "reps" or "hold"
  state: GameState; // from backend
  durationSeconds: number; // usually 180
  countdownRemaining: number; // seconds until start (only for "countdown")
  timeRemaining: number; // seconds until end (for "live")
  userMetric: number; // reps OR hold seconds
  // Optional opponent context for versus UI
  opponentMetric?: number; // reps OR hold seconds
  opponentName?: string;
}

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export const LiveBattleCard: React.FC<LiveBattleProps> = ({
  gameId,
  mode,
  state,
  durationSeconds,
  countdownRemaining,
  timeRemaining,
  userMetric,
  opponentMetric,
  opponentName,
}) => {
  // For countdown, we animate from duration → 0
  const totalCountdown = Math.max(durationSeconds, countdownRemaining);
  const countdownProgress =
    totalCountdown > 0 ? (countdownRemaining / totalCountdown) * 100 : 0;

  // For live, timeRemaining / durationSeconds
  const matchProgress =
    durationSeconds > 0 ? (timeRemaining / durationSeconds) * 100 : 0;

  const isCountdown = state === "countdown";
  const isLive = state === "live";
  const isEnded = state === "ended_time" || state === "ended_inactivity";

  const metricLabel = mode === "reps" ? "LIVE REPS" : "HOLD TIME";
  const metricValue =
    mode === "reps" ? userMetric.toString() : formatTime(userMetric);
  const metricCaption =
    mode === "reps"
      ? "total reps this match"
      : "longest continuous hold this match";

  const timerValue = isCountdown
    ? formatTime(countdownRemaining)
    : formatTime(timeRemaining);
  const timerPercent = isCountdown ? countdownProgress : matchProgress;

  const statusText =
    state === "countdown"
      ? "Match starts when this hits zero. You have 1:00 to do as many reps as you can."
      : state === "live"
      ? mode === "reps"
        ? "Do as many clean reps as you can before time runs out."
        : "Hold your position as long as you can, up to 1:00."
      : state === "ended_time"
      ? "Time is up. Waiting for final scores…"
      : "No movement for 10 seconds. Match ended.";

  // Opponent / versus strip
  const hasOpponent = typeof opponentMetric === "number";

  const formattedUserMetric =
    mode === "reps" ? userMetric.toString() : formatTime(userMetric);
  const formattedOpponentMetric =
    mode === "reps"
      ? (opponentMetric ?? 0).toString()
      : formatTime(opponentMetric ?? 0);

  let versusSummary: string | null = null;
  if (hasOpponent) {
    if (userMetric > (opponentMetric ?? 0)) {
      versusSummary =
        state === "ended_time" || state === "ended_inactivity"
          ? "You won this match."
          : "You’re currently in the lead.";
    } else if (userMetric < (opponentMetric ?? 0)) {
      versusSummary =
        state === "ended_time" || state === "ended_inactivity"
          ? "You lost this match."
          : "You’re currently behind.";
    } else {
      versusSummary =
        state === "ended_time" || state === "ended_inactivity"
          ? "This match ended in a tie."
          : "Neck and neck right now.";
    }
  }

  const totalForRatio =
    hasOpponent && userMetric + (opponentMetric ?? 0) > 0
      ? userMetric + (opponentMetric ?? 0)
      : null;
  const youPercent =
    totalForRatio !== null ? (userMetric / totalForRatio) * 100 : 50;

  return (
    <div className="flex flex-col items-center gap-6 text-white">
      {/* Top title */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-lime-300/70">
          Match Ready
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-lime-400 audiowide-regular">
          Live Battle
        </h1>
        {gameId && (
          <p className="mt-1 text-xs text-slate-400">
            Game ID: <span className="font-mono text-lime-300">{gameId}</span>
          </p>
        )}
      </div>

      {/* Main card */}
      <div className="w-full max-w-3xl rounded-[24px] border border-lime-300/20 bg-[#020511] shadow-[0_0_60px_rgba(132,255,78,0.25)] px-8 py-6 flex items-center justify-between gap-8">
        {/* Left side: countdown + metrics */}
        <div className="flex-1 space-y-6">
          {/* Countdown status */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              COUNTDOWN
            </p>
            <p className="mt-1 text-sm text-slate-200">{statusText}</p>
          </div>

          {/* Metric block */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              {metricLabel}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-lime-400">
                {metricValue}
              </span>
              <span className="text-xs text-slate-400">{metricCaption}</span>
            </div>
          </div>

          {/* Time bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-1">
              <span>Time Left</span>
              <span className="text-lime-300">{timerValue}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400 transition-[width] duration-300"
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side: GO button / state indicator */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute -inset-5 rounded-[28px] bg-lime-400/30 blur-2xl" />
            <button
              type="button"
              className="relative h-28 w-28 rounded-[24px] bg-gradient-to-b from-lime-400 to-lime-500 text-black text-3xl font-semibold shadow-[0_0_40px_rgba(132,255,78,0.8)]"
              disabled
            >
              {isCountdown && "GO"}
              {isLive && "LIVE"}
              {isEnded && "END"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-center text-slate-400 max-w-[8rem]">
            Button is visual only. Actual start/end is controlled by the server.
          </p>
        </div>
      </div>

      {/* You vs Opponent strip */}
      {hasOpponent && (
        <div className="w-full max-w-3xl rounded-[18px] border border-slate-800 bg-[#050814] px-4 py-3 text-[11px] text-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-100">You</span>
              <span className="font-mono text-lime-300">
                {formattedUserMetric}
                {mode === "reps" ? " reps" : ""}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-100">
                {opponentName || "Opponent"}
              </span>
              <span className="font-mono text-sky-300">
                {formattedOpponentMetric}
                {mode === "reps" ? " reps" : ""}
              </span>
            </div>
          </div>
          <div className="mt-1">
            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lime-400 via-emerald-400 to-sky-400 transition-[width] duration-300"
                style={{ width: `${youPercent}%` }}
              />
            </div>
            {versusSummary && (
              <p className="mt-1 text-[10px] text-slate-400">
                {versusSummary}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom rules banner */}
      <div className="w-full max-w-3xl rounded-[18px] border border-slate-700 bg-[#050814] px-6 py-4 text-xs text-slate-200">
        <p className="font-medium mb-1">Game rules</p>
        {mode === "reps" ? (
          <p className="text-slate-400">
            You have 1 minute to do as many reps as possible. Highest rep count
            wins. If both players stop moving for more than 10 seconds, the
            game ends and both lose.
          </p>
        ) : (
          <p className="text-slate-400">
            You have up to 1 minute to hold your position. Your score is your
            longest continuous hold. If both players drop and don&apos;t resume
            within 10 seconds, the game ends and both lose.
          </p>
        )}
      </div>
    </div>
  );
};


