/**
 * WhatsApp AI Chatbot Main Application
 * Integrates WhatsApp client with AI services (Dialogflow, ChatGPT, and Gemini)
 * for automated message responses and conversation logging
 */
const { Client, LocalAuth } = require('whatsapp-web.js');
const { processDialogflowMessage } = require('./src/services/dialogflow');
const { logConversation } = require('./src/services/sheets');
const { getChatGPTResponse } = require('./src/services/chatgpt');
const { getGeminiResponse } = require('./src/services/gemini');
const MessageHandler = require('./src/services/message');
const ErrorHandler = require('./src/services/error-handler');

/**
 * Initialize WhatsApp client with enhanced configuration
 * Uses local authentication and optimized Puppeteer settings
 */
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

/**
 * Initialize message handler with all required services
 * This handles the core logic of processing messages and generating responses
 */
const messageHandler = new MessageHandler(
    client,
    processDialogflowMessage,
    getChatGPTResponse,
    getGeminiResponse,
    logConversation
);

// WhatsApp client event handlers

/**
 * Handle QR code generation
 * Displays QR code for WhatsApp Web authentication
 */
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

/**
 * Handle client ready state
 * Triggered when WhatsApp client is successfully authenticated and ready
 */
client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

/**
 * Handle authentication failures
 * Logs authentication errors for debugging
 */
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
    ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, new Error(msg));
});

/**
 * Handle client disconnection
 * Logs disconnection events for monitoring
 */
client.on('disconnected', (reason) => {
    console.log('Client was logged out:', reason);
    ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, new Error(`Disconnected: ${reason}`));
});

/**
 * Handle incoming messages
 * Routes all incoming messages to the message handler
 */
client.on('message', message => messageHandler.handleMessage(message));

/**
 * Initialize WhatsApp client
 * Handles startup errors gracefully
 */
client.initialize().catch(error => {
    ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, error);
    console.error('Failed to initialize WhatsApp client:', error);
    process.exit(1);
});
