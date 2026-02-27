const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:5001/api';
const testUser = {
  email: `test_phase3_${Date.now()}@example.com`,
  password: 'password123',
};

async function runTests() {
  try {
    console.log('--- Registering Test User ---');
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    const token = regRes.data.data.token;
    console.log('Registered. Token received.');

    console.log('\\n--- Testing Upload & Text Extraction (TXT) ---');
    const form = new FormData();
    form.append('document', Buffer.from('Hello world from TXT document!'), {
      filename: 'sample.txt',
      contentType: 'text/plain'
    });

    const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    const docId = uploadRes.data.data._id;
    console.log('Upload Success, File Name:', uploadRes.data.data.fileName);
    console.log('Document Status:', uploadRes.data.data.status);

    console.log('\\n--- Testing Get Documents ---');
    const getRes = await axios.get(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Total Documents:', getRes.data.data.length);
    if(getRes.data.data.length !== 1) throw new Error('Document count mismatch');

    console.log('\\n--- Testing Rename Document ---');
    const renameRes = await axios.patch(`${API_URL}/documents/${docId}/rename`, 
      { newName: 'renamed_sample.txt' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Renamed To:', renameRes.data.data.fileName);

    console.log('\\n--- Testing Delete Document ---');
    const deleteRes = await axios.delete(`${API_URL}/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete Response:', deleteRes.data.data.message);

    const getRes2 = await axios.get(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Total Documents after delete:', getRes2.data.data.length);
    if(getRes2.data.data.length !== 0) throw new Error('Document not deleted');

    console.log('\\n✅ Phase 3 Document Management & Extraction tests passed successfully!');
    
  } catch (error) {
    console.error('\\n❌ Test Failed:');
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else {
      console.error('Node Error:', error.stack);
    }
    process.exit(1);
  }
}

runTests();
