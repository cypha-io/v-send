const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Initialize client
const client = new Client();
client
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function lookForReceipts() {
    try {
        console.log('🔍 Looking for receipt transactions...');
        
        const receipts = await databases.listDocuments(
            'v-send-wallet-db',
            'transactions',
            [],
            100 // Get more documents
        );
        
        console.log(`📄 Total transactions found: ${receipts.documents.length}`);
        
        // Look for receipts (type starting with "receipt_")
        const receiptTransactions = receipts.documents.filter(doc => 
            doc.type && doc.type.startsWith('receipt_')
        );
        
        console.log(`🧾 Receipt transactions found: ${receiptTransactions.length}`);
        
        if (receiptTransactions.length > 0) {
            console.log('📋 Receipt transactions:');
            receiptTransactions.forEach(receipt => {
                console.log(`  - ID: ${receipt.$id}`);
                console.log(`  - Type: ${receipt.type}`);
                console.log(`  - Amount: ${receipt.amount}`);
                console.log(`  - Description: ${receipt.description}`);
                console.log(`  - Reference: ${receipt.reference}`);
                console.log(`  - Metadata: ${receipt.metadata}`);
                console.log('  ---');
            });
        }
        
        // Show last few regular transactions for comparison
        const regularTransactions = receipts.documents
            .filter(doc => !doc.type || !doc.type.startsWith('receipt_'))
            .slice(0, 5);
            
        console.log(`📊 Last 5 regular transactions:`);
        regularTransactions.forEach(tx => {
            console.log(`  - ID: ${tx.$id}`);
            console.log(`  - Type: ${tx.type}`);
            console.log(`  - Amount: ${tx.amount}`);
            console.log(`  - Description: ${tx.description}`);
            console.log(`  - WalletAccountId: ${tx.walletAccountId}`);
            console.log('  ---');
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

lookForReceipts();
