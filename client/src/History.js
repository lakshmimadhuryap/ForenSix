import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/reports");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch reports");
        }

        setReports(data.reports || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleReportClick = (report) => {
    let parsedContent;
    try {
      parsedContent = typeof report.reportContent === "string" 
        ? JSON.parse(report.reportContent) 
        : report.reportContent;
    } catch (e) {
      parsedContent = { summary: report.reportContent };
    }

    navigate("/report", {
      state: {
        report: parsedContent,
        hash: report.hashValue,
        inputHash: report.inputHash,
        fileName: report.fileName,
      },
    });
  };

  return (
    <div className="main">
      <div className="nav-header">
        <h1 style={{ marginBottom: 0, textAlign: 'left' }}>Report History</h1>
        <button className="btn-ghost" onClick={() => navigate("/")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>
      </div>

      <p className="subtitle">View and download previously generated forensic reports.</p>

      {error && (
        <div className="error-msg fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "50px", color: "var(--accent-cyan)" }}>
          <svg className="animate-spin" style={{ animation: "spin 1s linear infinite" }} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <svg style={{ color: "var(--text-muted)", marginBottom: "20px" }} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <h3 style={{ color: "var(--text-main)", marginBottom: "10px" }}>No Reports Found</h3>
          <p style={{ color: "var(--text-muted)" }}>You haven't generated any forensic reports yet.</p>
        </div>
      ) : (
        <div className="history-grid">
          {reports.map((report) => (
            <div 
              key={report._id} 
              className="history-card fade-in"
              onClick={() => handleReportClick(report)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <svg style={{ color: "var(--accent-purple)" }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                <span className="history-date">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="history-title" title={report.fileName}>
                {report.fileName || "Unknown File"}
              </div>
              <div className="history-hash" title={report.hashValue}>
                {report.hashValue}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default History;
