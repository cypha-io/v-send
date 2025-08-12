const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Initialize client
const client = new Client();
client
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function listCollections() {
    try {
        console.log('📋 Listing existing collections...');
        const collections = await databases.listCollections('v-send-wallet-db');
        console.log(`Found ${collections.collections.length} collections:`);
        
        collections.collections.forEach(collection => {
            console.log(`  - ${collection.name} (ID: ${collection.$id})`);
        });
        
        console.log('\n✅ List completed');
    } catch (error) {
        console.error('❌ Error listing collections:', error);
    }
}

listCollections();
