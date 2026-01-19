
import axios from 'axios';

async function main() {
    try {
        console.log('Logging in as admin...');
        const loginResp = await axios.post('http://127.0.0.1:3001/api/auth/login', {
            username: 'admin',
            password: 'Password123!',
            type: 'admin'
        });

        const token = loginResp.data.access_token;
        console.log('Got token:', token ? 'YES' : 'NO');

        console.log('Fetching merchants...');
        const merchantsResp = await axios.get('http://127.0.0.1:3001/api/merchants', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('MERCHANTS_DATA:', JSON.stringify(merchantsResp.data, null, 2));

    } catch (e: any) {
        console.log('CAUGHT ERROR:');
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', JSON.stringify(e.response.data));
        } else if (e.request) {
            console.log('No response received (Connection Refused?)');
            console.log('Error Code:', e.code);
        } else {
            console.log('Error Message:', e.message);
        }
    }
}

main();
