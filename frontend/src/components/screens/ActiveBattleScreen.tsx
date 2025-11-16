import { useParams } from "react-router-dom";
import { LiveBattleCard } from "../LiveBattleCard";

/**
 * ActiveBattleScreen
 *
 * Battle view wired to URL routing.
 * Renders LiveBattleCard, which is fully driven by backend game state.
 */
export function ActiveBattleScreen() {
  const { gameId } = useParams<{ gameId: string }>();

  return (
    <>
      {/* Full-screen glass layer so the entire arena background is blurred */}
      <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />

      <main className="relative min-h-[calc(100vh-120px)] text-neutral-50 flex z-10">
        <div className="flex-1 flex items-center justify-center px-4 pt-8 pb-24">
          <div className="w-full max-w-4xl space-y-8">
            <LiveBattleCard
              gameId={gameId}
              mode="reps"
              state="countdown"
              durationSeconds={180}
              countdownRemaining={180}
              timeRemaining={180}
              userMetric={0}
              opponentMetric={0}
              opponentName="Rival"
            />
          </div>
        </div>
      </main>
    </>
  );
}


