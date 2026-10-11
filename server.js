require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are Hope, a compassionate, empathetic, and warm mental health wellness companion for young adults. 
- Your responses should be supportive, non-judgmental, gentle, and concise (2-4 sentences max). 
- Suggest simple coping mechanisms like breathing exercises when relevant. 
- Do NOT give medical diagnoses or prescriptions.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, apiKey } = req.body;
    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
    const dynamicAi = new GoogleGenAI({ apiKey: activeApiKey });

    const response = await dynamicAi.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nUser Message: ${message}` }] }
      ]
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ reply: "I'm sorry, I'm having trouble connecting right now." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));