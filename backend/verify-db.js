const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const DocumentChunk = require('./models/DocumentChunk');

const API_URL = 'http://localhost:5001/api';
const testUser = {
  email: `verify_db_${Date.now()}@example.com`,
  password: 'password123',
};

async function runVerification() {
  try {
    // 1. Confirm Mongoose is connected to database name: docuquery
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'docuquery' });
    const dbName = mongoose.connection.name;
    
    if (dbName !== 'docuquery') {
      throw new Error(`Mongoose connected to incorrect database: ${dbName}`);
    }

    console.log('--- Phase B: Re-Test Embedding Storage ---');
    console.log(`✅ Connected database name: ${dbName}`);

    // Register User
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    const token = regRes.data.data.token;

    // Trigger embedding process for one new document
    const form = new FormData();
    const mockText = "This is a verification document to test the embedding dimensionality and database routing.";
    form.append('document', Buffer.from(mockText), {
      filename: 'verify_doc.txt',
      contentType: 'text/plain'
    });

    console.log('\\nUploading document to trigger embedding process...');
    const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    const docId = uploadRes.data.data._id;
    
    // 2. Query documentchunks collection
    const collectionName = DocumentChunk.collection.name;
    const chunks = await DocumentChunk.find({ documentId: docId });
    
    console.log(`✅ Collection name: ${collectionName}`);
    console.log(`✅ Number of chunks inserted: ${chunks.length}\\n`);

    if (chunks.length === 0) {
      throw new Error('No chunks were generated.');
    }

    // 3. Confirm exact schema requirements for the first chunk
    const chunk = chunks[0];
    
    // embedding field exists
    if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
      throw new Error('Embedding field is missing or not an array.');
    }
    
    // embedding.length === 3072
    if (chunk.embedding.length !== 3072) {
      throw new Error(`Embedding length is incorrect. Expected 3072, got ${chunk.embedding.length}`);
    }
    console.log(`✅ Verified: embedding length === 3072`);
    
    // userId exists
    if (!chunk.userId) {
      throw new Error('userId is missing from the chunk.');
    }
    console.log(`✅ Verified: userId exists (${chunk.userId})`);
    
    // documentId exists
    if (!chunk.documentId) {
      throw new Error('documentId is missing from the chunk.');
    }
    console.log(`✅ Verified: documentId exists (${chunk.documentId})`);

    console.log('\\nAll verification checks passed successfully! Stopping here.');
    
  } catch (error) {
    console.error('\\n❌ Verification Failed:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

runVerification();
