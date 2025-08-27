#!/usr/bin/env node

// Test RCSX MCP server functionality by calling RCSX API directly
const https = require('https');
const http = require('http');

console.log('🧪 Testing RCSX MCP Server Functionality');
console.log('=' .repeat(50));

// Test message that MCP server would send
const testMessage = {
  messageId: 'msg_mcp_test_001',
  conversationId: 'conv_mcp_test',
  participantId: '+1234567890',
  type: 'text',
  text: 'Hello from MCP test! 🧪',
  suggestions: [
    {
      action: {
        text: '✅ Test Passed',
        postbackData: 'test_passed'
      }
    },
    {
      action: {
        text: '🔄 Run Again',
        postbackData: 'run_again'
      }
    }
  ]
};

// Test against local server first
function testLocal() {
  console.log('📋 Testing Local RCSX Server (localhost:3000)...');
  
  const postData = JSON.stringify(testMessage);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/rcs/send',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Local test successful!');
        console.log('📥 Response:', JSON.parse(data));
      } else {
        console.log('❌ Local test failed');
        console.log('📥 Response:', data);
      }
      
      // Test remote server
      testRemote();
    });
  });

  req.on('error', (error) => {
    console.log('❌ Local server not running or unreachable');
    console.log('💡 Start local server with: node server.js');
    
    // Test remote server anyway
    testRemote();
  });

  req.write(postData);
  req.end();
}

// Test against remote server
function testRemote() {
  console.log('\\n📋 Testing Remote RCSX Server (rcsx.specialized.live)...');
  
  const postData = JSON.stringify(testMessage);
  
  const options = {
    hostname: 'rcsx.specialized.live',
    port: 443,
    path: '/api/rcs/send',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Remote test successful!');
        console.log('📥 Response:', JSON.parse(data));
        console.log('\\n🎯 MCP server functionality verified!');
        console.log('💡 Check https://rcsx.specialized.live to see the message');
      } else {
        console.log('❌ Remote test failed');
        console.log('📥 Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Remote server error:', error.message);
  });

  req.write(postData);
  req.end();
}

// Start tests
testLocal();
