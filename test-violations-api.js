const { default: fetch } = require('node-fetch');

async function testViolationsAPI() {
    console.log('Testing violations API endpoint...');
    
    try {
        // First, let's try to get a token (you might need to adjust this based on your auth)
        const response = await fetch('http://localhost:3000/api/violations', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // You might need to add authorization header here
            }
        });
        
        if (response.status === 401) {
            console.log('❌ Authentication required. Need to login first.');
            return;
        }
        
        if (!response.ok) {
            console.error('❌ API request failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('✅ API request successful!');
        console.log(`Found ${data.data?.length || 0} violations`);
        console.log('Response structure:', Object.keys(data));
        
        if (data.data && data.data.length > 0) {
            console.log('Sample violation:', JSON.stringify(data.data[0], null, 2));
        }
        
    } catch (err) {
        console.error('❌ API test failed:', err.message);
    }
}

testViolationsAPI();