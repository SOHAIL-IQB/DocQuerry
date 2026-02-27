const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates an embedding vector for a given text chunk using Gemini.
 * @param {string} text - The input text chunk.
 * @returns {Promise<number[]>} - The embedding vector.
 */
const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Gemini Embedding Error:', error);
    throw new Error('Failed to generate embedding');
  }
};

module.exports = {
  generateEmbedding,
  genAI // Exporting the AI instance for Phase 6 (Chat completion)
};
