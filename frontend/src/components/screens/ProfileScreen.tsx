import { RadialOrbitalProfileDemo } from "@/components/ui/radial-orbital-profile-demo";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";

export function ProfileScreen() {
  const navigate = useNavigate();

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
      <div className="flex-1 flex items-end justify-start px-4 pb-12 bg-transparent">
        <div className="w-full max-w-6xl">
          <section className="relative rounded-3xl border border-neutral-800/70 bg-transparent backdrop-blur-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm bg-black/40 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/app")}
              >
                Home / Global
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm bg-black/40 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/discover")}
              >
                Welcome Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm bg-black/40 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
            <div className="absolute top-4 right-4 z-30">
              <Button
                variant="outline"
                size="sm"
                className="bg-black/40 border-white/30 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  // TODO: wire up to real profile editing UI
                  console.log("Edit profile clicked");
                }}
              >
                Edit profile
              </Button>
            </div>
            <div className="h-[480px] md:h-[600px] flex items-center justify-center pt-6 md:pt-10">
              <RadialOrbitalProfileDemo />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
