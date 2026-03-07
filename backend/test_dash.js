const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create valid token for testing
// I need a user id. 
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/docquery');
  const user = await User.findOne({});
  if (!user) return console.log('no user');
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  console.log('Got token for user', user.name);
  
  try {
    const resDocs = await axios.get('http://localhost:5001/api/documents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Docs success:', resDocs.data.success, 'Count:', resDocs.data.data?.length);
  } catch (err) {
    console.log('Docs err:', err.response?.data || err.message);
  }
  
  try {
    const resAnalytics = await axios.get('http://localhost:5001/api/users/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Analytics success:', resAnalytics.data.success);
  } catch (err) {
    console.log('Analytics err:', err.response?.data || err.message);
  }
  
  process.exit(0);
}
test();
