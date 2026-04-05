const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function list_names() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const result = await ai.models.list();
        console.log('Model Names:', result.models.map(m => m.name));
    } catch (err) {
        console.error('Error details:', err);
    }
}
list_names();
