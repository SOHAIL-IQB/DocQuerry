const OpenAI = require("openai");

// Initialize OpenAI client specifically using the Groq API Base URL
// Requires process.env.GROQ_API_KEY
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY
});

module.exports = groq;
