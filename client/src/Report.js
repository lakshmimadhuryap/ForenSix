import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./App.css";

function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  // Destructure state with fallbacks
  const report = location.state?.report || {
    summary: "No data available.",
    timeline: "No timeline generated.",
    findings: "No findings available.",
    conclusion: "No conclusion reached."
  };
  const hash = location.state?.hash || "N/A";
  const fileName = location.state?.fileName || "Unknown File";

  const [activeTab, setActiveTab] = useState("summary");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Helper to safely format AI output whether it's text or JSON Object
  const formatContent = (content) => {
    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === "object" && parsed !== null) {
          return JSON.stringify(parsed, null, 2);
        }
      } catch (e) {
        // It's just a normal string, fall through
      }
      return content;
    }
    if (typeof content === "object" && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    return content;
  };

  const handleDownloadPdf = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);

    try {
      // Temporarily add a class to format for PDF
      element.classList.add("pdf-container");
      
      // We need to show all tabs for the PDF
      const currentTab = activeTab;
      setActiveTab("all"); // We'll add logic to render all tabs temporarily if "all"

      // Wait a tiny bit for the DOM to update to "all" tabs
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Forensic_Report_${fileName}.pdf`);

      // Restore state
      element.classList.remove("pdf-container");
      setActiveTab(currentTab);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Logic check: if someone tries to access /report directly without state
  if (!location.state) {
    return (
      <div className="main">
        <div className="card">
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <svg style={{ color: "var(--danger)", marginBottom: "20px" }} xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h2>No Report Found</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>You need to analyze a file first.</p>
            <button className="btn-primary" onClick={() => navigate("/")}>Go Back to Upload</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="nav-header">
        <h1 style={{ marginBottom: 0, textAlign: 'left' }}>ForensiX Report</h1>
        <button className="btn-ghost" onClick={() => navigate("/")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>
      </div>

      <div className="card report-card">
        {/* We attach the ref here to capture the whole report block */}
        <div ref={reportRef} style={{ padding: "20px" }}>
          
          <div style={{ borderBottom: "1px solid var(--card-border)", paddingBottom: "20px", marginBottom: "30px" }}>
            <h2 style={{ color: "var(--accent-cyan)", fontSize: "1.8rem", marginBottom: "10px" }}>Forensic Analysis Report</h2>
            <div style={{ display: "flex", gap: "20px", color: "var(--text-muted)", fontSize: "0.9rem", flexWrap: "wrap" }}>
              <p><strong>Evidence File:</strong> <span style={{ color: "var(--text-main)" }}>{fileName}</span></p>
              <p><strong>Date Generated:</strong> <span style={{ color: "var(--text-main)" }}>{new Date().toLocaleString()}</span></p>
            </div>
            
            {/* 🎯 Risk Highlighting & Evidence Confidence Score */}
            <div className="risk-score-container" style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
              <div className="risk-box" style={{ background: "rgba(255, 255, 255, 0.05)", padding: "15px", borderRadius: "12px", border: "1px solid var(--card-border)", flex: 1 }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>Threat Level</h4>
                <span className={`risk-badge ${report.riskLevel?.toLowerCase() || 'medium'}`} style={{ fontSize: "1.2rem", fontWeight: "bold", padding: "5px 12px", borderRadius: "6px", display: "inline-block", textTransform: "uppercase" }}>
                  {report.riskLevel || "MEDIUM"}
                </span>
              </div>
              <div className="risk-box" style={{ background: "rgba(255, 255, 255, 0.05)", padding: "15px", borderRadius: "12px", border: "1px solid var(--card-border)", flex: 1 }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>Evidence Confidence Score</h4>
                <span className="confidence-score" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)" }}>
                  {report.riskScore !== undefined ? report.riskScore : "5.0"} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ 10</span>
                </span>
              </div>
            </div>
          </div>

          {/* 🔘 NAVIGATION TABS (Hide during PDF generation) */}
          <div className={`tab-container ${activeTab === 'all' ? 'hidden' : ''}`}>
            {["summary", "timeline", "findings", "conclusion"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "tab-btn active" : "tab-btn"}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ✅ CONTENT AREA */}
          <div className="report-content">
            <div className={`report-section ${activeTab === "summary" || activeTab === "all" ? "fade-in" : "hidden"}`} style={{ marginBottom: activeTab === 'all' ? '30px' : '0' }}>
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Executive Summary
              </h3>
              <p className="report-text">{formatContent(report.summary)}</p>
            </div>

            <div className={`report-section ${activeTab === "timeline" || activeTab === "all" ? "fade-in" : "hidden"}`} style={{ marginBottom: activeTab === 'all' ? '30px' : '0' }}>
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Event Timeline
              </h3>
              {Array.isArray(report.timeline) && report.timeline.length > 0 ? (
                <div className="timeline-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {report.timeline.map((item, idx) => {
                    let icon = "🟢";
                    const riskLower = item.risk?.toLowerCase() || "";
                    if (riskLower === "high") icon = "🔴";
                    else if (riskLower === "medium") icon = "🟠";
                    else if (riskLower === "suspicious") icon = "⚠️";
                    
                    return (
                      <div key={idx} className="timeline-item" style={{ display: "flex", alignItems: "center", gap: "15px", background: "rgba(0,0,0,0.2)", padding: "12px 15px", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
                        <span className="time" style={{ color: "var(--accent-cyan)", fontFamily: "monospace", fontWeight: "bold", minWidth: "80px" }}>{item.time}</span>
                        <span style={{ color: "var(--text-muted)" }}>→</span>
                        <span className="event" style={{ flex: 1, color: "var(--text-main)" }}>{item.event}</span>
                        <span className="risk" style={{ fontSize: "1.2rem" }}>{icon}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", border: "1px solid var(--card-border)", textAlign: "center", color: "var(--text-muted)" }}>
                  No timeline events were extracted from the evidence file.
                </div>
              )}
            </div>

            <div className={`report-section ${activeTab === "findings" || activeTab === "all" ? "fade-in" : "hidden"}`} style={{ marginBottom: activeTab === 'all' ? '30px' : '0' }}>
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Detailed Findings
              </h3>
              {report.findings ? (
                <pre className="data-display">{formatContent(report.findings)}</pre>
              ) : (
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", border: "1px solid var(--card-border)", textAlign: "center", color: "var(--text-muted)" }}>
                  No specific findings generated.
                </div>
              )}
            </div>

            <div className={`report-section ${activeTab === "conclusion" || activeTab === "all" ? "fade-in" : "hidden"}`} style={{ marginBottom: activeTab === 'all' ? '30px' : '0' }}>
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Conclusion
              </h3>
              <p className="report-text">{formatContent(report.conclusion)}</p>
            </div>
          </div>

          {/* 🔐 HASH SECTION */}
          <div className="hash-section">
            <h3>SHA-256 Digital Signatures</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "15px" }}>
              These hashes mathematically prove the integrity of the original evidence and this generated report. Any alteration will result in a different hash signature.
            </p>
            <div style={{ marginBottom: "12px" }}>
              <strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>Input File Hash (Evidence Integrity):</strong>
              <code className="hash-display" style={{ display: "block", marginTop: "4px" }}>{location.state?.inputHash || "N/A"}</code>
            </div>
            <div>
              <strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>Report Hash (Generated Output):</strong>
              <code className="hash-display" style={{ display: "block", marginTop: "4px" }}>{hash}</code>
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="btn-primary" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin" style={{ animation: "spin 1s linear infinite" }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Official PDF
              </>
            )}
          </button>
          <button className="btn-secondary" onClick={() => navigate("/")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Analyze New File
          </button>
        </div>
      </div>
    </div>
  );
}

export default Report;