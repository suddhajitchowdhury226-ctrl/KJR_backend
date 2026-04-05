const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test_models() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const result = await ai.models.list();
        console.log('Success:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error details:', err);
    }
}
test_models();
