const { Client, LocalAuth } = require('whatsapp-web.js');
const { processDialogflowMessage } = require('./src/services/dialogflow');
const { logConversation } = require('./src/services/sheets');
const { getChatGPTResponse } = require('./src/services/chatgpt');
const MessageHandler = require('./src/services/message');
const ErrorHandler = require('./src/services/error-handler');

// Initialize WhatsApp client with better auth handling
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

// Initialize message handler
const messageHandler = new MessageHandler(
    client,
    processDialogflowMessage,
    getChatGPTResponse,
    logConversation
);

// Event handlers
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
    ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, new Error(msg));
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out:', reason);
    ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, new Error(`Disconnected: ${reason}`));
});

// Handle incoming messages
client.on('message', message => messageHandler.handleMessage(message));

// Initialize client
client.initialize().catch(error => {
    ErrorHandler.logError(ErrorHandler.ERRORS.WHATSAPP, error);
    console.error('Failed to initialize WhatsApp client:', error);
    process.exit(1);
});
