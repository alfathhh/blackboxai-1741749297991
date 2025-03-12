/**
 * Message Handler Service
 * Central service for processing and managing WhatsApp messages
 * Coordinates between Greetings, Dialogflow, ChatGPT, Gemini and logging services
 */
const ErrorHandler = require('./error-handler');
const { greetingsService } = require('./greetings');

class MessageHandler {
    /**
     * Initialize MessageHandler with required services
     * @param {Object} client - WhatsApp client instance
     * @param {Function} dialogflowService - Dialogflow service for intent detection
     * @param {Function} chatGPTService - ChatGPT service for AI responses
     * @param {Function} geminiService - Gemini service for AI responses
     * @param {Function} sheetService - Google Sheets service for logging
     */
    constructor(client, dialogflowService, chatGPTService, geminiService, sheetService) {
        this.client = client;
        this.dialogflowService = dialogflowService;
        this.chatGPTService = chatGPTService;
        this.geminiService = geminiService;
        this.sheetService = sheetService;
        this.messageQueue = new Map(); // Store pending messages to prevent overlap
    }

    /**
     * Handle incoming WhatsApp messages
     * First checks for greetings, then processes through AI services if needed
     * @param {Object} message - WhatsApp message object
     */
    async handleMessage(message) {
        const sender = message.from;

        // Prevent multiple messages from same sender being processed simultaneously
        if (this.messageQueue.has(sender)) {
            await this.client.sendMessage(sender, '_Mohon tunggu, pesan Anda sedang diproses..._');
            return;
        }

        // Add to queue
        this.messageQueue.set(sender, true);

        try {
            const userMessage = message.body;

            // First check if it's a greeting
            const greetingResponse = greetingsService.checkGreeting(userMessage);
            if (greetingResponse) {
                await this.client.sendMessage(sender, greetingResponse.response);
                // Log greeting interaction
                await this.sheetService(
                    sender,
                    userMessage,
                    greetingResponse.response,
                    'greeting',
                    'id'
                );
                return;
            }

            // If not a greeting, proceed with AI services
            // First try Dialogflow for intent matching
            const dialogflowResponse = await this.dialogflowService(sender, userMessage);
            
            let botResponse;
            let finalResponse;
            let source;
            let language;

            // Use Dialogflow response if confidence is high enough
            if (dialogflowResponse && dialogflowResponse.confidence > 0.7) {
                botResponse = dialogflowResponse.text;
                finalResponse = `${botResponse}\n\n_jawaban digenerate oleh sistem_`;
                source = 'dialogflow';
                language = dialogflowResponse.languageCode;
            } else {
                // Try ChatGPT first
                try {
                    botResponse = await this.chatGPTService(userMessage);
                    if (botResponse && !botResponse.includes('Error')) {
                        finalResponse = `${botResponse}\n\n_jawaban digenerate oleh ChatGPT_`;
                        source = 'chatgpt';
                    } else {
                        // If ChatGPT fails, try Gemini
                        botResponse = await this.geminiService(userMessage);
                        finalResponse = `${botResponse}\n\n_jawaban digenerate oleh Gemini_`;
                        source = 'gemini';
                    }
                    language = 'id'; // Default to Indonesian
                } catch (error) {
                    // If both AI services fail, use Gemini as final fallback
                    botResponse = await this.geminiService(userMessage);
                    finalResponse = `${botResponse}\n\n_jawaban digenerate oleh Gemini_`;
                    source = 'gemini';
                    language = 'id';
                }
            }

            // Show typing indicator before sending response
            await this.client.sendPresenceAvailable();
            await this.client.sendMessage(sender, finalResponse);

            // Log conversation with source and language info
            await this.sheetService(sender, userMessage, botResponse, source, language);

        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, error);
            // Send error message to user
            await this.client.sendMessage(
                sender, 
                ErrorHandler.getErrorMessage(ErrorHandler.ERRORS.WHATSAPP)
            );
        } finally {
            // Remove from queue regardless of success/failure
            this.messageQueue.delete(sender);
        }
    }

    /**
     * Send typing indicator to user
     * @param {string} sender - WhatsApp sender ID
     */
    async sendTypingIndicator(sender) {
        try {
            await this.client.sendPresenceAvailable();
            await this.client.sendPresenceComposing(sender);
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, error);
        }
    }
}

module.exports = MessageHandler;
