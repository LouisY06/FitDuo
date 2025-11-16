import React, { useEffect, useState } from "react";
import { Activity, Sparkles, Wifi, Bolt } from "lucide-react";

interface ReadyPhaseVsScreenProps {
  youName?: string;
  opponentName?: string;
  youReps?: number;
  opponentReps?: number;
  targetReps?: number;
  youLevel?: string;
  opponentLevel?: string;
  streak?: number;
  sessionLabel?: string;
  onCountdownComplete?: () => void;
}

const TOTAL_COUNTDOWN = 3; // 3 → 2 → 1

const ReadyPhaseVsScreen: React.FC<ReadyPhaseVsScreenProps> = ({
  youName = "Alex Rivera",
  opponentName = "Jamie Park",
  youReps = 0,
  opponentReps = 0,
  targetReps = 40,
  youLevel = "Challenger II",
  opponentLevel = "Challenger I",
  streak = 3,
  sessionLabel = "Session 03",
  onCountdownComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_COUNTDOWN);

  useEffect(() => {
    if (timeLeft <= 0) {
      onCountdownComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onCountdownComplete]);

  const countdownDisplay = Math.max(timeLeft, 0);
  const progressWidth = `${(Math.max(timeLeft, 0) / TOTAL_COUNTDOWN) * 100}%`;

  const progressColorClass =
    timeLeft > 2
      ? "from-emerald-400 to-emerald-500"
      : timeLeft > 1
      ? "from-amber-300 to-orange-400"
      : "from-rose-500 to-red-500";

  return (
    <div className="min-h-screen bg-[#050712] text-slate-50 antialiased flex items-center justify-center">
      <div className="w-full max-w-6xl aspect-video bg-[#050712] relative overflow-hidden rounded-3xl border border-slate-800/80 shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
        {/* Background grid + particles */}
        <div className="absolute inset-px rounded-[22px] bg-gradient-to-b from-[#070814] via-[#050712] to-black overflow-hidden">
          <div className="absolute inset-0 opacity-[0.22] pointer-events-none">
            <div className="w-[200%] h-[200%] bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.28),transparent_55%),radial-gradient(circle_at_bottom,_rgba(244,63,94,0.29),transparent_55%)]" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.11)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.65),transparent_55%)] mix-blend-multiply" />
        </div>

        {/* Top navigation / branding */}
        <div className="absolute top-0 inset-x-0 z-20 px-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-emerald-300">
                FD
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase">
                FitDuo
              </span>
              <span className="text-xs text-slate-500 -mt-0.5">
                Versus • Ready phase
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700/70 bg-slate-900/70 backdrop-blur">
              <Activity
                className="text-emerald-300"
                size={13}
                strokeWidth={1.5}
              />
              <span className="text-slate-300">{sessionLabel}</span>
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button className="px-3 py-1 rounded-full text-[11px] font-medium text-slate-200 border border-slate-700/70 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-500/80 transition-colors">
              Exit
            </button>
          </div>
        </div>

        {/* TOP COUNTDOWN BAR: 3 → 2 → 1 */}
        <div className="absolute top-[52px] left-0 right-0 z-20 px-6">
          <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColorClass} transition-all duration-1000`}
              style={{ width: progressWidth }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-slate-400">
            <span>Get Ready</span>
            <span className="text-slate-300">
              {countdownDisplay > 0
                ? `Match starts in ${countdownDisplay}…`
                : "Match starting"}
            </span>
          </div>
        </div>

        {/* Diagonal split + side glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -inset-[12%] bg-[conic-gradient(from_135deg_at_50%_50%,rgba(45,212,191,0.65),rgba(15,23,42,0.5),rgba(244,63,94,0.7),rgba(15,23,42,0.45),rgba(45,212,191,0.65))] opacity-[0.10] mix-blend-screen" />
          <div className="absolute inset-0">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-tr from-emerald-500/22 via-emerald-500/5 to-transparent mix-blend-screen" />
          </div>
          <div className="absolute inset-0">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-rose-500/28 via-rose-500/5 to-transparent mix-blend-screen" />
          </div>
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(50% 0, 52% 0, 48% 100%, 46% 100%)",
            }}
          >
            <div className="w-full h-full bg-gradient-to-b from-slate-200/55 via-slate-500/40 to-slate-900/0 opacity-70" />
          </div>
        </div>

        {/* Main VS layout */}
        <div className="relative z-10 h-full flex flex-col pt-16 pb-8">
          {/* VS + Panels container */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="relative flex items-stretch px-3 md:px-6 gap-3 md:gap-5">
              {/* LEFT: YOU */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="relative max-w-sm ml-auto">
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/60 via-emerald-400/10 to-transparent opacity-60 blur-md rounded-2xl pointer-events-none" />
                  <div className="relative border border-emerald-400/50 bg-slate-950/80 backdrop-blur-lg rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-[0_20px_60px_rgba(16,185,129,0.30)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full border border-emerald-400/60 bg-emerald-500/15 text-[9px] font-medium tracking-[0.26em] uppercase text-emerald-200">
                          You
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Online • Ready
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Sparkles
                          className="text-emerald-300"
                          size={13}
                          strokeWidth={1.5}
                        />
                        <span>Streak x{streak}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
                        {youName}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          Reps
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg md:text-2xl font-semibold tracking-tight text-emerald-300">
                            {youReps.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            / target {targetReps}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                          Level
                        </span>
                        <span className="text-xs font-medium text-slate-200">
                          {youLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VS badge */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400/40 blur-xl rounded-full mix-blend-screen opacity-70" />
                  <div className="absolute inset-0 bg-rose-400/40 blur-xl rounded-full mix-blend-screen opacity-70 translate-x-3 translate-y-1" />
                  <div className="relative px-4 py-3 rounded-2xl border border-slate-500/70 bg-slate-900/90 backdrop-blur flex flex-col items-center gap-1 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
                      Get Ready
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="h-px w-6 bg-slate-500/60" />
                      <span className="text-xl font-semibold tracking-[0.24em] text-slate-50">
                        VS
                      </span>
                      <span className="h-px w-6 bg-slate-500/60" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Bolt
                        className="text-amber-300"
                        size={13}
                        strokeWidth={1.5}
                      />
                      <span>Match about to start</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: OPPONENT */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="relative max-w-sm mr-auto">
                  <div className="absolute -inset-0.5 bg-gradient-to-bl from-rose-500/70 via-rose-400/10 to-transparent opacity-70 blur-md rounded-2xl pointer-events-none" />
                  <div className="relative border border-rose-400/60 bg-slate-950/80 backdrop-blur-lg rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-[0_20px_60px_rgba(244,63,94,0.45)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full border border-rose-400/80 bg-rose-500/20 text-[9px] font-medium tracking-[0.26em] uppercase text-rose-100">
                          Opponent
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Matched • Syncing
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Wifi
                          className="text-rose-200"
                          size={13}
                          strokeWidth={1.5}
                        />
                        <span>Ping 32ms</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
                        {opponentName}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          Reps
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg md:text-2xl font-semibold tracking-tight text-rose-300">
                            {opponentReps.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            / target {targetReps}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                          Level
                        </span>
                        <span className="text-xs font-medium text-slate-200">
                          {opponentLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom divider for spacing */}
            <div className="mt-6 px-4 md:px-6">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadyPhaseVsScreen;




