import React, { useState } from "react";

type CoinFlipProps = {
  onResult?: (winner: "you" | "opponent") => void;
};

const CoinFlip: React.FC<CoinFlipProps> = ({ onResult }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [winner, setWinner] = useState<"you" | "opponent" | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleFlip = () => {
    if (isFlipping) return;

    setIsFlipping(true);

    const result: "you" | "opponent" = Math.random() < 0.5 ? "you" : "opponent";

    // keep your original “front/back” parity logic
    const baseSpins = 6 + Math.floor(Math.random() * 4);
    const needsFront = result === "you";
    let halfRotations = baseSpins;

    if (needsFront && halfRotations % 2 === 0) {
      halfRotations += 1;
    }

    if (!needsFront && halfRotations % 2 === 1) {
      halfRotations += 1;
    }

    const degrees = halfRotations * 180;
    setRotation((prev) => prev + degrees);

    setTimeout(() => {
      setWinner(result);
      setIsFlipping(false);
      onResult?.(result);
    }, 1250);
  };

  // Status UI text
  let statusLabel = "Ready to flip";
  let statusDesc = "Tap the coin to flip. Winner chooses exercise.";
  let statusDotClass = "bg-emerald-400";
  let statusDotPulse = true;

  if (isFlipping) {
    statusLabel = "Flipping…";
    statusDesc = "Coin Flip: Winner chooses exercise";
    statusDotClass = "bg-emerald-400";
    statusDotPulse = true;
  } else if (winner === "you") {
    statusLabel = "You won toss";
    statusDesc = "You choose the first exercise";
    statusDotClass = "bg-emerald-400";
    statusDotPulse = false;
  } else if (winner === "opponent") {
    statusLabel = "Opponent won toss";
    statusDesc = "Opponent will choose the first exercise";
    statusDotClass = "bg-rose-400";
    statusDotPulse = false;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Status pill */}
      <div className="px-3.5 py-1 rounded-full border border-slate-700/70 bg-slate-950/90 backdrop-blur text-[11px] text-slate-200 flex items-center gap-2 shadow-[0_0_30px_rgba(15,23,42,0.9)]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${statusDotClass} ${
            statusDotPulse ? "animate-pulse" : ""
          }`}
        />
        <span className="font-medium tracking-[0.16em] uppercase text-slate-400">
          {statusLabel}
        </span>
        <span className="text-slate-300">{statusDesc}</span>
      </div>

      {/* Coin + ring container */}
      <div className="relative mt-2 md:mt-0">
        {/* Outer ring */}
        <div className="relative h-32 w-32 md:h-40 md:w-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-slate-600/40 bg-slate-900/50 shadow-[0_0_50px_rgba(15,23,42,1)]" />
          <div className="absolute inset-2 rounded-full border border-slate-600/60" />

          {/* Progress ring segments */}
          <div className="absolute inset-1.5 rounded-full border border-dashed border-emerald-400/70 opacity-70" />
          <div className="absolute inset-3 rounded-full border border-dashed border-rose-400/70 opacity-40 rotate-45" />

          {/* Guiding labels */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-[0.22em] uppercase text-emerald-300">
            You
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-[0.22em] uppercase text-rose-300">
            Opponent
          </div>

          {/* Coin */}
          <button
            onClick={handleFlip}
            className="relative h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 shadow-[0_12px_40px_rgba(15,23,42,0.85)] flex items-center justify-center border border-slate-200/90 [transform-style:preserve-3d] hover:shadow-[0_16px_50px_rgba(15,23,42,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050712]"
            style={{
              perspective: "1200px",
              transform: `rotateY(${rotation}deg)`,
              transitionDuration: "1200ms",
              transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)",
            }}
            aria-label="Flip coin"
          >
            {/* Coin edge glow */}
            <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-emerald-400/55 via-transparent to-rose-500/55 opacity-60 mix-blend-screen pointer-events-none" />

            {/* Front face (you) */}
            <div className="relative h-[72%] w-[72%] rounded-full bg-slate-950/95 border border-slate-200/10 flex flex-col items-center justify-center gap-0.5 [backface-visibility:hidden]">
              <div className="text-[9px] font-medium tracking-[0.28em] uppercase text-slate-400">
                FitDuo
              </div>
              <div className="text-xs md:text-sm font-semibold tracking-[0.12em] uppercase text-emerald-300">
                You
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                <span className="h-0.5 w-5 rounded-full bg-emerald-400/70" />
                <span className="h-0.5 w-5 rounded-full bg-rose-400/70" />
              </div>
            </div>

            {/* Back face (opponent) */}
            <div
              className="absolute inset-[14%] rounded-full bg-slate-950/95 border border-slate-200/10 flex flex-col items-center justify-center gap-0.5 [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
            >
              <div className="text-[9px] font-medium tracking-[0.28em] uppercase text-slate-400">
                FitDuo
              </div>
              <div className="text-xs md:text-sm font-semibold tracking-[0.12em] uppercase text-rose-300">
                Opponent
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                <span className="h-0.5 w-5 rounded-full bg-rose-400/80" />
                <span className="h-0.5 w-5 rounded-full bg-emerald-400/60" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;




