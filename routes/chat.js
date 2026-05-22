const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Full HVAC product category list
const PRODUCT_CATEGORIES = [
  "Accumulators & Receivers", "Adhesives", "Air Cleaners", "Air Filters",
  "Airflow Accessories", "Blower Components", "Brazing & Soldering Supplies",
  "Brazing & Soldering Tools", "Capacitors", "Caulking & Sealants",
  "Cleaners & Chemicals", "Coils", "Compressor Parts", "Compressors",
  "Condensate Drain Supplies", "Condensate Pumps", "Condenser Fan Motors",
  "Connected Home", "Construction Supplies", "Diffusers", "Double Shaft Motors",
  "Draft Inducer Motors", "Ducting & Sheet Metal", "Electrical",
  "Electrical Controls", "Evaporator and Blower Motors", "Exhaust & Supply Fans",
  "Fan Blades", "Fasteners", "Filter - Driers", "Fittings", "Gas Heat Controls",
  "Grilles", "Hand Tools", "Heat & Energy Recovery Ventilation",
  "Heat Pump Controls", "Inspection Tools", "Line Sets", "Miscellaneous Components",
  "Moisture Control & Zoning", "Motor Accessories", "Mounting Supplies",
  "Non-HVAC Items", "Oil Heat Controls", "Other Miscellaneous Installation Supplies",
  "Other Specialty Tools", "Pipe", "Power Tools", "Registers", "Refrigerant",
  "Residential Air Handlers", "Residential Coils", "Residential Equipment",
  "Residential Equipment Accessories", "Residential Mini Split Accessories",
  "Safety", "Service Tools", "Super Accessories", "Tape", "Test Tools",
  "Thermostat Guards & Thermostat Accessories", "Thermostats", "Tool Storage",
  "Ultraviolet", "Unit Heaters", "Valves", "Ventilators & Accessories", "Water Heaters"
];

// Compact system instruction — no duplicate product list, concise rules
const SYSTEM_INSTRUCTION = `You are Bunji, virtual advisor for KJRID (KJ Remodeling Interior Designs).
KJRID is a dealer for Encompass Simply Parts (www.encompass.com), account #312446.
Wholesale pricing: log in at www.encompass.com — Username: 312446, Password: 312446.
My Account has order status, backorders, credit status, invoices.

MENU FLOW:
On first message, greet exactly:
"Hello my name is Bunji, your virtual advisor
PRESS # 1 for English
PRESS # 2 for Spanish
For KJ Property Management, PRESS # 3
For KJ Remodeling, PRESS # 4
For KJ Appliance Parts, PRESS # 5"

- "1" → confirm English, show options 3/4/5
- "2" → switch to Spanish, show options 3/4/5 in Spanish
- "3" → share KJ Property Management website info
- "4" → share KJ Workforce/Career/Bid Projects website info
- "5" → UI shows category grid automatically. Just say: "Please select a category from the list above. 👆"
- "0" → return to main menu greeting

CATEGORY FLOW (after user clicks a category button, message starts with "Selected: "):
1. Acknowledge selection, invite them to browse or enter a model number
2. On model number → ask which specific part they need
3. On part description → ask preferred brand (or "Any")
4. On brand → simulate finding part, show details with estimated price, ask quantity
5. On quantity → show cart summary, ask YES/NO for another part
   - YES → show category prompt again
   - NO → direct to www.encompass.com to complete purchase

If part not found → ask for more details (part number, dimensions, etc.)

BRANDS: "We carry 350+ brands! Type 'brands' to browse A-Z."

Rules: Be friendly, concise, guide step by step. Track selected category throughout conversation.`;

// In-memory session store
const sessions = {};

// Endpoint: return categories list as JSON
router.get('/categories', (req, res) => {
  res.json({ categories: PRODUCT_CATEGORIES });
});

// Gemini call using systemInstruction (not injected into history) + model fallback
async function callGemini(chatHistory) {
  // gemini-2.0-flash-lite has its own quota pool — try it first
  const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];
  const retryDelayMs = 1500;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          config: { systemInstruction: SYSTEM_INSTRUCTION },
          contents: chatHistory,
        });
        return response.text;
      } catch (err) {
        const msg = err?.message || '';
        const isRetryable = msg.includes('503') || msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') || msg.includes('429') ||
          msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
        console.warn(`Gemini [${model}] attempt ${attempt}: ${msg.slice(0, 120)}`);
        if (isRetryable && attempt < 2) {
          await new Promise(r => setTimeout(r, retryDelayMs));
          continue;
        }
        break; // move to next model
      }
    }
  }
  throw new Error('Bunji is busy right now. Please try again in a moment.');
}

router.post('/message', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required.' });
    }

    // Init session — no system prompt in history anymore (passed via config)
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    sessions[sessionId].push({ role: 'user', parts: [{ text: message }] });

    // Keep only last 12 exchanges (24 messages) to minimize token usage
    if (sessions[sessionId].length > 24) {
      sessions[sessionId] = sessions[sessionId].slice(-24);
    }

    const reply = await callGemini(sessions[sessionId]);

    sessions[sessionId].push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (error) {
    console.error('Gemini Error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to communicate with AI.' });
  }
});

module.exports = router;
