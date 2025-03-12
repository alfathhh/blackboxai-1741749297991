const dialogflow = require('@google-cloud/dialogflow');
const { SessionsClient } = dialogflow;

const sessionClient = new SessionsClient();

async function processDialogflowMessage(sessionId, messageText) {
    try {
        const sessionPath = sessionClient.projectAgentSessionPath(
            process.env.DIALOGFLOW_PROJECT_ID,
            sessionId
        );

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: messageText,
                    languageCode: 'en-US',
                },
            },
        };

        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;

        return {
            text: result.fulfillmentText,
            confidence: result.intentDetectionConfidence,
            intent: result.intent.displayName
        };
    } catch (error) {
        console.error('Error processing Dialogflow message:', error);
        return null;
    }
}

module.exports = { processDialogflowMessage };
