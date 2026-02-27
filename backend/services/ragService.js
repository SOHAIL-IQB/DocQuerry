const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');

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

module.exports = {
  retrieveRelevantChunks
};
