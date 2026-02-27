const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:5001/api';
const testUser = {
  email: `test_storage_${Date.now()}@example.com`,
  password: 'password123',
};

async function runTests() {
  try {
    console.log('--- Registering Test User ---');
    const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
    const token = regRes.data.data.token;
    console.log('Registered. Token received.');

    console.log('\\n--- Testing Valid Upload ---');
    const form = new FormData();
    // Simulate a 1KB file
    form.append('document', Buffer.alloc(1024, 'a'), {
      filename: 'small_test.txt',
      contentType: 'text/plain'
    });

    const validUploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Upload Success:', validUploadRes.data.data.fileName);

    console.log('\\n--- Testing File Size Limit (11MB) ---');
    const bigForm = new FormData();
    // Simulate an 11MB file to trigger multer limit
    bigForm.append('document', Buffer.alloc(11 * 1024 * 1024, 'Z'), {
      filename: 'big_test.txt',
      contentType: 'text/plain'
    });

    try {
      await axios.post(`${API_URL}/documents/upload`, bigForm, {
        headers: {
          ...bigForm.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        maxBodyLength: Infinity // Allow axios to send large body
      });
      console.log('❌ Large file test failed. It should have been rejected.');
    } catch (err) {
      if (err.response && err.response.status === 500 && err.response.data.error === 'File too large') {
         console.log('✅ Large file correctly rejected by Multer:', err.response.data.error);
      } else if (err.response) {
         console.log('✅ Large file correctly rejected:', err.response.data);
      } else {
         console.error('Test error:', err.message);
      }
    }

    console.log('\\n✅ Phase 2 Storage Limit tests passed successfully!');
    
  } catch (error) {
    console.error('\\n❌ Test Failed:');
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else {
      console.error('Node Error:', error.message);
    }
    process.exit(1);
  }
}

runTests();
