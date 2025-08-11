#!/usr/bin/env node

/**
 * 🔍 Appwrite Connection Test
 * 
 * This script tests the connection to your Appwrite project
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing Appwrite Connection...\n');
  
  const config = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
    apiKey: process.env.APPWRITE_API_KEY || ''
  };
  
  console.log('📋 Configuration:');
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Project ID: ${config.projectId}`);
  console.log(`   API Key: ${config.apiKey ? '***' + config.apiKey.slice(-4) : 'NOT SET'}\n`);
  
  if (!config.projectId) {
    console.error('❌ EXPO_PUBLIC_APPWRITE_PROJECT_ID is not set in .env file');
    return;
  }
  
  if (!config.apiKey) {
    console.error('❌ APPWRITE_API_KEY is not set in .env file');
    return;
  }
  
  try {
    const client = new Client();
    const databases = new Databases(client);
    
    client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);
    
    console.log('🔌 Testing connection...');
    
    // Test by listing databases
    const result = await databases.list();
    
    console.log('✅ Connection successful!');
    console.log(`📊 Found ${result.total} database(s)\n`);
    
    if (result.total > 0) {
      console.log('🗄️  Available databases:');
      result.databases.forEach(db => {
        console.log(`   • ${db.name} (ID: ${db.$id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 401) {
      console.error('\n🔑 Authentication Error:');
      console.error('   • Check your APPWRITE_API_KEY');
      console.error('   • Ensure the API key has proper permissions');
    } else if (error.code === 404) {
      console.error('\n🔍 Project Not Found:');
      console.error('   • Check your EXPO_PUBLIC_APPWRITE_PROJECT_ID');
      console.error('   • Ensure the project exists in your Appwrite console');
      console.error('   • Verify you\'re using the correct Appwrite endpoint');
    } else {
      console.error('\n🌐 Network/Other Error:');
      console.error('   • Check your internet connection');
      console.error('   • Verify the Appwrite endpoint URL');
    }
  }
}

testConnection().catch(console.error);
