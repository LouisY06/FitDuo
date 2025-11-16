import { useState, useEffect } from "react";
import { getCurrentUser } from "../../services/auth";
import { RadialOrbitalTimelineDemo } from "../ui/radial-orbital-timeline-demo";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { User2, Activity, Flame, BarChart3, Trophy, Lock } from "lucide-react";

interface UserProfile {
  id: number;
  firebase_uid: string;
  username: string;
  email?: string;
}

export function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState({
    totalBattles: 0,
    winRate: 0,
    totalReps: 0,
    longestStreak: 0,
  });
  // These will later be hydrated from real backend endpoints
  const [recentMatches] = useState<
    Array<{
      id: string;
      rivalName: string;
      mode: string;
      result: "Win" | "Loss";
      reps: number;
      timeAgo: string;
    }>
  >([]);
  const [badges] = useState<
    Array<{ id: string; name: string; earned: boolean }>
  >([]);
  // TODO: surface load errors in the UI if desired

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser({
            id: userData.id || 0,
            firebase_uid: userData.firebase_uid || "",
            username: userData.username || "User",
            email: userData.email,
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
      // Future: fetch stats, matches, and badges from backend once endpoints exist
      setIsLoading(false);
    };

    loadProfile();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#020817] text-neutral-50 flex">
      <div className="flex-1 flex items-center justify-center px-4 pt-8 pb-24">
        <div className="w-full max-w-6xl space-y-8">
          {/* Header + stats */}
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] items-center">
            {/* User header */}
            <Card className="bg-black/70 border-lime-500/20">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-lime-400/60 bg-gradient-to-br from-lime-400/40 to-emerald-500/40 text-2xl font-semibold text-lime-300">
                  {user ? getInitials(user.username) : "U"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <User2 className="h-4 w-4 text-lime-400" />
                    <span className="audiowide-regular">
                      {user?.username || (isLoading ? "Loading..." : "User")}
                    </span>
                  </div>
                  {user?.email && !isLoading && (
                    <p className="text-sm text-neutral-400">{user.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/70 border-neutral-800/70">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-neutral-500">
                    Battles
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-lime-400">
                      {stats.totalBattles}
                    </span>
                    <Activity className="h-4 w-4 text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-black/70 border-neutral-800/70">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-neutral-500">
                    Win rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-lime-400">
                      {stats.winRate}%
                    </span>
                    <BarChart3 className="h-4 w-4 text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-black/70 border-neutral-800/70">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-neutral-500">
                    Total reps
                  </span>
                  <span className="text-2xl font-semibold text-lime-400">
                    {stats.totalReps}
                  </span>
                </CardContent>
              </Card>
              <Card className="bg-black/70 border-neutral-800/70">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-neutral-500">
                    Longest streak
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-lime-400">
                      {stats.longestStreak}
                    </span>
                    <Flame className="h-4 w-4 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Orbital performance timeline */}
          <section className="rounded-3xl border border-neutral-800/80 bg-black/80 overflow-hidden">
            <div className="h-[420px] md:h-[520px]">
              <RadialOrbitalTimelineDemo />
            </div>
          </section>

          {/* Recent matches + badges */}
          <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Recent matches */}
            <Card className="bg-black/70 border-neutral-800/80">
              <CardHeader>
                <CardTitle className="text-lg audiowide-regular">
                  Recent Matches
                </CardTitle>
                <CardDescription>
                  Your latest battles at a glance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">vs {match.rivalName}</p>
                      <p className="text-xs text-neutral-400">
                        {match.mode} • {match.reps} reps • {match.timeAgo}
                      </p>
                    </div>
                    <span
                      className={
                        match.result === "Win"
                          ? "rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                          : "rounded-full px-3 py-1 text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/40"
                      }
                    >
                      {match.result}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="bg-black/70 border-neutral-800/80">
              <CardHeader>
                <CardTitle className="text-lg audiowide-regular">
                  Badges
                </CardTitle>
                <CardDescription>
                  Milestones you have earned so far.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {badges.map((badge) => {
                  const Icon = badge.earned ? Trophy : Lock;
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        badge.earned
                          ? "border-lime-500/50 bg-lime-500/5"
                          : "border-neutral-800/80 bg-neutral-900/40 opacity-70"
                      }`}
                    >
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black/60">
                        <Icon
                          className={
                            badge.earned
                              ? "h-4 w-4 text-lime-300"
                              : "h-4 w-4 text-neutral-500"
                          }
                        />
                      </div>
                      <p className="text-sm font-medium">{badge.name}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
