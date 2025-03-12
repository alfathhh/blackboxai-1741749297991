const axios = require('axios');
const ErrorHandler = require('./error-handler');

class ChatGPTService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150;
    }

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

// Create singleton instance
const chatGPTService = new ChatGPTService();

async function getChatGPTResponse(prompt) {
    return chatGPTService.generateResponse(prompt);
}

module.exports = { 
    getChatGPTResponse,
    chatGPTService 
};
