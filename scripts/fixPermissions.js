#!/usr/bin/env node

/**
 * 🔐 Fix Collection Permissions
 * 
 * This script updates collection permissions to allow client-side access
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: 'v-send-wallet-db'
};

const collections = ['users', 'wallet-accounts', 'transactions', 'pins', 'auth-tokens'];

class PermissionsFixer {
  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    
    this.client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);
  }

  async fixPermissions() {
    console.log('🔐 Fixing Collection Permissions...\n');
    
    for (const collectionId of collections) {
      try {
        console.log(`📋 Updating permissions for: ${collectionId}`);
        
        // Get current collection
        const collection = await this.databases.getCollection(config.databaseId, collectionId);
        
        // Update with proper permissions for client-side access
        await this.databases.updateCollection(
          config.databaseId,
          collectionId,
          collection.name,
          [
            'read("any")',     // Anyone can read
            'create("users")', // Authenticated users can create
            'update("users")', // Authenticated users can update
            'delete("users")'  // Authenticated users can delete
          ],
          false // Document security disabled
        );
        
        console.log(`   ✅ Updated permissions for ${collectionId}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to update ${collectionId}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Permission fixing completed!');
    console.log('\n📋 Applied permissions:');
    console.log('   • read("any") - Anyone can read data');
    console.log('   • create("users") - Authenticated users can create');
    console.log('   • update("users") - Authenticated users can update');
    console.log('   • delete("users") - Authenticated users can delete');
    console.log('\n🔄 Restart your app to test the changes.');
  }
}

async function main() {
  const fixer = new PermissionsFixer();
  await fixer.fixPermissions();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PermissionsFixer;
