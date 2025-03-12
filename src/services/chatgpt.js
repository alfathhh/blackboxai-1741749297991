const axios = require('axios');

async function getChatGPTResponse(prompt) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from ChatGPT API');
        }

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error getting ChatGPT response:', error);
        return 'Sorry, I am having trouble generating a response. Please try again later.';
    }
}

module.exports = { getChatGPTResponse };
