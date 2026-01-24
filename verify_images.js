const axios = require('axios');

async function checkMerchants() {
    try {
        const response = await axios.get('http://localhost:3000/api/merchants/public');
        console.log('Total Merchants:', response.data.length);
        if (response.data.length > 0) {
            console.log('First Merchant Image Check:');
            console.log('Name:', response.data[0].name);
            console.log('logoUrl:', response.data[0].logoUrl);
            console.log('menuImageUrl:', response.data[0].menuImageUrl);
        }
    } catch (error) {
        console.error('Error fetching merchants:', error.message);
    }
}

checkMerchants();
