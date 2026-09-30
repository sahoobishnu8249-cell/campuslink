import React from "react";

function StatsCards() {
  return (
    <div className="stats-grid">

      <div className="stat-card">
        <div className="stat-icon">📨</div>
        <div>
          <p>Total Applications</p>
          <h2>12</h2>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div>
          <p>Interviews Scheduled</p>
          <h2>3</h2>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⭐</div>
        <div>
          <p>Recommended Jobs</p>
          <h2>8</h2>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🎯</div>
        <div>
          <p>Skills to Improve</p>
          <h2>2</h2>
        </div>
      </div>

    </div>
  );
}

export default StatsCards;