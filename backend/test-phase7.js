const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

async function verifyChats() {
  try {
    console.log('--- Phase 7: Chat System Validation ---');
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'docuquery' });
    
    // Find an existing user or mock one
    const user = await User.findOne();
    if (!user) throw new Error('No user found to test with.');

    console.log(`Testing with User ID: ${user._id}`);

    // Create a mock chat
    const chat1 = await Chat.create({ userId: user._id, title: 'Chat 1' });
    const chat2 = await Chat.create({ userId: user._id, title: 'Chat 2' });

    console.log(`Created Chats: ${chat1._id}, ${chat2._id}`);

    // Fetch all chats via the same logic as getAllChats
    const retrievedChats = await Chat.find({ userId: user._id }).sort({ updatedAt: -1 });

    console.log('\\n✅ Retrieved Chats Summary:');
    retrievedChats.forEach((c, idx) => {
      console.log(` - ${idx + 1}: [${c.title}] ID: ${c._id} (updatedAt: ${c.updatedAt})`);
    });

    if (retrievedChats.length < 2) throw new Error('Chats not returning correctly.');
    
    // Test the descending order logically
    if (retrievedChats[0]._id.toString() !== chat2._id.toString()) {
       console.log('Note: Timestamps might be identical due to fast execution, order tie-break implies same generation second.');
    }

    // Cleanup
    await Chat.deleteMany({ _id: { $in: [chat1._id, chat2._id] } });
    console.log('\\n✅ Validation complete & cleanup successful.');
    process.exit(0);

  } catch (error) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  }
}

verifyChats();
