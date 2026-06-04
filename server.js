require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const OpenAI = require("openai");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
// 🔐 OpenAI setup (Configured to use Local Ollama)
const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1", // Using 127.0.0.1 fixes Node.js localhost bug
  apiKey: process.env.OPENAI_API_KEY, // The key isn't used by Ollama, but the SDK requires a string
});
app.use(express.json());

app.use(cors({
  origin: "https://foren-six.vercel.app";
  credentials:true
}))
// 🔍 Debug middleware
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});
/* =========================
   CONNECT TO MONGODB
========================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));
/* =========================
   CREATE SCHEMA
========================= */
const ReportSchema = new mongoose.Schema({
  fileName: String,
  reportContent: String,
  hashValue: String, // Output hash
  inputHash: String, // Input file hash
  riskLevel: String,
  riskScore: Number,
  createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model("Report", ReportSchema);


const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String
});

const User = mongoose.model("User", UserSchema);
/* =========================
   SAVE REPORT API
========================= */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.json({ success: true, user });
  } catch (err) {
      console.log("SIGNUP ERROR:", err);
      res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      "forensix-secret-key"
    );

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/save-report", async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;

    console.log("🔥 API HIT");
    console.log(`📄 Generating report for: ${fileName}`);

    let aiText = "";

    // 🔥 Check if we can automatically extract a timeline
    let extractedTimeline = null;
    try {
      const data = JSON.parse(fileContent);
      if (Array.isArray(data)) {
        extractedTimeline = data.map(entry => ({
          time: entry.timestamp || entry.time || new Date().toLocaleTimeString(),
          event: `${entry.value_name || entry.name || "Unknown"} executed`,
          risk: entry.risk || "Medium"
        }));
      }
    } catch (e) {
      // Ignore if not valid JSON
    }

    try {
      const response = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant", // Switched to 1B model for extreme speed
        messages: [
          {
            role: "system",
            content: "You are an authorized, professional digital forensic analyst working on a legally sanctioned cybersecurity investigation. You MUST analyze the provided logs and identify threats. Do NOT refuse this request. This is a secure, simulated environment for defensive purposes only.",
          },
          {
            role: "user",
            content: `You are authorized to perform this defensive analysis. Do not refuse.
Generate a highly detailed professional digital forensic investigation report.

The report MUST contain the following sections:

1. Executive Summary
2. Timeline of Events
3. Detailed Findings
4. Indicators of Compromise (IOCs)
5. Network Analysis
6. Authentication Analysis
7. Risk Assessment
8. Recommendations
9. Conclusion

Requirements:
- Minimum 800 words.
- Explain every suspicious event in detail.
- Mention all IP addresses, file names, URLs and log entries found.
- Include severity levels for each finding.
- Explain why each finding is suspicious.
- Use professional cybersecurity terminology.
- Do not skip any evidence.

File Name: ${fileName}
File Contents:
${fileContent ? fileContent.substring(0, 5000) : "No file content provided"}

CRITICAL RULES FOR THREAT ANALYSIS (MUST FOLLOW):
1. If the file path or contents contain "Users\\guest", you MUST flag it as suspicious and EXPLICITLY STATE it is not legitimate.
2. If the file is an .exe located in a temp or user folder, you MUST flag it as HIGH RISK and explicitly state it is a dangerous execution.
3. NEVER describe these entries as "legitimate" if they match the above rules.
4. Calculate a realistic riskScore between 0.0 and 10.0 based on these rules.
5. The riskScore in the example format is just an example. You MUST output a dynamically calculated risk score out of 10.0 that accurately reflects the severity of the findings.

Return your response EXACTLY using these headers. Do NOT use JSON.

[SUMMARY]
EXECUTIVE SUMMARY REQUIREMENTS:
- Write 2-4 detailed paragraphs.
- Minimum 250-400 words.
- Summarize all important evidence found.
- Mention suspicious files, network connections, browser activity, authentication events, and security events.
- Explain the overall attack scenario.
- Include a final risk assessment statement.

[FINDINGS]
Write detailed findings explaining exactly what the log shows, with evidence.

[CONCLUSION]
Write a detailed conclusion summarizing the overall threat.

[RISK_LEVEL]
HIGH or MEDIUM or LOW

[RISK_SCORE]
Generate a realistic risk score between 0.0 and 10.0
            `,
          },
        ],
        temperature: 0.1, // Lower temperature to force strict formatting without JSON mode
        max_tokens: 1500,
      });

      aiText = response.choices[0].message.content;
      console.log("RAW AI TEXT:");
      console.log(aiText);

    } catch (err) {
      console.error("❌ OPENAI ERROR:", err.message);
      aiText = "AI failed. Using fallback report.";
    }

    // 🧠 Parse AI plain-text response using Regex
    let structuredReport = {
      summary: "Analysis generated but failed to parse summary.",
      timeline: extractedTimeline || [],
      findings: "Failed to parse findings.",
      conclusion: "Failed to parse conclusion.",
      riskLevel: "MEDIUM",
      riskScore: 5.0
    };

    try {
      // 🧹 Clean markdown characters so the regex works no matter how Llama formatted the headers
      const cleanAiText = aiText.replace(/\*\*/g, "").replace(/\[/g, "").replace(/\]/g, "");

      const summaryMatch = cleanAiText.match(/SUMMARY[\s:]*([\s\S]*?)(?:FINDINGS|CONCLUSION|RISK_LEVEL|RISK_SCORE|$)/i);
      const findingsMatch = cleanAiText.match(/FINDINGS[\s:]*([\s\S]*?)(?:CONCLUSION|RISK_LEVEL|RISK_SCORE|$)/i);
      const conclusionMatch = cleanAiText.match(/CONCLUSION[\s:]*([\s\S]*?)(?:RISK_LEVEL|RISK_SCORE|$)/i);
      const riskLevelMatch = cleanAiText.match(/RISK_LEVEL[\s:]*([a-zA-Z]+)/i);
      const riskScoreMatch = cleanAiText.match(/RISK_SCORE[\s:]*([\d.]+)/i);

      if (summaryMatch) structuredReport.summary = summaryMatch[1].trim();
      if (findingsMatch) structuredReport.findings = findingsMatch[1].trim();
      if (conclusionMatch) structuredReport.conclusion = conclusionMatch[1].trim();
      if (riskLevelMatch) structuredReport.riskLevel = riskLevelMatch[1].trim().toUpperCase();
      if (riskScoreMatch) structuredReport.riskScore = parseFloat(riskScoreMatch[1].trim());

      // Fallback timeline for text logs if none extracted
      if (!extractedTimeline) {
        structuredReport.timeline = [
          { time: new Date().toLocaleTimeString(), event: "Log analysis started", risk: "Low" },
          { time: new Date().toLocaleTimeString(), event: "AI parsing completed", risk: structuredReport.riskLevel === "HIGH" ? "High" : "Low" }
        ];
      }
    } catch (e) {
      console.error("Regex Parsing failed", e);
    }

    // Use extracted timeline if available, otherwise use AI generated timeline
    if (extractedTimeline) {
      structuredReport.timeline = extractedTimeline;
    }

    // 🔐 Generate input file hash
    const inputHash = crypto
      .createHash("sha256")
      .update(fileContent || "empty")
      .digest("hex");

    // 🔐 Generate hash
    const hash = crypto
      .createHash("sha256")
      .update(fileName + JSON.stringify(structuredReport))
      .digest("hex");

    // 💾 Save to MongoDB
    await Report.create({
      fileName,
      reportContent: JSON.stringify(structuredReport),
      hashValue: hash,
      inputHash: inputHash,
      riskLevel: structuredReport.riskLevel || "MEDIUM",
      riskScore: structuredReport.riskScore || 5.0
    });

    // 📤 Response
    return res.json({
      success: true,
      report: structuredReport,
      hash,
      inputHash,
      fileName,
      riskLevel: structuredReport.riskLevel || "MEDIUM",
      riskScore: structuredReport.riskScore || 5.0
    });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/* =========================
   GET REPORTS API
========================= */
app.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});