/**
 * Greetings Service
 * Handles initial responses for various types of greetings
 */
class GreetingsService {
    constructor() {
        // Patterns for different types of greetings
        this.greetingPatterns = {
            salam: /^(assalamu'?alaikum|asw|ass)\b/i,
            hello: /^(halo|hello|hai|hi|hey)\b/i,
            morning: /^(selamat\s+pagi|pagi)\b/i,
            afternoon: /^(selamat\s+siang|siang)\b/i,
            evening: /^(selamat\s+sore|sore)\b/i,
            night: /^(selamat\s+malam|malam)\b/i
        };
    }

    /**
     * Check if message is a greeting and get appropriate response
     * @param {string} message - User's message
     * @returns {Object|null} Response object if greeting detected, null otherwise
     */
    checkGreeting(message) {
        const lowerMessage = message.toLowerCase().trim();

        // Check for Islamic greeting
        if (this.greetingPatterns.salam.test(lowerMessage)) {
            return {
                isGreeting: true,
                response: "Wa'alaikumsalam Warahmatullahi Wabarakatuh 🙏",
                type: 'salam'
            };
        }

        // Check for time-based greetings
        const hour = new Date().getHours();
        
        if (this.greetingPatterns.morning.test(lowerMessage)) {
            return {
                isGreeting: true,
                response: `Selamat pagi juga! ${this.getEmojiForTime(hour)} Semoga hari Anda menyenangkan!`,
                type: 'morning'
            };
        }

        if (this.greetingPatterns.afternoon.test(lowerMessage)) {
            return {
                isGreeting: true,
                response: `Selamat siang juga! ${this.getEmojiForTime(hour)} Ada yang bisa saya bantu?`,
                type: 'afternoon'
            };
        }

        if (this.greetingPatterns.evening.test(lowerMessage)) {
            return {
                isGreeting: true,
                response: `Selamat sore juga! ${this.getEmojiForTime(hour)} Semoga hari Anda menyenangkan!`,
                type: 'evening'
            };
        }

        if (this.greetingPatterns.night.test(lowerMessage)) {
            return {
                isGreeting: true,
                response: `Selamat malam juga! ${this.getEmojiForTime(hour)} Semoga hari Anda menyenangkan!`,
                type: 'night'
            };
        }

        // Check for general greetings
        if (this.greetingPatterns.hello.test(lowerMessage)) {
            return {
                isGreeting: true,
                response: this.getGeneralGreeting(hour),
                type: 'hello'
            };
        }

        return null;
    }

    /**
     * Get appropriate emoji based on time of day
     * @param {number} hour - Current hour (0-23)
     * @returns {string} Time-appropriate emoji
     */
    getEmojiForTime(hour) {
        if (hour >= 5 && hour < 11) return '🌅'; // Morning
        if (hour >= 11 && hour < 15) return '☀️'; // Afternoon
        if (hour >= 15 && hour < 18) return '🌤️'; // Evening
        return '🌙'; // Night
    }

    /**
     * Get general greeting based on time of day
     * @param {number} hour - Current hour (0-23)
     * @returns {string} Time-appropriate greeting
     */
    getGeneralGreeting(hour) {
        if (hour >= 5 && hour < 11) {
            return `Halo! Selamat pagi! ${this.getEmojiForTime(hour)} Ada yang bisa saya bantu?`;
        }
        if (hour >= 11 && hour < 15) {
            return `Halo! Selamat siang! ${this.getEmojiForTime(hour)} Ada yang bisa saya bantu?`;
        }
        if (hour >= 15 && hour < 18) {
            return `Halo! Selamat sore! ${this.getEmojiForTime(hour)} Ada yang bisa saya bantu?`;
        }
        return `Halo! Selamat malam! ${this.getEmojiForTime(hour)} Ada yang bisa saya bantu?`;
    }
}

// Create singleton instance
const greetingsService = new GreetingsService();

module.exports = {
    greetingsService
};
