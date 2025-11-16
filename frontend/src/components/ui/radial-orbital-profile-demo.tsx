"use client";

import {
  Calendar,
  Dumbbell,
  HeartHandshake,
  Target,
  Trophy,
  User as UserIcon,
  Clock3,
} from "lucide-react";
import RadialOrbitalProfileTimeline from "@/components/ui/radial-orbital-profile-timeline";

export type ProfileShape = {
  name: string;
  handle: string;
  tagline?: string;
  avatarUrl?: string;
};

export const defaultProfile: ProfileShape = {
  name: "FitDuo User",
  handle: "fitduo_player01",
  tagline:
    "Pushing limits, one rep at a time. Matching with partners that keep me honest.",
  avatarUrl:
    "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=600&q=80",
};

export const createTimelineData = (userStats: any | null) => [
  {
    id: 1,
    title: "Bio",
    subtitle: "Since Jan 2025",
    content:
      "Loves short, intense partner workouts and competitive rep battles. Usually trains in the evenings and prefers strength + HIIT combinations.",
    category: "Profile",
    icon: UserIcon,
    relatedIds: [2, 3],
    emphasis: "primary" as const,
    energy: 85,
  },
  {
    id: 2,
    title: "Stats",
    subtitle: "All Time",
    content: userStats 
      ? `${userStats.totalBattles} battles • ${userStats.wins} wins (${userStats.winRate.toFixed(1)}% win rate) • ${userStats.totalWorkoutMinutes} total minutes • Best: ${userStats.bestRepsSingleRound} reps in one round`
      : "Loading stats...",
    category: "Stats",
    icon: Dumbbell,
    relatedIds: [1, 4],
    emphasis: "primary" as const,
    energy: 92,
  },
  {
    id: 3,
    title: "Match Pref",
    subtitle: "Preferred partners",
    content:
      "Prefers partners with similar intensity levels and clear rep counting. Enjoys light trash talk and positive feedback between sets.",
    category: "Preferences",
    icon: HeartHandshake,
    relatedIds: [1, 5],
    emphasis: "secondary" as const,
    energy: 70,
  },
  {
    id: 4,
    title: "History",
    subtitle: "Match history",
    content:
      "Open your full match history to review every battle and training session, with filters for Multiplayer, Solo Practice, and Time Trials.",
    category: "History",
    icon: Clock3,
    relatedIds: [2, 5],
    emphasis: "secondary" as const,
    energy: 80,
  },
  {
    id: 5,
    title: "Goals",
    subtitle: "Q1 2026",
    content:
      "Hit a 21-day active streak, improve form on single-leg exercises, and try at least 3 new workout formats with different partners.",
    category: "Goals",
    icon: Target,
    relatedIds: [2, 3, 4],
    emphasis: "future" as const,
    energy: 65,
  },
  {
    id: 6,
    title: "Schedule",
    subtitle: "Typical week",
    content:
      "Most active: Mon, Wed, Fri 7–9 PM. Open to spontaneous sessions on weekends when matched with compatible partners.",
    category: "Schedule",
    icon: Calendar,
    relatedIds: [1, 3],
    emphasis: "secondary" as const,
    energy: 60,
  },
];

export function RadialOrbitalProfileDemo({
  userStats,
  profile = defaultProfile,
}: {
  userStats: any | null;
  profile?: ProfileShape;
}) {
  const timelineData = createTimelineData(userStats);
  return (
    <RadialOrbitalProfileTimeline profile={profile} timelineData={timelineData} />
  );
}

