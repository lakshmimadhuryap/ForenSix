import React, { useState } from "react";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch(
        "https://forensix-zvdl.onrender.com/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await res.json();
      console.log(data);
      if(data.success){
        alert("Signup Successful");
      } else {
        alert(JSON.stringify(data));
      }
      
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>Sign Up</h1>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSignup}>
          Create Account
        </button>
      </div>
    </div>
  );
}

export default Signup;