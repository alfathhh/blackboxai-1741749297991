/**
 * ErrorHandler class for centralized error handling across the application
 * Provides standardized error types, messages, and logging functionality
 */
class ErrorHandler {
    // Define standard error types for consistent error handling
    static ERRORS = {
        DIALOGFLOW: 'DIALOGFLOW_ERROR',    // Dialogflow API related errors
        CHATGPT: 'CHATGPT_ERROR',         // ChatGPT API related errors
        SHEETS: 'SHEETS_ERROR',           // Google Sheets related errors
        WHATSAPP: 'WHATSAPP_ERROR'       // WhatsApp client related errors
    };

    /**
     * Get user-friendly error message based on error type
     * @param {string} type - Type of error from ERRORS enum
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message in Indonesian
     */
    static getErrorMessage(type, error) {
        switch (type) {
            case this.ERRORS.DIALOGFLOW:
                return 'Maaf, sistem sedang mengalami gangguan. Silakan coba lagi nanti.';
            case this.ERRORS.CHATGPT:
                return 'Maaf, AI sedang mengalami gangguan. Silakan coba lagi nanti.';
            case this.ERRORS.SHEETS:
                return 'Terjadi kesalahan saat menyimpan percakapan.';
            case this.ERRORS.WHATSAPP:
                return 'Terjadi kesalahan saat mengirim pesan.';
            default:
                return 'Terjadi kesalahan sistem. Silakan coba lagi nanti.';
        }
    }

    /**
     * Log error details with timestamp for debugging
     * @param {string} type - Type of error from ERRORS enum
     * @param {Error} error - Error object to log
     */
    static logError(type, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [${type}] Error:`, error.message);
        console.error('Stack:', error.stack);
    }
}

module.exports = ErrorHandler;
