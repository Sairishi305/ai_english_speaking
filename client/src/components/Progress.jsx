import { useEffect, useState } from "react";
import "./Progress.css";

const WEEKLY_GOAL_MINUTES = 60;

function Progress() {
  const [progress, setProgress] = useState({
    streak: 0,
    weeklySeconds: 0,
    monthlySeconds: 0,
    wordsSpoken: 0,
    conversationsCompleted: 0,
    lastPracticeDate: null,
  });

  const loadProgress = () => {
    const saved = localStorage.getItem(
      "englishProgress"
    );

    if (saved) {
      try {
        setProgress({
          streak: 0,
          weeklySeconds: 0,
          monthlySeconds: 0,
          wordsSpoken: 0,
          conversationsCompleted: 0,
          lastPracticeDate: null,
          ...JSON.parse(saved),
        });
      } catch (error) {
        console.error(
          "Progress loading error:",
          error
        );
      }
    }
  };

  useEffect(() => {
    loadProgress();

    window.addEventListener(
      "englishProgressUpdated",
      loadProgress
    );

    return () => {
      window.removeEventListener(
        "englishProgressUpdated",
        loadProgress
      );
    };
  }, []);

  const speakingMinutes = Math.floor(
    progress.weeklySeconds / 60
  );

  const monthlyMinutes = Math.floor(
    progress.monthlySeconds / 60
  );

  const weeklyPercentage = Math.min(
    Math.round(
      (speakingMinutes /
        WEEKLY_GOAL_MINUTES) *
        100
    ),
    100
  );

  return (
    <section className="progress-dashboard">

      {/* Header */}

      <div className="progress-dashboard-header">
        <div>
          <h2>Your Progress</h2>

          <p>
            Keep practicing and build your
            English speaking habit.
          </p>
        </div>

        <div className="goal-badge">
          🎯 {WEEKLY_GOAL_MINUTES} min goal
        </div>
      </div>

      {/* Main Stats */}

      <div className="progress-stats">

        <div className="stat-card streak-card">
          <div className="stat-icon">
            🔥
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Daily Streak
            </span>

            <strong>
              {progress.streak}
            </strong>

            <small>
              {progress.streak === 1
                ? "day"
                : "days"}
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            🗣️
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Speaking
            </span>

            <strong>
              {speakingMinutes}
            </strong>

            <small>min this week</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            💬
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Words Spoken
            </span>

            <strong>
              {progress.wordsSpoken}
            </strong>

            <small>words</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ✅
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Conversations
            </span>

            <strong>
              {progress.conversationsCompleted}
            </strong>

            <small>completed</small>
          </div>
        </div>

      </div>

      {/* Weekly Goal */}

      <div className="weekly-goal-card">

        <div className="weekly-goal-top">

          <div>
            <h3>
              🏆 Weekly Speaking Goal
            </h3>

            <p>
              {speakingMinutes} /{" "}
              {WEEKLY_GOAL_MINUTES} minutes
            </p>
          </div>

          <div className="percentage">
            {weeklyPercentage}%
          </div>

        </div>

        <div className="progress-bar">

          <div
            className="progress-bar-fill"
            style={{
              width: `${weeklyPercentage}%`,
            }}
          />

        </div>

        <div className="goal-message">

          {weeklyPercentage >= 100
            ? "🎉 Weekly goal completed! Amazing work!"
            : weeklyPercentage >= 75
            ? "🔥 Almost there! Keep going!"
            : weeklyPercentage >= 50
            ? "💪 You're halfway there!"
            : "🌱 Keep practicing every day!"}

        </div>

      </div>

      {/* Additional Stats */}

      <div className="extra-progress">

        <div className="extra-card">

          <span className="extra-icon">
            📅
          </span>

          <div>
            <span>
              This Month
            </span>

            <strong>
              {monthlyMinutes} min
            </strong>
          </div>

        </div>

        <div className="extra-card">

          <span className="extra-icon">
            🎤
          </span>

          <div>
            <span>
              Practice Status
            </span>

            <strong>
              {progress.streak > 0
                ? "Active"
                : "Start today"}
            </strong>
          </div>

        </div>

        <div className="extra-card">

          <span className="extra-icon">
            📈
          </span>

          <div>
            <span>
              Goal Progress
            </span>

            <strong>
              {weeklyPercentage}%
            </strong>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Progress;