/**
 * Google Sheets service integration
 * Handles logging of conversations to Google Sheets
 */
const { GoogleSpreadsheet } = require('google-spreadsheet');
const ErrorHandler = require('./error-handler');

/**
 * SheetsService class
 * Manages Google Sheets operations with initialization handling
 */
class SheetsService {
    /**
     * Initialize SheetsService with default configuration
     */
    constructor() {
        this.doc = null;
        this.sheetTitle = 'Conversations';
        this.headers = ['Timestamp', 'Sender ID', 'User Message', 'Bot Response', 'Source', 'Language'];
        this.initialized = false;
        this.initPromise = null;  // Used to prevent multiple simultaneous initializations
    }

    /**
     * Initialize the Google Sheets connection
     * Uses promise to prevent multiple simultaneous initializations
     */
    async initialize() {
        if (this.initialized) return;
        
        if (!this.initPromise) {
            this.initPromise = this._initialize();
        }
        
        await this.initPromise;
    }

    /**
     * Internal initialization method
     * Sets up Google Sheets connection and creates necessary sheets
     * @private
     */
    async _initialize() {
        try {
            this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
            await this.doc.useServiceAccountAuth(require(process.env.GOOGLE_APPLICATION_CREDENTIALS));
            await this.doc.loadInfo();
            
            // Get or create the conversation sheet
            let sheet = this.doc.sheetsByTitle[this.sheetTitle];
            if (!sheet) {
                sheet = await this.doc.addSheet({ title: this.sheetTitle });
                await sheet.setHeaderRow(this.headers);
            }
            
            this.initialized = true;
            console.log('Google Sheets service initialized successfully');
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.SHEETS, error);
            throw error;
        } finally {
            this.initPromise = null;
        }
    }

    /**
     * Log a conversation to Google Sheets
     * @param {string} senderId - WhatsApp sender ID
     * @param {string} userMessage - User's message
     * @param {string} botResponse - Bot's response
     * @param {string} source - Source of the response (dialogflow/chatgpt)
     * @param {string} language - Language of the conversation
     */
    async logConversation(senderId, userMessage, botResponse, source = 'unknown', language = 'id') {
        try {
            await this.initialize();
            
            const sheet = this.doc.sheetsByTitle[this.sheetTitle];
            if (!sheet) {
                throw new Error('Sheet not found after initialization');
            }

            await sheet.addRow({
                'Timestamp': new Date().toISOString(),
                'Sender ID': senderId,
                'User Message': userMessage,
                'Bot Response': botResponse,
                'Source': source,
                'Language': language
            });

            console.log(`Conversation logged successfully for sender ${senderId}`);
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.SHEETS, error);
            // Don't throw the error as logging failure shouldn't break the bot
            console.warn('Failed to log conversation, continuing without logging');
        }
    }

    /**
     * Retrieve conversation history for a specific sender
     * @param {string} senderId - WhatsApp sender ID
     * @param {number} limit - Maximum number of conversations to retrieve
     * @returns {Array} Array of conversation objects
     */
    async getConversationHistory(senderId, limit = 5) {
        try {
            await this.initialize();
            
            const sheet = this.doc.sheetsByTitle[this.sheetTitle];
            const rows = await sheet.getRows();
            
            return rows
                .filter(row => row['Sender ID'] === senderId)
                .slice(-limit)
                .map(row => ({
                    timestamp: row.Timestamp,
                    userMessage: row['User Message'],
                    botResponse: row['Bot Response'],
                    source: row.Source,
                    language: row.Language
                }));
        } catch (error) {
            ErrorHandler.logError(ErrorHandler.ERRORS.SHEETS, error);
            return [];
        }
    }
}

// Create singleton instance for reuse
const sheetsService = new SheetsService();

/**
 * Log conversation wrapper function
 * @param {string} senderId - WhatsApp sender ID
 * @param {string} userMessage - User's message
 * @param {string} botResponse - Bot's response
 * @param {string} source - Source of the response
 * @param {string} language - Language of the conversation
 */
async function logConversation(senderId, userMessage, botResponse, source, language) {
    return sheetsService.logConversation(senderId, userMessage, botResponse, source, language);
}

module.exports = { 
    logConversation,
    sheetsService
};
