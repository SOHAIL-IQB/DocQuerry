const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const DocumentChunk = require('./models/DocumentChunk');
const { generateAnswer } = require('./services/ragService');

async function runTest() {
  try {
    console.log('--- Phase 6: LLM Generation Test ---');
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'docuquery' });
    
    const chunk = await DocumentChunk.findOne();
    const userId = chunk.userId;

    const testQuestion = 'What is this document about?';
    console.log(`Asking: "${testQuestion}"`);
    
    const result = await generateAnswer(userId, testQuestion);
    
    console.log('\\n✅ Answer received from Gemini:');
    console.log(result.answer);
    
    console.log(`\\n✅ Sources used: ${result.sources.length}`);
    if (result.sources.length > 0) {
       console.log(`First source score: ${result.sources[0].score}`);
    }

    // Now test a hallucination prevention question
    const fakeQuestion = 'What is the secret launch code mentioned in the document?';
    console.log(`\\nAsking Fake Question: "${fakeQuestion}"`);
    const fakeResult = await generateAnswer(userId, fakeQuestion);
    
    console.log('\\n✅ Answer received from Gemini (Strict Test):');
    console.log(fakeResult.answer);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

runTest();
