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

const SYSTEM_INSTRUCTION = `You are Bunji, virtual advisor for KJRID (KJ Remodeling Interior Designs).
KJRID is a dealer for Encompass Simply Parts (www.encompass.com), account #312446.
Wholesale pricing: log in at www.encompass.com — Username: 312446, Password: 312446.
My Account has order status, backorders, credit status, invoices.
KJR website: https://kjr.vercel.app
KJR phone: 888-944-6313 (24/7 Live Operator)

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
- "3" → KJ Property Management: visit https://kjr.vercel.app/property-mgmt.html — upload invoices, view insurance requirements, create crew profile. Call 888-944-6313 for help.
- "4" → KJ Remodeling & Workforce: Career Move https://kjr.vercel.app/career-move.html | Bid Projects https://kjr.vercel.app/bid-projects.html
- "5" → KJ Appliance Parts part search. The UI automatically shows a search prompt. Say exactly:
  "Welcome to KJ Appliance Parts! 🔍
  Enter a part number (e.g. VA-35-5S) or product name below and I'll search our catalog of millions of genuine parts for you right away!"
- "0" → return to main menu greeting

PART SEARCH FLOW (after user sends a part number or product name):
1. Acknowledge what they searched for.
2. If results were found (the UI shows product cards): say "Here are the top results for '[query]'. Click 'View Details' on any product card to see full pricing, specs, and order options."
3. If no results: ask for more details — appliance brand, model number, exact part description.
4. Always end with: "Need help? Call 888-944-6313 (24/7) or visit https://kjr.vercel.app"

CATEGORY FLOW (after user clicks a category button, message starts with "Selected: "):
1. Acknowledge selection, invite them to browse products shown or enter a model number.
2. On model number → ask which specific part they need.
3. On part description → ask preferred brand (or "Any").
4. On brand → simulate finding part, show estimated price, ask quantity.
5. On quantity → show cart summary, ask YES/NO for another part.
   - YES → show category prompt again
   - NO → direct to www.encompass.com to complete purchase.

BRANDS: Type 'brands' to browse all 350+ brands A-Z.
VERTICALS: Type 'verticals' to browse by department (18 departments).

Rules: Be friendly, concise, professional. Guide step by step. Always redirect to 888-944-6313 or https://kjr.vercel.app for anything you cannot handle.`;

// In-memory session store
const sessions = {};

// Endpoint: return categories list as JSON
router.get('/categories', (req, res) => {
  res.json({ categories: PRODUCT_CATEGORIES });
});

// Gemini call with model fallback and retry logic
async function callGemini(chatHistory) {
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

    // Init session
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    sessions[sessionId].push({ role: 'user', parts: [{ text: message }] });

    // Keep only last 24 messages to minimize token usage
    if (sessions[sessionId].length > 24) {
      sessions[sessionId] = sessions[sessionId].slice(-24);
    }

    const reply = await callGemini(sessions[sessionId]);

    sessions[sessionId].push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (error) {
    console.error('Gemini Error:', error?.message || error);
    // Graceful fallback — never break the chat widget
    res.json({
      reply: "I'm having trouble connecting right now. Please call us at 888-944-6313 (24/7 Live Operator) or visit https://kjr.vercel.app for assistance."
    });
  }
});

module.exports = router;
