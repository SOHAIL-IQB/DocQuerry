const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from a file buffer based on its mimetype.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimetype - The file MIME type.
 * @returns {Promise<string>} - Extracted text.
 */
const extractText = async (buffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } 
    else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } 
    else if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    } 
    else {
      throw new Error('Unsupported file type for text extraction.');
    }
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error('Failed to extract text from document: ' + error.message);
  }
};

module.exports = {
  extractText
};
