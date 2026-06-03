import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Home() {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const navigate = useNavigate();

  // Handle file select
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setProgress(0);
    setError("");
  };

  // Handle drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setProgress(0);
    setError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Generate Report
  const generateReport = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);

    // Fake progress animation
    let currentProgress = 0;
    const fakeInterval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 85) clearInterval(fakeInterval);
    }, 100);

    try {
      let lastData = null;

      for (let file of files) {
        // Read the actual text content of the uploaded file
        const fileContent = await file.text();

        const response = await fetch("http://127.0.0.1:5000/save-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileName: file.name, fileContent }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Server error");
        }

        lastData = data;
      }

      // Finish progress
      clearInterval(fakeInterval);

      const finishInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(finishInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 30);

      // Small delay before navigation
      setTimeout(() => {
        navigate("/report", {
          state: {
            report: lastData.report,
            hash: lastData.hash,
            inputHash: lastData.inputHash,
            fileName: lastData.fileName,
          },
        });
      }, 800);

    } catch (err) {
      clearInterval(fakeInterval);
      setProgress(0);
      setLoading(false);
      setError(err.message || "Failed to generate report. Make sure the backend server and Ollama are running.");
      console.error("Error:", err);
    }
  };

  return (
    <div className="main">
      <div className="nav-header">
        <h1 style={{ marginBottom: 0, textAlign: 'left' }}>ForensiX</h1>
        <button className="btn-secondary" onClick={() => navigate("/history")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Saved Reports
        </button>
      </div>
      
      <p className="subtitle">Automated Digital Forensics Intelligence Platform</p>

      <div className="card">
        <h2>Upload Evidence</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "25px", fontSize: "0.95rem" }}>
          Upload system logs, metadata, or registry files for AI-powered forensic analysis.
        </p>

        {/* Error message */}
        {error && (
          <div className="error-msg fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div className="upload-container">
          {/* Upload box */}
          <label
            className={`upload-box ${isDragOver ? "drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input type="file" multiple onChange={handleFileChange} disabled={loading} />
            <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span className="upload-text">
              <strong>Click to browse</strong> or drag and drop files here
            </span>
          </label>

          {/* Show uploaded files */}
          {files.length > 0 && (
            <div className="file-list">
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "10px" }}>Files ready for analysis:</p>
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <svg className="file-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span className="file-name">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {loading && (
            <div className="progress-container fade-in">
              <div className="progress-text">
                <span>Analyzing patterns with AI...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button 
            className="btn-primary" 
            onClick={generateReport} 
            disabled={loading || files.length === 0}
            style={{ width: "100%", maxWidth: "600px", padding: "16px" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" style={{ animation: "spin 1s linear infinite" }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                Processing Evidence...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Generate Forensic Report
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Home;