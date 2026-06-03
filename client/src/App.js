import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Report from "./Report"; // ✅ FIXED
import History from "./History";
import "./App.css";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} /> {/* ✅ FIXED */}
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}

export default App;