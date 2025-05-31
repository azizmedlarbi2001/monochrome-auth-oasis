require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable is not set');
    process.exit(1);
}

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['POST'],
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Initialize the Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Debug log
        console.log('Received request at:', new Date().toISOString());
        console.log('Prompt length:', prompt.length);

        // Get the model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Generate content with timeout
        const timeoutMs = 30000; // 30 second timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
        );

        const generatePromise = model.generateContent(prompt);
        const result = await Promise.race([generatePromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        // Debug log
        console.log('Response generated successfully');

        return res.json({ text });
    } catch (error) {
        console.error('Error in Gemini API:', error);
        
        // Send appropriate error response based on error type
        if (error.message === 'Request timed out') {
            return res.status(504).json({
                error: 'Request timed out',
                details: 'The AI took too long to respond'
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to get AI response',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});
