import React from "react";

function JobRecommendations() {
  return (
    <div className="dashboard-card">
      <h2>Top Job Recommendations</h2>

      <div>
        <h3>Software Development Engineer</h3>
        <p>Google</p>
        <button>Apply</button>
      </div>

      <hr />

      <div>
        <h3>Associate Software Engineer</h3>
        <p>TCS</p>
        <button>Apply</button>
      </div>

      <hr />

      <div>
        <h3>Frontend Developer</h3>
        <p>Infosys</p>
        <button>Apply</button>
      </div>
    </div>
  );
}

export default JobRecommendations;