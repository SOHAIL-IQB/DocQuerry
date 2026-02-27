const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const DocumentChunk = require('./models/DocumentChunk');
const { generateEmbedding } = require('./utils/gemini');
const { retrieveRelevantChunks } = require('./services/ragService');

async function runRetrievalTest() {
  try {
    console.log('--- Phase 5: Re-Test Vector Search Retrieval ---');
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'docuquery' });
    
    // Find a user who has chunks
    const chunk = await DocumentChunk.findOne();
    if (!chunk) {
      throw new Error('No chunks found in docuquery database. Please upload a document first.');
    }
    const userId = chunk.userId;

    const testQueryMsg = 'What is this document about?';
    console.log(`Generating embedding for query: "${testQueryMsg}"`);
    const testQueryEmbedding = await generateEmbedding(testQueryMsg);
    
    console.log('Calling retrieveRelevantChunks...');
    const testResults = await retrieveRelevantChunks(userId, testQueryEmbedding);
    
    console.log(`\\n✅ Number of Results: ${testResults.length}`);
    
    if (testResults.length === 0) {
      throw new Error('0 results returned. Vector Search Index might still be building or is misconfigured.');
    }

    const firstResult = testResults[0];

    // Verify fields
    if (!firstResult.chunkText) throw new Error('chunkText is missing from the result.');
    if (typeof firstResult.score !== 'number') throw new Error(`score is missing or not a number: ${firstResult.score}`);

    console.log(`✅ First Result chunkText: "${firstResult.chunkText.substring(0, 75)}..."`);
    console.log(`✅ First Result Score: ${firstResult.score}`);

    console.log('\\nAll verification checks passed successfully! Stopping here.');
    
  } catch (error) {
    console.error('\\n❌ Verification Failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runRetrievalTest();
