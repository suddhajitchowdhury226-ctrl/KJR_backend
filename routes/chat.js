const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Full HVAC product category list
const PRODUCT_CATEGORIES = [
  "Accumulators & Receivers",
  "Adhesives",
  "Air Cleaners",
  "Air Filters",
  "Airflow Accessories",
  "Blower Components",
  "Brazing & Soldering Supplies",
  "Brazing & Soldering Tools",
  "Capacitors",
  "Caulking & Sealants",
  "Cleaners & Chemicals",
  "Coils",
  "Compressor Parts",
  "Compressors",
  "Condensate Drain Supplies",
  "Condensate Pumps",
  "Condenser Fan Motors",
  "Connected Home",
  "Construction Supplies",
  "Diffusers",
  "Double Shaft Motors",
  "Draft Inducer Motors",
  "Ducting & Sheet Metal",
  "Electrical",
  "Electrical Controls",
  "Evaporator and Blower Motors",
  "Exhaust & Supply Fans",
  "Fan Blades",
  "Fasteners",
  "Filter - Driers",
  "Fittings",
  "Gas Heat Controls",
  "Grilles",
  "Hand Tools",
  "Heat & Energy Recovery Ventilation",
  "Heat Pump Controls",
  "Inspection Tools",
  "Line Sets",
  "Miscellaneous Components",
  "Moisture Control & Zoning",
  "Motor Accessories",
  "Mounting Supplies",
  "Non-HVAC Items",
  "Oil Heat Controls",
  "Other Miscellaneous Installation Supplies",
  "Other Specialty Tools",
  "Pipe",
  "Power Tools",
  "Registers",
  "Refrigerant",
  "Residential Air Handlers",
  "Residential Coils",
  "Residential Equipment",
  "Residential Equipment Accessories",
  "Residential Mini Split Accessories",
  "Safety",
  "Service Tools",
  "Super Accessories",
  "Tape",
  "Test Tools",
  "Thermostat Guards & Thermostat Accessories",
  "Thermostats",
  "Tool Storage",
  "Ultraviolet",
  "Unit Heaters",
  "Valves",
  "Ventilators & Accessories",
  "Water Heaters"
];

// Build the numbered product list string for display in chat
function buildProductList() {
  let list = "📦 *KJ Appliance Parts — Product Categories*\n";
  list += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  PRODUCT_CATEGORIES.forEach((cat, index) => {
    list += `${index + 1}. ${cat}\n`;
  });
  list += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  list += "\n👉 Type the *number* of the category you want to browse.\n";
  list += "Example: Type **3** for Air Cleaners";
  return list;
}

const SYSTEM_INSTRUCTION = `
You are Bunji, the virtual advisor for KJRID.
KJRID is a dealer for Encompass Simply Parts (www.encompass.com).
KJRID account number is 312446, which accepts our business credit card.
To view wholesale pricing, users must log into www.encompass.com using the Sign In icon.
Username: 312446
Password: (same as account number) -> Do not change the password.
My Account section provides reports (order status, backorders, credit status, invoices).
The Encompass credit account is linked to the Bank of America Checking account Merchants online service.

Here is the full numbered product category list (used when user presses 5):
${PRODUCT_CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

Follow this interaction flow VERY STRICTLY:

1. When starting a conversation, always greet exactly:
   "Hello my name is Bunji, your virtual advisor
   PRESS # 1 for English
   PRESS # 2 for Spanish
   (In Preferred Language)
   For KJ Property Management, PRESS # 3
   For KJ Remodeling, PRESS # 4
   For KJ Appliance Parts, PRESS # 5"

2. If user replies "1":
   Confirm English is selected and repeat the main menu options 3, 4, 5.

3. If user replies "2":
   Switch to Spanish and repeat the main menu options 3, 4, 5 in Spanish.

4. If user replies "3": 
   Send them the link for KJ Property Management web site information.
   
5. If user replies "4": 
   Send them the link for KJ Work Force, Career Moves and Bid Projects web site information.

6. If user replies "5":
   The frontend UI automatically handles this — it shows the full product category grid as clickable buttons.
   Do NOT respond with a product list or ask for a model number.
   Simply say: "Please select a category from the list above to browse products. 👆"

7. When user sends a message like "Selected: [CATEGORY NAME]" (which means they clicked a category button in the UI):
   Acknowledge the selection and say:
   "Great choice! You selected [CATEGORY NAME]. 
   
   🛍️ Browse the products shown above and click BUY on any item you want.
   
   Need help finding a specific part? Enter your model number and I'll help you search!"

8. Once they enter a model number, ask:
   "Thank you! Searching for [MODEL NUMBER] in [CATEGORY NAME]...
   
   To confirm, which specific part are you looking for?
   Please describe the part or choose from common options for this category."

9. Once they provide the part description, ask:
   "We have millions of 100% genuine parts from over 350 manufacturers.
   Please choose your preferred brand, or type 'Any' to see all available brands for your part."

10. Once they provide a brand:
    Simulate finding the part. If simulated found:
    "✅ Great news! We found your part.
    
    📦 Part Details:
    • Category: [CATEGORY]
    • Model: [MODEL NUMBER]  
    • Brand: [BRAND]
    • Part: [PART DESCRIPTION]
    • Estimated Price: $[SIMULATED PRICE]
    
    How many units do you need?"
    
    When they reply with quantity:
    "🛒 Added to cart!
    
    • Item: [PART] x [QUANTITY]
    • Subtotal (before shipping): $[TOTAL]
    
    Would you like to find another part? (YES / NO)"
    
    If YES → go back to step 7 (show category list again).
    If NO → "Ready to checkout! Please visit www.encompass.com to complete your purchase, or provide your billing information below to proceed."

    If simulated not found:
    "❌ We could not find that exact part. Please provide more detailed information about the part you are looking for (part number, description, dimensions, etc.) and we will search again."

11. If user types "0" at any point → return to the main menu greeting.

IMPORTANT RULES:
- When displaying the product category list, ALWAYS show ALL 68 categories numbered 1-68. Never truncate or summarize the list.
- When a user types a number 1-68 after seeing the product list, treat it as a category selection.
- Always be helpful, friendly, and guide the user step by step.
- Keep track of the selected category throughout the conversation.
`;

// Helper: store chat histories in memory
const sessions = {};

// Endpoint: return categories list as JSON (used by frontend to render clickable buttons)
router.get('/categories', (req, res) => {
  res.json({ categories: PRODUCT_CATEGORIES });
});

router.post('/message', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing. Admin needs to configure it." });
    }

    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = [
        { role: 'user', parts: [{ text: "SYSTEM PROMPT: " + SYSTEM_INSTRUCTION }] },
        { role: 'model', parts: [{ text: "Understood. I am Bunji, ready to assist." }] }
      ];
    }

    // Append user message
    sessions[sessionId].push({ role: 'user', parts: [{ text: message }] });

    // Keep last 30 messages + system prompt to handle longer product flows
    let chatHistory = sessions[sessionId];
    if (chatHistory.length > 32) {
      chatHistory = [chatHistory[0], chatHistory[1], ...chatHistory.slice(-30)];
      sessions[sessionId] = chatHistory;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatHistory,
    });

    const reply = response.text;

    // Push model reply
    sessions[sessionId].push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to communicate with AI" });
  }
});

module.exports = router;
