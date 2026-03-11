import OpenAI from "openai";

// Initialize OpenAI client specifically using the Groq API Base URL
// Requires process.env.GROQ_API_KEY
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY
});

export default groq;
