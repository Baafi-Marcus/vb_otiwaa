const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testStability() {
    const apiHost = process.env.STABILITYAI_API_HOST || 'https://api.stability.ai';
    const token = process.env.STABILITYAI_TOKEN;

    if (!token) {
        console.error('❌ STABILITYAI_TOKEN is not set in .env');
        return;
    }

    console.log('📡 Testing Stability AI with host:', apiHost);

    const prompt = "A professional, high-end photography of a luxury Ghanaian boutique with Kente fabrics, soft lighting, 8k resolution.";

    try {
        const response = await axios.post(
            `${apiHost}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
            {
                text_prompts: [{ text: prompt }],
                steps: 30,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log('✅ Success! Generated artifact count:', response.data.artifacts.length);
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testStability();
