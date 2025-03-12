const { GoogleSpreadsheet } = require('google-spreadsheet');

let doc;

async function initializeSheets() {
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    await doc.useServiceAccountAuth(require(process.env.GOOGLE_APPLICATION_CREDENTIALS));
    await doc.loadInfo();
    console.log('Google Sheets service initialized');
}

async function logConversation(senderId, userMessage, botResponse) {
    try {
        if (!doc) {
            await initializeSheets();
        }

        const sheet = doc.sheetsByTitle['Conversations'] || await doc.addSheet({ title: 'Conversations' });
        
        // Add headers if sheet is empty
        if (sheet.rowCount === 0) {
            await sheet.setHeaderRow(['Timestamp', 'Sender ID', 'User Message', 'Bot Response']);
        }

        await sheet.addRow({
            'Timestamp': new Date().toISOString(),
            'Sender ID': senderId,
            'User Message': userMessage,
            'Bot Response': botResponse
        });
        
        console.log('Conversation logged successfully');
    } catch (error) {
        console.error('Error logging conversation:', error);
    }
}

module.exports = { logConversation };
