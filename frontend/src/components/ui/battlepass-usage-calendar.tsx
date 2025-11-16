import React from "react";
import { CalendarDays } from "lucide-react";

export type DayStatus = "none" | "login" | "session";

export interface DayUsage {
  /** ISO date string like "2025-11-16" */
  date: string;
  /**
   * none    = no activity
   * login   = logged in but no battle/training
   * session = at least one battle/training
   */
  status: DayStatus;
}

interface BattlePassUsageCalendarProps {
  /** e.g. "Usage history" */
  label?: string;
  /** e.g. "Training Calendar" */
  title?: string;
  /** e.g. "14 sessions in the last 30 days." */
  summaryText: string;
  /** 28 or 35 days, chunked into 4–5 weeks of 7 */
  days: DayUsage[];
}

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

function renderDay(status: DayStatus) {
  const baseCircle =
    "h-7 w-7 rounded-full border flex items-center justify-center";

  if (status === "session") {
    // Full lime = user did battle/training that day
    return (
      <div className="relative flex items-center justify-center">
        <div className={`${baseCircle} bg-lime-400 border-lime-200/80`} />
      </div>
    );
  }

  if (status === "login") {
    // Half lime pill = logged in but no session
    return (
      <div className="relative flex items-center justify-center">
        <div
          className={`${baseCircle} bg-neutral-800 border-white/10 overflow-hidden relative`}
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-lime-400" />
        </div>
      </div>
    );
  }

  // none = inactive day
  return (
    <div className="relative flex items-center justify-center">
      <div className={`${baseCircle} bg-neutral-800 border-white/10`} />
    </div>
  );
}

export function BattlePassUsageCalendar({
  label = "Usage history",
  title = "Training Calendar",
  summaryText,
  days,
}: BattlePassUsageCalendarProps) {
  const weekCount = Math.ceil(days.length / 7);
  const weeks = Array.from({ length: weekCount }, (_, i) =>
    days.slice(i * 7, i * 7 + 7)
  );

  return (
    <section className="sm:p-6 flex flex-col min-h-[260px] border rounded-3xl pt-4 pr-4 pb-4 pl-4 shadow-lg shadow-black/60 bg-neutral-900/90 border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            {label}
          </p>
          <h2 className="text-[18px] font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition bg-neutral-800 border-white/10 hover:bg-neutral-700 hover:border-white/20">
          <CalendarDays className="h-4 w-4 text-neutral-200" />
        </button>
      </div>

      <p className="text-[11px] mb-3 border-b pb-2 text-neutral-400 border-white/5">
        {summaryText}
      </p>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] mb-1 text-neutral-400">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <React.Fragment key={`${day.date}-${weekIndex}-${dayIndex}`}>
              {renderDay(day.status)}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] border-white/10 text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-lime-400" />
          <span>Battle / training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neutral-700 border border-white/10 overflow-hidden">
            <span className="absolute inset-y-0 right-0 w-1/2 bg-lime-400" />
          </span>
          <span>Login only</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span>Inactive</span>
        </div>
      </div>
    </section>
  );
}


