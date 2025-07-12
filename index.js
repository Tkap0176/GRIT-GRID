// index.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// IMPORTANT: Your API key is loaded from an environment variable for security.
// DO NOT hardcode your API key here.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set.');
    // In a production environment, you might want to return an error immediately
    // or throw an exception. For now, we'll proceed but the Gemini call will fail.
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Responds to HTTP requests, acting as a proxy for the Gemini API.
 * This function handles both game analysis and game plan requests.
 *
 * @param {object} req Cloud Function request context.
 * @param {object} res Cloud Function response context.
 */
exports.geminiProxy = async (req, res) => {
    // Set CORS headers for all responses (important for your frontend)
    res.set('Access-Control-Allow-Origin', '*'); // Allow requests from any origin

    // Handle preflight requests (OPTIONS method)
    // Browsers send an OPTIONS request before the actual POST request for CORS
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST'); // Allow POST method
        res.set('Access-Control-Allow-Headers', 'Content-Type'); // Allow Content-Type header
        res.set('Access-Control-Max-Age', '3600'); // Cache preflight for 1 hour
        return res.status(204).send(''); // Respond with 204 No Content for preflight
    }

    // Only allow POST requests for actual API calls
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required in the request body.' });
        }

        // Use gemini-2.0-flash model as requested
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Send the AI's generated text back to the frontend
        res.status(200).json({ analysis: text });

    } catch (error) {
        console.error('Error during Gemini API call:', error);
        // Provide a more generic error message to the client for security reasons
        res.status(500).json({ error: 'An error occurred while processing your request. Please try again later.' });
    }
};