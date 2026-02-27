const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDCpIpZJANvQC2sVPLlbhQsVVdZ4Q4Hxt4');

async function run() {
  try {
    // There is no direct listModels in the new SDK easily accessible, let me try a simple text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('hello');
    console.log('Gemini 1.5 Flash generated:', result.response.text());
  } catch (e) {
    console.error('Error with gemini-1.5-flash:', e.message);
  }
}
run();
