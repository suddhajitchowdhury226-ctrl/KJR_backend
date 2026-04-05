const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error details:', err);
  }
}

test();
