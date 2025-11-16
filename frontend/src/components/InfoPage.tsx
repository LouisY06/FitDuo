import { useNavigate } from "react-router-dom";
import { Globe } from "./Globe";
import "./InfoPage.css";

type InfoPageProps = {
  onBack?: () => void;
};

export function InfoPage({ onBack }: InfoPageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="info-page">
      <header className="info-header">
        <h1 className="info-logo">FitDuo Arena</h1>
        <button className="info-back-btn" onClick={handleBack}>
          ← Back to home
        </button>
      </header>

      <main className="info-main">
        <section className="info-text">
          <h2 className="info-title">
            How FitDuo finds your perfect rival anywhere on Earth
          </h2>

          <div className="info-body">
            <p>
              When you tap "Find a Rival", FitDuo matches you by intensity, timezone,
              and preferred exercises so you aren't paired with a ghost or mismatch. Our
              algorithm considers your skill level, workout preferences, and availability to
              connect you with someone who will push you to perform your best.
            </p>

            <p>
              Global hotspots light up around the clock: NYC night-owls burning midnight
              calories, Hong Kong early birds starting their day with squats, London
              lunch-break warriors, and LA sunset sessions. No matter when you're ready,
              there's someone across the world ready to battle.
            </p>

            <h3 className="info-subtitle">
              {"What happens when you match".split(" ").map((word, index) => (
                <span
                  key={`what-happens-${word}-${index}`}
                  className="tagline-word"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h3>
            <ul className="info-list">
              <li>
                <strong>Smart pairing:</strong> We match you with players at a similar
                skill level and intensity preference
              </li>
              <li>
                <strong>Shared rules:</strong> Both players agree on exercise type,
                duration, and form standards before starting
              </li>
              <li>
                <strong>AI refereeing:</strong> Our computer vision system counts reps
                and validates form in real-time, ensuring fair competition
              </li>
              <li>
                <strong>Mutual accountability:</strong> When someone is counting on you,
                you show up. That's the power of global matchmaking.
              </li>
            </ul>

            <h3 className="info-subtitle">
              {"Why we built it this way".split(" ").map((word, index) => (
                <span
                  key={`why-built-${word}-${index}`}
                  className="tagline-word"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h3>
            <p>
              People show up more when someone is counting on them. By connecting you
              with real rivals across the globe, we create accountability that solo
              workouts can't match. Every battle is a commitment to yourself and your
              opponent—no ghosting, no excuses, just results.
            </p>
          </div>
        </section>

        <section className="info-globe">
          <div className="info-globe-wrapper">
            <Globe size={500} />
          </div>
          <p className="info-globe-caption">
            Each pulse represents a hotspot where players are currently queuing up or
            battling.
          </p>
        </section>
      </main>
    </div>
  );
}

