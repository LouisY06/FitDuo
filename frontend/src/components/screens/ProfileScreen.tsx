import { RadialOrbitalProfileDemo, defaultProfile } from "@/components/ui/radial-orbital-profile-demo";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../../services/auth";
import { userStatsAPI, type UserStats } from "../../services/api";
import { useState, useEffect } from "react";

export function ProfileScreen() {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Fetch user stats on mount
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const user = await getCurrentUser();
        if (user && typeof user.id === 'number') {
          const stats = await userStatsAPI.getUserStats(user.id);
          setUserStats(stats);
        } else {
          console.warn("⚠️ User ID is not a number (backend sync may have failed), using default stats");
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      }
    };
    fetchUserStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <main className="min-h-[calc(100vh-120px)] text-neutral-50 flex">
      <div className="flex-1 flex items-center justify-center px-4 pb-12 bg-transparent">
        <div className="w-full max-w-6xl">
          <section className="relative rounded-3xl border border-neutral-800/70 bg-transparent backdrop-blur-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-xs audiowide-regular tracking-[0.12em] uppercase bg-black/40 border border-lime-400/70 text-lime-300 hover:bg-lime-400/10 hover:text-lime-200"
                onClick={() => navigate("/info")}
              >
                About
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-xs audiowide-regular tracking-[0.12em] uppercase bg-black/40 border border-lime-400/70 text-lime-300 hover:bg-lime-400/10 hover:text-lime-200"
                onClick={() => navigate("/discover")}
              >
                Welcome Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-xs audiowide-regular tracking-[0.12em] uppercase bg-black/40 border border-lime-400/70 text-lime-300 hover:bg-lime-400/10 hover:text-lime-200"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
            <div className="absolute top-4 right-4 z-30">
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-xs audiowide-regular tracking-[0.12em] uppercase bg-black/40 border border-lime-400/70 text-lime-300 hover:bg-lime-400/10 hover:text-lime-200"
                onClick={() => {
                  // TODO: wire up to real profile editing UI
                  console.log("Edit profile clicked");
                }}
              >
                Edit profile
              </Button>
            </div>
            {defaultProfile.tagline && (
              <div className="relative z-20 pt-6 pb-1 flex justify-center">
                <p className="text-xs md:text-sm text-neutral-200/85 text-center max-w-xl">
                  {defaultProfile.tagline}
                </p>
              </div>
            )}
            <div className="h-[480px] md:h-[600px] flex items-center justify-center pt-0 md:pt-2">
              <RadialOrbitalProfileDemo userStats={userStats} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
