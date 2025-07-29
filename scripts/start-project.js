#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting CCEP Sustainability Analytics Platform...\n');

// Check if required directories exist
const requiredDirs = ['logs', 'db', 'vector_store'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Check environment variables
require('dotenv').config({ path: './config/.env' });

const requiredEnvVars = ['GEMINI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your config/.env file');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`✅ Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}`);

// Start the CAP server
console.log('\n🌟 Starting CAP server...\n');

const server = spawn('npx', ['cds', 'serve', '--with-mocks'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGTERM');
});
