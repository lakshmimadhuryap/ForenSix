const OpenAI = require('openai');
const openai = new OpenAI({
  baseURL: "http://127.0.0.1:11434/v1",
  apiKey: "ollama"
});

async function main() {
  console.log("Starting generation...");
  const start = Date.now();
  try {
    const res = await openai.chat.completions.create({
      model: "llama3",
      messages: [{ role: "user", content: "Say hello in 5 words." }],
      max_tokens: 20
    });
    console.log("Response:", res.choices[0].message.content);
    console.log("Time taken:", (Date.now() - start) / 1000, "seconds");
  } catch(err) {
    console.log("Error:", err.message);
  }
}
main();
