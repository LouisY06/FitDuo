# 🏆 The Contender: Calisthenics Battle App

The Contender is a unique, strategy-driven, head-to-head calisthenics application that blends human strength and competitive intelligence, all judged with objective AI precision. It transforms simple bodyweight exercises into a thrilling, real-time sporting event.

## 🎯 Core Gameplay: The Strategic Duel

The app pits two players against each other in a series of no-equipment, bodyweight exercises (Push-ups, Squats, Planks, etc.).

**Format:** Best-of-three rounds.

**Winning:** The player who performs the highest number of repetitions or holds the longest time with perfect form wins the round.

**The Key Strategy:** The person who loses the current round earns the right to choose the exercise for the next round. This forces players to choose a challenge that targets the opponent's weakness while playing to their own strength.

## 🤖 AI Integration: The Judge, Coach, and Narrator

The application's unique features are driven by two distinct AI technologies working in concert:

### 1. The Computer Vision (CV) Judge (Objective Accuracy)

The player's own device (webcam or phone camera) acts as the unbiased official, ensuring fairness and accuracy.

- **Rep and Form Validation:** The CV engine (TensorFlow.js/MediaPipe) analyzes the player's movements in real-time. It only counts a repetition if the body hits the exact angles and depths required for perfect form (e.g., chest within one inch of the floor for a push-up).

- **Real-Time Feedback:** Players receive instant visual or audio cues (e.g., "Deeper!", "Perfect Rep") if their form falters.

### 2. The LLM Strategist (The Brain)

Powered by the Python backend (FastAPI + OpenRouter), the Large Language Model manages the strategy and experience.

- **Strategy Advisor:** After a round loss, the LLM analyzes the player's strengths/weaknesses and the opponent's performance history. It recommends the most advantageous counter-exercise for the loser to pick to maximize their chances of winning the next round.

- **Form Referee:** Before each round begins, the LLM generates the strict, official form rules for the chosen exercise, which are then enforced by the CV Judge, removing all human ambiguity.

- **Hype Generator / Narrator:** The LLM provides dramatic, personalized commentary and post-round analysis (e.g., "The Machine sees fit to bestow the title 'Tricep Terror' upon Person B..."), turning data into an engaging narrative.

## ⚡ Core App Features

- **Real-Time Synchronization:** Scores update instantly (rep-by-rep) across the network using WebSockets, giving players a true feeling of a neck-and-neck race.

- **Dynamic Difficulty:** The LLM can introduce adaptive handicaps (e.g., forcing a dominant player to perform a harder variation like a Diamond Push-up) to ensure balanced, highly challenging matches.

- **Battle History:** Detailed statistics are tracked, including personal records for every exercise, win/loss ratios, and streaks, fueling long-term competitive drive.

- **Universal Access:** The competition requires zero equipment, meaning battles can take place anywhere using a standard webcam or smartphone.

## 🚀 Technology Stack

- **Frontend:** React.js + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI (Python) + Uvicorn + WebSockets
- **CV Judge:** MediaPipe/TensorFlow.js (runs locally in browser)
- **LLM Intelligence:** OpenRouter API (Python SDK)
- **Database:** Cloud-based database (PostgreSQL)
- **Authentication:** Firebase Authentication
- **Hosting:** Vercel (Frontend) + Railway (Backend)
- **Multiplayer Sync:** WebSockets (Rep-by-Rep)

## 📚 Documentation

For technical implementation details, see [PLAN.md](./PLAN.md).
