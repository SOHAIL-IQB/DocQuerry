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

/**
 * Generates embeddings for multiple text chunks using Gemini batch processing.
 * @param {string[]} texts - Array of input text chunks.
 * @returns {Promise<number[][]>} - Array of embedding vectors.
 */
const generateEmbeddingsBatch = async (texts) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const requests = texts.map(text => ({
      content: { role: "user", parts: [{ text }] }
    }));
    
    const result = await model.batchEmbedContents({ requests });
    return result.embeddings.map(emb => emb.values);
  } catch (error) {
    console.error('Gemini Batch Embedding Error:', error);
    throw new Error('Failed to generate batch embeddings');
  }
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  genAI // Exporting the AI instance for Phase 6 (Chat completion)
};
