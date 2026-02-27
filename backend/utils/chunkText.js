/**
 * Splits text into chunks of roughly 500-800 tokens with 100-150 tokens overlap.
 * Assuming ~4 characters per token:
 * Chunk size: 2500 chars (~625 tokens)
 * Overlap size: 500 chars (~125 tokens)
 * 
 * @param {string} text - The extracted text to chunk.
 * @returns {string[]} Array of overlapping text chunks.
 */
const chunkText = (text, chunkSize = 2500, overlapSize = 500) => {
  if (!text || typeof text !== 'string') return [];

  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    const chunk = text.substring(startIndex, endIndex);
    
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
    
    // Advance start index, accounting for overlap
    startIndex += (chunkSize - overlapSize);
  }

  return chunks;
};

module.exports = {
  chunkText
};
