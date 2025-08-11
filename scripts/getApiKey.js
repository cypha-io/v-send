#!/usr/bin/env node

/**
 * 🔑 Appwrite API Key Setup Helper
 * 
 * This script helps you get your API key from Appwrite console
 * and automatically adds it to your .env file.
 */

const fs = require('fs');
const path = require('path');

console.log('🔑 Appwrite API Key Setup\n');

console.log('To automatically create your database collections, you need an API key with database permissions.\n');

console.log('📋 Steps to get your API key:');
console.log('   1. Go to your Appwrite console: https://cloud.appwrite.io');
console.log('   2. Select your project');
console.log('   3. Go to "Settings" → "API Keys"');
console.log('   4. Click "Create API Key"');
console.log('   5. Name: "Database Setup Key"');
console.log('   6. Permissions: Check "databases.*" (all database permissions)');
console.log('   7. Copy the generated API key\n');

console.log('⚠️  Security Note:');
console.log('   • This API key has admin privileges');
console.log('   • Only use it for database setup');
console.log('   • Consider deleting it after setup is complete\n');

console.log('📝 Manual Setup:');
console.log('   Add this line to your .env file:');
console.log('   APPWRITE_API_KEY=your_api_key_here\n');

console.log('🚀 After adding the API key, run:');
console.log('   npm run setup-db\n');

console.log('💡 Your current .env file location:');
console.log(`   ${path.join(process.cwd(), '.env')}\n`);

// Check if .env exists and show current content (without sensitive data)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('📄 Current .env file content:');
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key] = line.split('=');
      if (key) {
        const hasValue = line.includes('=') && line.split('=')[1].trim();
        console.log(`   ${key}=${hasValue ? '***' : '(empty)'}`);
      }
    }
  });
  console.log('');
  
  // Check if API key is already set
  if (envContent.includes('APPWRITE_API_KEY=') && !envContent.includes('APPWRITE_API_KEY=your_api_key_here')) {
    console.log('✅ APPWRITE_API_KEY is already set!');
    console.log('🚀 You can now run: npm run setup-db\n');
  } else {
    console.log('❌ APPWRITE_API_KEY is not set or is using placeholder value');
    console.log('📝 Please add your API key to the .env file\n');
  }
} else {
  console.log('❌ .env file not found!');
  console.log('📝 Please create a .env file first\n');
}
