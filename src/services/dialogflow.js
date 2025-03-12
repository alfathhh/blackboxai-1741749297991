/**
 * Dialogflow service integration
 * Handles natural language processing through Google's Dialogflow
 */
const dialogflow = require('@google-cloud/dialogflow');
const { SessionsClient } = dialogflow;
const ErrorHandler = require('./error-handler');

/**
 * DialogflowService class
 * Manages communication with Dialogflow API and intent detection
 */
class DialogflowService {
    /**
     * Initialize DialogflowService with default configuration
     */
    constructor() {
        this.sessionClient = new SessionsClient();
        // Default to Indonesian language, can be overridden via env variable
        this.languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'id';
    }

    /**
     * Detect intent from user message using Dialogflow
     * @param {string} sessionId - Unique identifier for the conversation session
     * @param {string} messageText - User's message text
     * @returns {Object|null} Response object containing intent details or null on error
     */
    async detectIntent(sessionId, messageText) {
        try {
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                process.env.DIALOGFLOW_PROJECT_ID,
                sessionId
            );

            // Prepare the request for Dialogflow
            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: messageText,
                        languageCode: this.languageCode,
                    },
                },
            };

            // Send request to Dialogflow
            const [response] = await this.sessionClient.detectIntent(request);
            const result = response.queryResult;

            // Return structured response with relevant information
            return {
                text: result.fulfillmentText,
                confidence: result.intentDetectionConfidence,
                intent: result.intent?.displayName,
                parameters: result.parameters?.fields,
                languageCode: result.languageCode
            };
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.DIALOGFLOW, error);
            return null;
        }
    }

    /**
     * Change the language used for intent detection
     * @param {string} languageCode - ISO language code (e.g., 'id' for Indonesian)
     */
    setLanguage(languageCode) {
        this.languageCode = languageCode;
    }
}

// Create singleton instance for reuse
const dialogflowService = new DialogflowService();

/**
 * Process message through Dialogflow
 * @param {string} sessionId - Unique identifier for the conversation session
 * @param {string} messageText - User's message text
 * @returns {Promise<Object|null>} Dialogflow response or null on error
 */
async function processDialogflowMessage(sessionId, messageText) {
    try {
        return await dialogflowService.detectIntent(sessionId, messageText);
    } catch (error) {
        ErrorHandler.logError(ErrorHandler.ERRORS.DIALOGFLOW, error);
        return null;
    }
}

module.exports = { 
    processDialogflowMessage,
    dialogflowService 
};
