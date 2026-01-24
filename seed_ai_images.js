const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function generateAndSeed() {
    console.log('🚀 Starting AI Image Generation for all Merchants...');

    const token = process.env.STABILITYAI_TOKEN;
    const apiHost = process.env.STABILITYAI_API_HOST || 'https://api.stability.ai';
    const engineId = 'stable-diffusion-xl-1024-v1-0';

    if (!token) {
        console.error('❌ Error: STABILITYAI_TOKEN not found in .env file.');
        return;
    }

    const merchants = await prisma.merchant.findMany();
    console.log(`📋 Found ${merchants.length} merchants to process.`);

    const folderPath = path.join(__dirname, 'generatedImages');
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    for (const merchant of merchants) {
        console.log(`🎨 Generating image for: ${merchant.name} (${merchant.category})...`);

        const prompt = `Professional high-end photography of a ${merchant.category} business named "${merchant.name}". ${merchant.clientVision || ''}. Cinematic lighting, 8k resolution, commercial aesthetic, clean composition.`;

        try {
            const response = await axios.post(
                `${apiHost}/v1/generation/${engineId}/text-to-image`,
                {
                    text_prompts: [{ text: prompt, weight: 1 }],
                    cfg_scale: 7,
                    height: 1024,
                    width: 1024,
                    steps: 30,
                    samples: 1,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const image = response.data.artifacts[0];
            const fileName = `merchant_${merchant.id.slice(0, 8)}_${Date.now()}.png`;
            const filePath = path.join(folderPath, fileName);

            fs.writeFileSync(filePath, Buffer.from(image.base64, 'base64'));

            await prisma.merchant.update({
                where: { id: merchant.id },
                data: { logoUrl: `/generatedImages/${fileName}` }
            });

            console.log(`✅ Success for ${merchant.name}: ${fileName}`);
        } catch (error) {
            console.error(`❌ Failed for ${merchant.name}:`, error.response ? error.response.data : error.message);
        }
    }

    console.log('✨ AI Seeding Complete!');
}

generateAndSeed()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
