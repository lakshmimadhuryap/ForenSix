import React from "react";
import { useLocation } from "react-router-dom";
import "./App.css";

function ReportPage() {

  const location = useLocation();
  const { report, hash } = location.state || {};

  return (
    <div className="main">

      <h1>Generated Report</h1>

      <div className="card">

        {/* Tabs */}
        <div className="tabs">
          <div className="tab">Executive Summary</div>
          <div className="tab">Timeline</div>
          <div className="tab">Findings</div>
          <div className="tab">Conclusion</div>
        </div>

        {/* Report text */}
        <div className="content-box">
          <p>{report}</p>
        </div>

        {/* Hash */}
        <h3>SHA-256 Hash:</h3>
        <p className="hash">{hash}</p>

        {/* Download button */}
        <button>Download PDF</button>

      </div>
    </div>
  );
}

export default ReportPage;