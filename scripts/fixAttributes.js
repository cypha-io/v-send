#!/usr/bin/env node

/**
 * 🔧 Fix Missing Attributes Script
 * 
 * This script creates the missing attributes that failed during initial setup
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: 'v-send-wallet-db'
};

// Missing attributes with corrected definitions
const missingAttributes = {
  users: [
    { key: 'role', type: 'string', size: 20, required: false, default: 'user' },
    { key: 'isVerified', type: 'boolean', required: false, default: false },
    { key: 'isActive', type: 'boolean', required: false, default: true }
  ],
  
  'wallet-accounts': [
    { key: 'balance', type: 'float', min: 0, max: 999999999.99, required: false, default: 0 },
    { key: 'currency', type: 'string', size: 10, required: false, default: 'USD' },
    { key: 'status', type: 'string', size: 20, required: false, default: 'active' },
    { key: 'isDefault', type: 'boolean', required: false, default: true },
    { key: 'dailyLimit', type: 'float', min: 0, max: 999999999.99, required: false, default: 10000 },
    { key: 'monthlyLimit', type: 'float', min: 0, max: 999999999.99, required: false, default: 100000 }
  ],
  
  transactions: [
    { key: 'amount', type: 'float', min: 0.01, max: 999999999.99, required: true },
    { key: 'status', type: 'string', size: 20, required: false, default: 'completed' }
  ],
  
  pins: [
    { key: 'isActive', type: 'boolean', required: false, default: true }
  ],
  
  'auth-tokens': [
    { key: 'isActive', type: 'boolean', required: false, default: true }
  ]
};

class AttributeFixer {
  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    
    this.client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);
  }

  async fixAttributes() {
    console.log('🔧 Fixing missing attributes...\n');
    
    for (const [collectionId, attributes] of Object.entries(missingAttributes)) {
      console.log(`📋 Fixing collection: ${collectionId}`);
      
      for (const attr of attributes) {
        try {
          await this.createAttribute(collectionId, attr);
          console.log(`   ✅ Fixed ${attr.key} (${attr.type})`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`   ℹ️  ${attr.key} already exists`);
          } else {
            console.log(`   ❌ Failed to fix ${attr.key}: ${error.message}`);
          }
        }
      }
      console.log('');
    }
    
    console.log('🎉 Attribute fixing completed!');
  }

  async createAttribute(collectionId, attr) {
    const commonParams = [
      config.databaseId,
      collectionId,
      attr.key,
      attr.required || false,
      attr.default,
      attr.array || false
    ];

    switch (attr.type) {
      case 'string':
        return await this.databases.createStringAttribute(
          ...commonParams.slice(0, 3),
          attr.size,
          ...commonParams.slice(3)
        );
        
      case 'float':
        return await this.databases.createFloatAttribute(
          ...commonParams.slice(0, 3),
          attr.min,
          attr.max,
          ...commonParams.slice(3)
        );
        
      case 'boolean':
        return await this.databases.createBooleanAttribute(
          ...commonParams.slice(0, 3),
          ...commonParams.slice(3)
        );
        
      default:
        throw new Error(`Unknown attribute type: ${attr.type}`);
    }
  }
}

// Run the fixer
async function main() {
  const fixer = new AttributeFixer();
  await fixer.fixAttributes();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AttributeFixer;
