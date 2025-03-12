/**
 * ChatGPT service integration
 * Handles communication with OpenAI's ChatGPT API
 */
const axios = require('axios');
const ErrorHandler = require('./error-handler');

/**
 * ChatGPTService class
 * Manages communication with ChatGPT API with retry mechanism
 */
class ChatGPTService {
    /**
     * Initialize ChatGPTService with configuration
     * All parameters can be overridden via environment variables
     */
    constructor() {
        this.maxRetries = 3;                // Maximum number of retry attempts
        this.retryDelay = 1000;            // Delay between retries in milliseconds
        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150;
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
        // Retry on rate limits or temporary server errors
        return (
            error.response?.status === 429 || // Rate limit
            error.response?.status === 500 || // Server error
            error.response?.status === 502 || // Bad gateway
            error.response?.status === 503 || // Service unavailable
            error.code === 'ECONNRESET' ||    // Connection reset
            error.code === 'ETIMEDOUT'        // Timeout
        );
    }

    /**
     * Generate response using ChatGPT
     * @param {string} prompt - User's input message
     * @returns {Promise<string>} ChatGPT's response or error message
     */
    async generateResponse(prompt) {
        const makeRequest = async () => {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', 
                {
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data?.choices?.[0]?.message?.content) {
                throw new Error('Invalid response from ChatGPT API');
            }

            return response.data.choices[0].message.content;
        };

        try {
            return await this.retryWithDelay(makeRequest);
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.CHATGPT, error);
            return ErrorHandler.getErrorMessage(ErrorHandler.ERRORS.CHATGPT);
        }
    }
}

// Create singleton instance for reuse
const chatGPTService = new ChatGPTService();

/**
 * Get response from ChatGPT
 * @param {string} prompt - User's input message
 * @returns {Promise<string>} ChatGPT's response
 */
async function getChatGPTResponse(prompt) {
    return chatGPTService.generateResponse(prompt);
}

module.exports = { 
    getChatGPTResponse,
    chatGPTService 
};
