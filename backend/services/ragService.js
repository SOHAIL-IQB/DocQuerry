const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const Document = require('../models/Document');
const { genAI } = require('../utils/gemini');
const { generateEmbedding } = require('../utils/embeddings');

/**
 * Retrieves the most relevant document chunks for a given query embedding.
 * Uses MongoDB Atlas Vector Search ($vectorSearch).
 * 
 * @param {string} userId - The ID of the user requesting the search (for workspace isolation).
 * @param {number[]} queryEmbedding - The 3072-dimensional vector representation of the query.
 * @param {string[]} documentIds - Optional array of document IDs to restrict the search.
 * @returns {Promise<Array>} - Array of matching chunks with chunkText, documentId, and similarity score.
 */
const retrieveRelevantChunks = async (userId, queryEmbedding, documentIds = []) => {
  try {
    // ONLY push userId to the Vector Search Native filter, as documentId is not indexed in Atlas
    const baseFilter = {
      userId: new mongoose.Types.ObjectId(userId)
    };

    // Pre-filter documents to ensure we only query those that have finished embedding processing ('Ready')
    let readyDocumentIds = [];
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
       const requestedIds = documentIds.filter(id => mongoose.Types.ObjectId.isValid(id));
       const readyDocs = await Document.find({
           _id: { $in: requestedIds },
           userId: new mongoose.Types.ObjectId(userId),
           status: 'Ready'
       }).select('_id');
       readyDocumentIds = readyDocs.map(doc => doc._id);
    } else {
       // "All Documents" mode - Pull all Ready documents for the user
       const readyDocs = await Document.find({
           userId: new mongoose.Types.ObjectId(userId),
           status: 'Ready'
       }).select('_id');
       readyDocumentIds = readyDocs.map(doc => doc._id);
    }

    // If there are literally no Ready documents available, bypass expensive Vector search
    if (readyDocumentIds.length === 0) {
        return [];
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 100, // Fetch broader set upfront to filter down in memory
          filter: baseFilter
        }
      },
      {
        $project: {
          _id: 0,
          chunkText: '$text', // Project mapping text to chunkText
          documentId: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    // Apply array-based document filtering AFTER vector search using $match, strictly limiting to Ready arrays
    pipeline.push({
      $match: {
        documentId: { $in: readyDocumentIds }
      }
    });

    // Enforce Document Diversity: Prevent a single document from monopolizing the "All Documents" context window
    pipeline.push(
      {
        // Group by document ID while preserving the sorted order from VectorSearch
        $group: {
          _id: '$documentId',
          chunks: {
            $push: {
              chunkText: '$chunkText',
              documentId: '$documentId',
              score: '$score'
            }
          }
        }
      },
      {
        // Keep ONLY the top 5 most relevant chunks per document
        $project: {
          topChunks: { $slice: ['$chunks', 5] }
        }
      },
      {
        // Flatten the array of chunks back into individual documents
        $unwind: '$topChunks'
      },
      {
        // Replace root to restore original chunk structure
        $replaceRoot: { newRoot: '$topChunks' }
      },
      {
        // Re-sort globally by vector score since grouping scrambles order
        $sort: { score: -1 }
      },
      {
        // Limit down to top 5 diverse chunks overall across all matched documents
        $limit: 5
      }
    );

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
 * @param {string[]} documentIds - Optional array of document IDs.
 * @returns {Promise<Object>} - Contains { answer: string, sources: Array }
 */
const generateAnswer = async (userId, question, documentIds = []) => {
  try {
    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(question);

    // 2. Retrieve relevant chunks (limits to 8)
    const sources = await retrieveRelevantChunks(userId, queryEmbedding, documentIds);

    if (!sources || sources.length === 0) {
      return {
        answer: "I could not find relevant information in the selected documents.",
        sources: []
      };
    }

    // 3. Construct Context Blocks
    let contextStr = '';
    sources.forEach((source, index) => {
      contextStr += `\n--- Chunk ${index + 1} ---\n${source.chunkText}\n`;
    });
    
    // Trim context length before sending to LLM (allow ~15,000 chars)
    contextStr = contextStr.slice(0, 15000);

    // 4. Construct Strict Prompt
    const prompt = `SYSTEM:
"You are an AI assistant answering questions strictly from the provided documents."

CONTEXT:
${contextStr}

QUESTION:
${question}`;

    // 5. Invoke Gemini LLM (Routed to Gemini 2.0 Flash to ensure stable API quota)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
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
    
    // Gracefully intercept Google Gemini Free Tier 429 Rate Limit Exhaustion
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      return {
        answer: "⚠️ **Gemini AI Rate Limit Reached.**\n\nYou are currently using the Google Gemini Free Tier, which limits the number of AI questions you can ask per minute. Please wait about 30-60 seconds and try sending your message again.",
        sources: []
      };
    }
    
    // Explicitly bubble up Model 404 errors as crashes so they don't get mistaken for Quota limits
    if (error.status === 404 || (error.message && error.message.includes('404'))) {
        console.error("SDK VERSION ERROR: Gemini Model Alias Not Found (404).");
        throw new Error('LLM Model Name Not Found.');
    }

    throw new Error('Failed to generate answer from LLM.');
  }
};

module.exports = {
  retrieveRelevantChunks,
  generateAnswer
};
