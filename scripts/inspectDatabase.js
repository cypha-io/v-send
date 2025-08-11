#!/usr/bin/env node

/**
 * 🔍 Appwrite Database Inspector
 * 
 * This script checks your existing databases and collections
 * to help plan the setup strategy.
 */

const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || ''
};

class DatabaseInspector {
  constructor() {
    this.client = new Client();
    this.databases = new Databases(this.client);
    
    this.client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey);
  }

  async inspect() {
    console.log('🔍 Inspecting Appwrite Project...\n');
    
    try {
      // List all databases
      const databases = await this.databases.list();
      
      console.log(`📊 Found ${databases.total} database(s):\n`);
      
      for (const db of databases.databases) {
        console.log(`🗄️  Database: ${db.name} (ID: ${db.$id})`);
        
        try {
          // List collections in this database
          const collections = await this.databases.listCollections(db.$id);
          
          if (collections.total === 0) {
            console.log('   📋 No collections found');
          } else {
            console.log(`   📋 ${collections.total} collection(s):`);
            
            for (const collection of collections.collections) {
              console.log(`      • ${collection.name} (${collection.$id})`);
              
              // List attributes for this collection
              try {
                const attributes = await this.databases.listAttributes(db.$id, collection.$id);
                console.log(`        Attributes: ${attributes.total}`);
                
                if (attributes.total > 0) {
                  attributes.attributes.forEach(attr => {
                    console.log(`          - ${attr.key} (${attr.type})`);
                  });
                }
              } catch (error) {
                console.log(`        Could not get attributes: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Could not list collections: ${error.message}`);
        }
        
        console.log(''); // Empty line between databases
      }
      
      // Recommendations
      console.log('🎯 Recommendations:\n');
      
      if (databases.total === 0) {
        console.log('   • No databases found. You can create a new one.');
      } else if (databases.total === 1) {
        const existingDb = databases.databases[0];
        console.log(`   • Use existing database: ${existingDb.$id}`);
        console.log('   • We can add collections to this database');
      } else {
        console.log('   • Multiple databases found');
        console.log('   • Choose which one to use for V-Send wallet');
      }
      
    } catch (error) {
      console.error('❌ Inspection failed:', error.message);
      
      if (error.code === 401) {
        console.error('\n🔑 Authentication Error:');
        console.error('   • Check your APPWRITE_API_KEY in .env file');
      }
    }
  }
}

// Run the inspection
async function main() {
  const inspector = new DatabaseInspector();
  await inspector.inspect();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseInspector;
