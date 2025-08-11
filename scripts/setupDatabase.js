#!/usr/bin/env node

/**
 * 🚀 Automatic Appwrite Database Setup Script
 * 
 * This script will create all collections and attributes for V-Send wallet
 * automatically without manual setup in the Appwrite console.
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Configuration
const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '', // You'll need to add this to .env
  databaseId: 'v-send-wallet-db'
};

// Database schema definition
const collections = {
  users: {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'phoneNumber', type: 'string', size: 20, required: true },
      { key: 'firstName', type: 'string', size: 50, required: false },
      { key: 'lastName', type: 'string', size: 50, required: false },
      { key: 'email', type: 'string', size: 100, required: false },
      { key: 'role', type: 'string', size: 20, required: true, default: 'user' },
      { key: 'isVerified', type: 'boolean', required: true, default: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'lastLoginAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'phone_idx', type: 'unique', attributes: ['phoneNumber'] },
      { key: 'email_idx', type: 'unique', attributes: ['email'] }
    ]
  },
  
  'wallet-accounts': {
    id: 'wallet-accounts',
    name: 'Wallet Accounts',
    attributes: [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'accountNumber', type: 'string', size: 20, required: true },
      { key: 'balance', type: 'float', min: 0, max: 999999999.99, required: true, default: 0 },
      { key: 'currency', type: 'string', size: 10, required: true, default: 'USD' },
      { key: 'status', type: 'string', size: 20, required: true, default: 'active' },
      { key: 'isDefault', type: 'boolean', required: true, default: true },
      { key: 'dailyLimit', type: 'float', min: 0, max: 999999999.99, required: true, default: 10000 },
      { key: 'monthlyLimit', type: 'float', min: 0, max: 999999999.99, required: true, default: 100000 },
      { key: 'lastTransactionAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['userId'] },
      { key: 'account_number_idx', type: 'unique', attributes: ['accountNumber'] }
    ]
  },
  
  transactions: {
    id: 'transactions',
    name: 'Transactions',
    attributes: [
      { key: 'walletAccountId', type: 'string', size: 50, required: true },
      { key: 'type', type: 'string', size: 20, required: true },
      { key: 'amount', type: 'float', min: 0.01, max: 999999999.99, required: true },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'reference', type: 'string', size: 50, required: true },
      { key: 'status', type: 'string', size: 20, required: true, default: 'completed' },
      { key: 'recipientPhone', type: 'string', size: 20, required: false },
      { key: 'metadata', type: 'string', size: 2000, required: false }
    ],
    indexes: [
      { key: 'wallet_idx', type: 'key', attributes: ['walletAccountId'] },
      { key: 'reference_idx', type: 'unique', attributes: ['reference'] },
      { key: 'type_idx', type: 'key', attributes: ['type'] }
    ]
  },
  
  pins: {
    id: 'pins',
    name: 'PINs',
    attributes: [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'hashedPin', type: 'string', size: 128, required: true },
      { key: 'salt', type: 'string', size: 64, required: true },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'lastUsedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'user_pin_idx', type: 'unique', attributes: ['userId'] }
    ]
  },
  
  'auth-tokens': {
    id: 'auth-tokens',
    name: 'Auth Tokens',
    attributes: [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'token', type: 'string', size: 128, required: true },
      { key: 'deviceInfo', type: 'string', size: 500, required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'expiresAt', type: 'datetime', required: true },
      { key: 'lastUsedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'user_token_idx', type: 'key', attributes: ['userId'] },
      { key: 'token_idx', type: 'unique', attributes: ['token'] }
    ]
  }
};

class DatabaseSetup {
  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    
    // Initialize client
    this.client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);
  }

  async setup() {
    console.log('🚀 Starting V-Send Wallet Database Setup...\n');
    
    try {
      // Validate configuration
      this.validateConfig();
      
      // Create database
      await this.createDatabase();
      
      // Create all collections
      for (const collectionData of Object.values(collections)) {
        await this.createCollection(collectionData);
        await this.createAttributes(collectionData);
        await this.createIndexes(collectionData);
      }
      
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\n📊 Created:');
      console.log(`   ✅ Database: ${config.databaseId}`);
      console.log(`   ✅ Collections: ${Object.keys(collections).length}`);
      console.log(`   ✅ Attributes: ${this.getTotalAttributes()}`);
      console.log(`   ✅ Indexes: ${this.getTotalIndexes()}`);
      
      console.log('\n🎯 Your V-Send wallet app is now ready to use Appwrite!');
      
    } catch (error) {
      console.error('\n❌ Database setup failed:', error.message);
      
      if (error.code === 401) {
        console.error('\n🔑 Authentication Error:');
        console.error('   • Check your APPWRITE_API_KEY in .env file');
        console.error('   • Ensure the API key has database permissions');
      } else if (error.code === 404) {
        console.error('\n🔍 Project Not Found:');
        console.error('   • Check your EXPO_PUBLIC_APPWRITE_PROJECT_ID in .env file');
        console.error('   • Ensure the project exists in your Appwrite console');
      }
      
      process.exit(1);
    }
  }

  validateConfig() {
    if (!config.projectId) {
      throw new Error('EXPO_PUBLIC_APPWRITE_PROJECT_ID is required in .env file');
    }
    
    if (!config.apiKey) {
      throw new Error('APPWRITE_API_KEY is required in .env file');
    }
    
    console.log('✅ Configuration validated');
  }

  async createDatabase() {
    try {
      console.log('🗄️  Checking database...');
      
      // Try to get the existing database first
      await this.databases.get(config.databaseId);
      console.log(`   ✅ Database "${config.databaseId}" already exists`);
      
    } catch (error) {
      if (error.code === 404) {
        // Database doesn't exist, try to create it
        console.log('🗄️  Creating database...');
        try {
          await this.databases.create(
            config.databaseId,
            'V-Send Wallet Database'
          );
          console.log(`   ✅ Database "${config.databaseId}" created`);
        } catch (createError) {
          if (createError.message.includes('maximum number of databases')) {
            console.log(`   ❌ Cannot create new database: ${createError.message}`);
            console.log('   💡 Please use an existing database or upgrade your plan');
            throw createError;
          } else {
            throw createError;
          }
        }
      } else {
        throw error;
      }
    }
  }

  async createCollection(collectionData) {
    try {
      console.log(`\n📋 Creating collection: ${collectionData.name}`);
      
      await this.databases.createCollection(
        config.databaseId,
        collectionData.id,
        collectionData.name,
        [], // Empty permissions array - will be set to default
        false // Document security
      );
      
      console.log(`   ✅ Collection "${collectionData.id}" created`);
      
    } catch (error) {
      if (error.code === 409) {
        console.log(`   ℹ️  Collection "${collectionData.id}" already exists`);
      } else {
        throw error;
      }
    }
  }

  async createAttributes(collectionData) {
    console.log(`   📝 Adding attributes...`);
    
    for (const attr of collectionData.attributes) {
      try {
        await this.createAttribute(collectionData.id, attr);
        console.log(`      ✅ ${attr.key} (${attr.type})`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`      ℹ️  ${attr.key} already exists`);
        } else {
          console.log(`      ❌ Failed to create ${attr.key}: ${error.message}`);
        }
      }
    }
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
        
      case 'datetime':
        return await this.databases.createDatetimeAttribute(
          ...commonParams.slice(0, 3),
          ...commonParams.slice(3)
        );
        
      default:
        throw new Error(`Unknown attribute type: ${attr.type}`);
    }
  }

  async createIndexes(collectionData) {
    if (!collectionData.indexes) return;
    
    console.log(`   🔍 Creating indexes...`);
    
    for (const index of collectionData.indexes) {
      try {
        await this.databases.createIndex(
          config.databaseId,
          collectionData.id,
          index.key,
          index.type,
          index.attributes
        );
        console.log(`      ✅ ${index.key} (${index.type})`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`      ℹ️  Index ${index.key} already exists`);
        } else {
          console.log(`      ❌ Failed to create index ${index.key}: ${error.message}`);
        }
      }
    }
  }

  getTotalAttributes() {
    return Object.values(collections).reduce((total, collection) => {
      return total + collection.attributes.length;
    }, 0);
  }

  getTotalIndexes() {
    return Object.values(collections).reduce((total, collection) => {
      return total + (collection.indexes ? collection.indexes.length : 0);
    }, 0);
  }
}

// Run the setup
async function main() {
  const setup = new DatabaseSetup();
  await setup.setup();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseSetup;
