/**
 * Splits text into chunks of roughly 1200 characters to optimize API quotas while sequentializing API usage.
 * 
 * @param {string} text - The extracted text to chunk.
 * @returns {string[]} Array of overlapping text chunks.
 */
const chunkText = (text, chunkSize = 1200, overlapSize = 200) => {
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
