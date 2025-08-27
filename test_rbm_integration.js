// Test script for RBM callback integration
const http = require('http');

// Test event data
const testEvent = {
    eventType: "suggestionResponse",
    eventId: "evt_test_integration_123",
    timestamp: new Date().toISOString(),
    conversationId: "conv_test_integration_456",
    participantId: "+15551234567",
    sourceMessageId: "msg_business_789",
    responseType: "action",
    postbackData: "place_order",
    displayText: "🛒 Place Order",
    actionUrl: null,
    context: {}
};

// Function to test RBM callback
function testRBMCallback() {
    const postData = JSON.stringify(testEvent);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/rbm/callback',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('🧪 Testing RBM Callback Integration...');
    console.log('📡 Sending test event to http://localhost:3000/api/rbm/callback');
    console.log('📋 Event Type:', testEvent.eventType);
    console.log('🔘 Button Action:', testEvent.postbackData);
    console.log('');

    const req = http.request(options, (res) => {
        console.log(`📥 Response Status: ${res.statusCode}`);
        console.log(`📋 Response Headers:`, res.headers);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(responseData);
                console.log('📄 Response Body:', JSON.stringify(response, null, 2));
                
                if (response.success) {
                    console.log('✅ RBM Callback test PASSED');
                } else {
                    console.log('❌ RBM Callback test FAILED');
                }
            } catch (error) {
                console.log('📄 Raw Response:', responseData);
                console.log('❌ Failed to parse response:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        console.log('💡 Make sure the server is running: node server.js');
    });

    req.write(postData);
    req.end();
}

// Function to test RBM status
function testRBMStatus() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/rbm/status',
        method: 'GET'
    };

    console.log('\n🧪 Testing RBM Status Endpoint...');
    
    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(responseData);
                console.log('📊 RBM Status:', response.status);
                console.log('⏱️ Uptime:', response.uptimeFormatted);
                console.log('📈 Events Processed:', response.eventsProcessed);
                console.log('✅ RBM Status test PASSED');
            } catch (error) {
                console.log('❌ Failed to parse status response:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Status request failed:', error.message);
    });

    req.end();
}

// Run tests
if (require.main === module) {
    console.log('🚀 RBM Integration Test Suite');
    console.log('=' .repeat(50));
    
    // Test callback first
    testRBMCallback();
    
    // Test status after a short delay
    setTimeout(testRBMStatus, 1000);
}

module.exports = { testRBMCallback, testRBMStatus };
