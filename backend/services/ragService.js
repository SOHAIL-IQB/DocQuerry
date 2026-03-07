const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const { genAI, generateEmbedding } = require('../utils/gemini');

/**
 * Retrieves the most relevant document chunks for a given query embedding.
 * Uses MongoDB Atlas Vector Search ($vectorSearch).
 * 
 * @param {string} userId - The ID of the user requesting the search (for workspace isolation).
 * @param {number[]} queryEmbedding - The 3072-dimensional vector representation of the query.
 * @returns {Promise<Array>} - Array of matching chunks with chunkText, documentId, and similarity score.
 */
const retrieveRelevantChunks = async (userId, queryEmbedding) => {
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 5,
          filter: {
            userId: new mongoose.Types.ObjectId(userId)
          }
        }
      },
      {
        $project: {
          _id: 0,
          chunkText: '$text', // The schema field is 'text', so we map it to 'chunkText' in the output
          documentId: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await DocumentChunk.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error('Error in retrieveRelevantChunks:', error);
    throw new Error('Failed to retrieve relevant documents.');
  }
};

/**
 * Generates an answer to a user's question purely based on the retrieved context chunks.
 * Uses Google Gemini 1.5 Flash with strict grounding instructions.
 * 
 * @param {string} userId - The ID of the user (for workspace isolation).
 * @param {string} question - The user's prompt question.
 * @returns {Promise<Object>} - Contains { answer: string, sources: Array }
 */
const generateAnswer = async (userId, question) => {
  try {
    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(question);

    // 2. Retrieve relevant chunks (already limits to 5)
    const sources = await retrieveRelevantChunks(userId, queryEmbedding);

    if (sources.length === 0) {
      return {
        answer: 'The uploaded documents do not contain this information.',
        sources: []
      };
    }

    // 3. Construct Context Blocks
    let contextStr = '';
    sources.forEach((source, index) => {
      contextStr += `\\n--- Chunk ${index + 1} ---\\n${source.chunkText}\\n`;
    });

    // 4. Construct Strict Prompt
    const prompt = `Context:
${contextStr}

Question:
${question}

Instructions:
Answer strictly using the context above.
If the answer is not found, respond with:
"The uploaded documents do not contain this information."
Do not guess or fabricate information.

Formatting Rules:
- Use numbered lists for multiple questions or steps
- Separate the question and answer clearly if addressing multiple parts
- Avoid long single paragraphs; break text into readable chunks
- Structure the output clearly using standard markdown formatting for UI readability
- Do not include the original question in the answer unless necessary for context`;

    // 5. Invoke Gemini LLM
    const model = genAI.getGenerativeModel({ 
      model: 'models/gemini-flash-latest',
      generationConfig: {
        temperature: 0.2
      }
    });

    const result = await model.generateContent(prompt);
    const answer = result?.response?.text?.() || "The uploaded documents do not contain this information.";

    // 6. Return exact payload
    return {
      answer: answer,
      sources: sources
    };

  } catch (error) {
    console.error('Error in generateAnswer:', error);
    throw new Error('Failed to generate answer from LLM.');
  }
};

module.exports = {
  retrieveRelevantChunks,
  generateAnswer
};
