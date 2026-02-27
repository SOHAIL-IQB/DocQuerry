const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const DocumentChunk = require('./models/DocumentChunk');

const API_URL = 'http://localhost:5001/api';
const testUser = {
  email: `test_phase4_${Date.now()}@example.com`,
  password: 'password123',
};

async function runTests() {
  try {
    // Connect to DB directly to verify chunks
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Registering Test User ---');
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    const token = regRes.data.data.token;
    console.log('Registered. Token received.');

    console.log('\\n--- Testing Upload, Chunking & Embedding ---');
    
    // Create a reasonably long text to ensure it gets chunked
    let longText = '';
    for (let i = 0; i < 500; i++) {
      longText += 'This is paragraph ' + i + '. It contains enough text to eventually trigger a chunk split. ';
    }

    const form = new FormData();
    form.append('document', Buffer.from(longText), {
      filename: 'long_document.txt',
      contentType: 'text/plain'
    });

    console.log(`Uploading document of size ${longText.length} bytes...`);
    const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    const docId = uploadRes.data.data._id;
    console.log('Upload Success, File Name:', uploadRes.data.data.fileName);
    console.log('Document Status:', uploadRes.data.data.status);

    // Verify chunks in DB
    const chunks = await DocumentChunk.find({ documentId: docId }).sort({ chunkIndex: 1 });
    console.log(`\\nFound ${chunks.length} chunks generated in the database.`);
    
    if (chunks.length === 0) {
      throw new Error('No chunks were saved to the database.');
    }

    console.log(`First chunk has ${chunks[0].text.length} characters.`);
    console.log(`First chunk embedding vector length is ${chunks[0].embedding.length}.`);

    if (chunks[0].embedding.length === 0) {
      throw new Error('Embedding generation failed (empty vector).');
    }

    console.log('\\n--- Testing Delete Document (Should cascade chunks) ---');
    await axios.delete(`${API_URL}/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Document deleted.');

    // Verify chunks are deleted
    const chunksAfterDelete = await DocumentChunk.find({ documentId: docId });
    console.log(`Found ${chunksAfterDelete.length} chunks after deletion.`);
    
    if (chunksAfterDelete.length > 0) {
      throw new Error('Chunks were not successfully deleted when the document was deleted.');
    }

    console.log('\\n✅ Phase 4 Chunking & Embeddings tests passed successfully!');
    
  } catch (error) {
    console.error('\\n❌ Test Failed:');
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else {
      console.error('Node Error:', error.stack);
    }
    process.exit(1);
  } finally {
    // Close DB connection
    await mongoose.connection.close();
  }
}

runTests();
