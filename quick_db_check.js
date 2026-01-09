const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();
        const res = await client.query('SELECT name, "twilioPhoneNumber", "whatsappPhoneNumberId" FROM "Merchant"');
        console.log('--- Merchants Found ---');
        console.table(res.rows);
        if (res.rows.length === 0) {
            console.log('WARNING: No merchants found in database. This is why the bot is not responding!');
        }
    } catch (err) {
        console.error('Database connection error:', err.message);
    } finally {
        await client.end();
    }
}

check();
