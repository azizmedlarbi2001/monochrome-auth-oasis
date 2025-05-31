const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyA4b_YE0GEkYq4M6oURyQncrecZvLjtQjE');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to get AI response', details: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
