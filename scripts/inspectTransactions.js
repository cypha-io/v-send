const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Initialize client
const client = new Client();
client
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function inspectTransactionCollection() {
    try {
        console.log('🔍 Inspecting transaction collection structure...');
        
        // Get a sample transaction to see the structure
        const transactions = await databases.listDocuments(
            'v-send-wallet-db',
            'transactions',
            [],
            1 // limit to 1 document
        );
        
        if (transactions.documents.length > 0) {
            console.log('📄 Sample transaction structure:');
            console.log(JSON.stringify(transactions.documents[0], null, 2));
        } else {
            console.log('❌ No transactions found');
        }
        
    } catch (error) {
        console.error('❌ Error inspecting collection:', error);
    }
}

inspectTransactionCollection();
