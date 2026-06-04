import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Report from "./Report"; // ✅ FIXED
import History from "./History";
import Login from "./Login";
import Signup from "./Signup";
import "./App.css";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} /> {/* ✅ FIXED */}
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

export default App;