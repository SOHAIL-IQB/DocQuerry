const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates an embedding vector for a given text chunk using Gemini.
 * @param {string} text - The input text chunk.
 * @returns {Promise<number[]>} - The embedding vector.
 */
const generateEmbedding = async (text, maxRetries = 3) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        console.warn(`[Gemini API] Rate Limit Hit (429). Retrying attempt ${attempt + 1}/${maxRetries} in 60s...`);
        await sleep(61000); // 1 minute + 1s buffer for Free Tier RPM limits
        continue;
      }
      console.error('Gemini Embedding Error:', error);
      throw new Error('Failed to generate embedding');
    }
  }
};

/**
 * Generates embeddings for multiple text chunks using Gemini batch processing.
 * Includes automatic exponential backoff for 429 Rate Limit exhaustion.
 * @param {string[]} texts - Array of input text chunks.
 * @returns {Promise<number[][]>} - Array of embedding vectors.
 */
const generateEmbeddingsBatch = async (texts, maxRetries = 3) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const requests = texts.map(text => ({
    content: { role: "user", parts: [{ text }] }
  }));
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.batchEmbedContents({ requests });
      return result.embeddings.map(emb => emb.values);
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
         console.warn(`[Gemini API Batch] Rate Limit Hit (429). Retrying attempt ${attempt + 1}/${maxRetries} in 60s...`);
         await sleep(61000); // Wait 61 seconds for the quota bucket to drain
         continue;
      }
      console.error('Gemini Batch Embedding Error:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  genAI // Exporting the AI instance for Phase 6 (Chat completion)
};
