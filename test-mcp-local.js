#!/usr/bin/env node

// Test script for RCSX MCP server
const { spawn } = require('child_process');

console.log('🧪 Testing RCSX MCP Server Locally');
console.log('=' .repeat(50));

// Test environment
const env = {
  ...process.env,
  RCSX_SERVER_URL: 'http://localhost:3000',
  RCSX_API_KEY: 'rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE'
};

console.log('📋 Environment:');
console.log(`   Server URL: ${env.RCSX_SERVER_URL}`);
console.log(`   API Key: ${env.RCSX_API_KEY.substring(0, 10)}...`);

// Test simple npx execution first
console.log('\n🚀 Testing npx rcsx-mcp-server...');
const testProcess = spawn('npx', ['rcsx-mcp-server'], {
  env,
  stdio: 'inherit'
});

testProcess.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

testProcess.on('exit', (code) => {
  console.log(`\n📊 Process exited with code: ${code}`);
  if (code === 0) {
    console.log('✅ MCP server started successfully!');
  } else {
    console.log('❌ MCP server failed to start');
  }
});

// Kill after 5 seconds for testing
setTimeout(() => {
  console.log('\n⏹️  Stopping test...');
  testProcess.kill('SIGTERM');
}, 5000);
