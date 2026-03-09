/**
 * Splits text into chunks of roughly 4000 characters (approx 1000 tokens) to stay well within Gemini embedding limits while optimizing API 100 Request/Minute quotas.
 * 
 * @param {string} text - The extracted text to chunk.
 * @returns {string[]} Array of overlapping text chunks.
 */
const chunkText = (text, chunkSize = 4000, overlapSize = 400) => {
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
