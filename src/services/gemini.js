/**
 * Gemini AI service integration
 * Handles communication with Google's Gemini AI API
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ErrorHandler = require('./error-handler');

/**
 * GeminiService class
 * Manages communication with Gemini AI with retry mechanism
 */
class GeminiService {
    /**
     * Initialize GeminiService with configuration
     */
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    /**
     * Retry mechanism for API calls
     * @param {Function} fn - Async function to retry
     * @param {number} retries - Number of retries remaining
     * @returns {Promise} Result of the function call
     */
    async retryWithDelay(fn, retries = this.maxRetries) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.retryWithDelay(fn, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Determine if an error is retryable
     * @param {Error} error - Error object to check
     * @returns {boolean} True if the error is retryable
     */
    isRetryableError(error) {
        return (
            error.status === 429 || // Rate limit
            error.status === 500 || // Server error
            error.status === 502 || // Bad gateway
            error.status === 503    // Service unavailable
        );
    }

    /**
     * Generate response using Gemini
     * @param {string} prompt - User's input message
     * @returns {Promise<string>} Gemini's response or error message
     */
    async generateResponse(prompt) {
        const makeRequest = async () => {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        };

        try {
            return await this.retryWithDelay(makeRequest);
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.GEMINI, error);
            return ErrorHandler.getErrorMessage(ErrorHandler.ERRORS.GEMINI);
        }
    }
}

// Create singleton instance
const geminiService = new GeminiService();

/**
 * Get response from Gemini
 * @param {string} prompt - User's input message
 * @returns {Promise<string>} Gemini's response
 */
async function getGeminiResponse(prompt) {
    return geminiService.generateResponse(prompt);
}

module.exports = {
    getGeminiResponse,
    geminiService
};
