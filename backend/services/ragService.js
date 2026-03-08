const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const { genAI, generateEmbedding } = require('../utils/gemini');

/**
 * Retrieves the most relevant document chunks for a given query embedding.
 * Uses MongoDB Atlas Vector Search ($vectorSearch).
 * 
 * @param {string} userId - The ID of the user requesting the search (for workspace isolation).
 * @param {number[]} queryEmbedding - The 3072-dimensional vector representation of the query.
 * @param {string|null} documentId - Optional document ID to restrict the search.
 * @returns {Promise<Array>} - Array of matching chunks with chunkText, documentId, and similarity score.
 */
const retrieveRelevantChunks = async (userId, queryEmbedding, documentId = null) => {
  try {
    const filterCondition = {
      userId: new mongoose.Types.ObjectId(userId)
    };
    if (documentId) {
      filterCondition.documentId = new mongoose.Types.ObjectId(documentId);
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 3,
          filter: filterCondition
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
 * @param {string|null} documentId - Optional document ID.
 * @returns {Promise<Object>} - Contains { answer: string, sources: Array }
 */
const generateAnswer = async (userId, question, documentId = null) => {
  try {
    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(question);

    // 2. Retrieve relevant chunks (limits to 3)
    const sources = await retrieveRelevantChunks(userId, queryEmbedding, documentId);

    if (sources.length === 0) {
      return {
        answer: 'I could not find this information in the selected document.',
        sources: []
      };
    }

    // 3. Construct Context Blocks
    let contextStr = '';
    sources.forEach((source, index) => {
      contextStr += `\n--- Chunk ${index + 1} ---\n${source.chunkText}\n`;
    });
    
    // Trim context length before sending to LLM
    contextStr = contextStr.slice(0, 3000);

    // 4. Construct Strict Prompt
    const prompt = `Context:
${contextStr}

Question:
${question}

Instructions:
You are an AI assistant that answers questions based ONLY on the provided document context.
If the answer is not found in the provided context, say:
"I could not find this information in the selected document."
Do not mix information from different documents.
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
