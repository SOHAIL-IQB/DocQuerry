require('dotenv').config();

let embedder;

/**
 * Initializes the @xenova/transformers local embedding model globally when the server starts.
 * This prevents cold starts on every request.
 */
async function initializeEmbedder() {
  if (!embedder) {
    try {
      const { pipeline } = await import('@xenova/transformers');
      embedder = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("MiniLM model loaded");
    } catch (error) {
      console.error("Failed to initialize embedder:", error);
      throw error;
    }
  }
}

/**
 * Generates an embedding vector for a given text chunk using the local Xenova pipeline.
 * @param {string} text - The input text chunk.
 * @returns {Promise<number[]>} - The numeric embedding vector.
 */
async function generateEmbedding(text) {
  if (!embedder) {
    throw new Error("Embedder not initialized. Call initializeEmbedder() first.");
  }
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

module.exports = {
  initializeEmbedder,
  generateEmbedding
};
