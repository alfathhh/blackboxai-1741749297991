const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

function setupWhatsApp() {
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

    client.on('qr', (qr) => {
        console.log('QR Code:', qr); // Log the QR code to the console
    });

    client.on('ready', () => {
        console.log('WhatsApp client is ready!');
    });

    client.on('auth_failure', (msg) => {
        console.error('Authentication failed:', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out:', reason);
    });

    client.initialize();
}

module.exports = { setupWhatsApp };
