const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Requires GEMINI_API_KEY in .env

const SYSTEM_INSTRUCTION = `
You are Bunji, the virtual advisor for KJRID.
KJRID is a dealer for Encompass Simply Parts (www.encompass.com).
KJRID account number is 312446, which accepts our business credit card.
To view wholesale pricing, users must log into www.encompass.com using the Sign In icon.
Username: 312446
Password: (same as account number) -> Do not change the password.
My Account section provides reports (order status, backorders, credit status, invoices).
The Encompass credit account is linked to the Bank of America Checking account Merchants online service.

Follow this interaction flow VERY STRICTLY:
1. When starting a conversation, always greet exactly:
   "Hello my name is Bunji, your virtual advisor
   PRESS # 1 for English
   PRESS # 2 for Spanish
   (In Preferred Language)
   For KJ Property Management, PRESS # 3
   For KJ Remodeling, PRESS # 4
   For KJ Appliance Parts, PRESS # 5"

2. If user replies "3": 
   Send them the link for KJ Property Management web site information.
   
3. If user replies "4": 
   Send them the link for KJ Work Force, Career Moves and Bid Projects web site information.

4. If user replies "5":
   Say: 
   "KJRID is your Appliance Parts Dealer (A Partner with Encompass)
   First you must log into your account or create an account if you do not have one.
   Before we continue, please enter your Parts Model Number now?"

5. Once they enter a model number, ask:
   "To help us find your part, please tell me which part you are looking for?
   Options: Home Appliance, HVAC, Commercial Appliance, Consumer electronics, Computer and Tablet, Coffee & small Appliance, HVAC Truck Stock, Grills & Outdoor Kitchen, Vacuum, Print Imaging, Household Cleaners, Pool & Spa, Lawn & Garden, Power Tools, Mobile Parts & Accessories, Installation Supplies, Plumbing, Home Maintenance, Fitness, Accessories, Service Aids & Tools, Personal Care, Health & Wellness, Auto & Garage, Repair and return Service"

6. Once they provide the part type, ask:
   "Thank you; there is just one more thing, We provide Parts from Over 350 Manufacturers please view all Brands and choose one? Millions of 100% genuine parts are available for fast shipping from all of your trusted brands."

7. Once they provide a brand, simulate finding the part. If simulated found:
   Ask: "We found your part. How many do you need?" 
   When they reply with quantity, say: "Your item is added into your cart. Your cost before shipping: [Simulate a price]. Can I help you find another part? (YES / NO)"
   If YES -> go back to Option #5 flow.
   If NO -> "Ready to check out. Please provide all of your billing information"

   If simulated not found:
   "We did not find your part. We need more information to find your part? Please enter detailed information about your part you are looking for in the field below?"
`;

// Helper: store chat histories in memory (for dev purposes, production would use DB/redis)
const sessions = {};

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
      // Initialize new session history with system prompt
      sessions[sessionId] = [
        { role: 'user', parts: [{ text: "SYSTEM PROMPT: " + SYSTEM_INSTRUCTION }] },
        { role: 'model', parts: [{ text: "Understood. I am Bunji." }] }
      ];
    }

    // append user message
    sessions[sessionId].push({ role: 'user', parts: [{ text: message }] });

    // Ensure we don't exceed a massive list, keep last 20 messages + system prompt
    let chatHistory = sessions[sessionId];
    if (chatHistory.length > 22) {
      chatHistory = [chatHistory[0], chatHistory[1], ...chatHistory.slice(-20)];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatHistory,
    });

    const reply = response.text;
    
    // push model reply
    sessions[sessionId].push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to communicate with AI" });
  }
});

module.exports = router;
