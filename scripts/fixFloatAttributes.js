#!/usr/bin/env node

/**
 * 🔧 Fix Float Attributes Script
 * 
 * This script creates the remaining float attributes that failed
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: 'v-send-wallet-db'
};

class FloatAttributeFixer {
  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    
    this.client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);
  }

  async fixFloatAttributes() {
    console.log('🔧 Fixing float attributes...\n');
    
    const floatAttributes = [
      { collection: 'wallet-accounts', key: 'balance', min: 0.0, max: 10000.0, default: 0.0 },
      { collection: 'wallet-accounts', key: 'dailyLimit', min: 0.0, max: 10000.0, default: 10000.0 },
      { collection: 'wallet-accounts', key: 'monthlyLimit', min: 0.0, max: 100000.0, default: 100000.0 },
      { collection: 'transactions', key: 'amount', min: 0.01, max: 10000.0, required: true }
    ];
    
    for (const attr of floatAttributes) {
      try {
        console.log(`📋 Creating ${attr.collection}.${attr.key}`);
        
        await this.databases.createFloatAttribute(
          config.databaseId,
          attr.collection,
          attr.key,
          !!attr.required, // Convert to boolean
          attr.default || null,
          false // array
        );
        
        console.log(`   ✅ Created ${attr.key}`);
        
      } catch (error) {
        if (error.code === 409) {
          console.log(`   ℹ️  ${attr.key} already exists`);
        } else {
          console.log(`   ❌ Failed to create ${attr.key}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Float attributes fixing completed!');
  }
}

// Run the fixer
async function main() {
  const fixer = new FloatAttributeFixer();
  await fixer.fixFloatAttributes();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FloatAttributeFixer;
