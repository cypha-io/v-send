const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function createReceiptsCollection() {
  try {
    console.log('🔧 Creating receipts collection...');
    
    // Create the receipts collection
    const collection = await databases.createCollection(
      'v-send-wallet-db', // Database ID
      'receipts',         // Collection ID
      'Transaction Receipts', // Collection Name
      ['read("any")', 'write("any")'], // Permissions (adjust as needed)
      false // Document Security (set to true for user-level permissions)
    );

    console.log('✅ Receipts collection created:', collection.$id);

    // Create attributes for the receipts collection
    const attributes = [
      { key: 'transactionId', type: 'string', size: 255, required: true },
      { key: 'receiptNumber', type: 'string', size: 255, required: true },
      { key: 'transactionType', type: 'string', size: 50, required: true }, // send, receive, topup, payment
      { key: 'amount', type: 'integer', required: true },
      { key: 'currency', type: 'string', size: 10, required: true, default: 'GHS' },
      { key: 'senderName', type: 'string', size: 255, required: true },
      { key: 'senderPhone', type: 'string', size: 20, required: true },
      { key: 'recipientName', type: 'string', size: 255, required: false },
      { key: 'recipientPhone', type: 'string', size: 20, required: false },
      { key: 'description', type: 'string', size: 500, required: true },
      { key: 'status', type: 'string', size: 20, required: true }, // success, failed, pending
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'paymentReference', type: 'string', size: 255, required: false },
      { key: 'fee', type: 'integer', required: false },
      { key: 'balanceAfter', type: 'integer', required: true },
      { key: 'metadata', type: 'string', size: 1000, required: false } // JSON string for additional data
    ];

    console.log('📝 Creating attributes...');
    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            'v-send-wallet-db',
            'receipts',
            attr.key,
            attr.size,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            'v-send-wallet-db',
            'receipts',
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            'v-send-wallet-db',
            'receipts',
            attr.key,
            attr.required,
            attr.default || null
          );
        }
        console.log(`  ✅ Created ${attr.key} attribute`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`  ⚠️ Attribute ${attr.key} might already exist:`, error.message);
      }
    }

    // Create indexes for better query performance
    console.log('🔍 Creating indexes...');
    const indexes = [
      { key: 'transactionId_idx', type: 'key', attributes: ['transactionId'] },
      { key: 'receiptNumber_idx', type: 'key', attributes: ['receiptNumber'] },
      { key: 'senderPhone_idx', type: 'key', attributes: ['senderPhone'] },
      { key: 'recipientPhone_idx', type: 'key', attributes: ['recipientPhone'] },
      { key: 'timestamp_idx', type: 'key', attributes: ['timestamp'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] }
    ];

    for (const index of indexes) {
      try {
        await databases.createIndex(
          'v-send-wallet-db',
          'receipts',
          index.key,
          index.type,
          index.attributes
        );
        console.log(`  ✅ Created ${index.key} index`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`  ⚠️ Index ${index.key} might already exist:`, error.message);
      }
    }

    console.log('🎉 Receipts collection setup completed!');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Receipts collection already exists');
    } else {
      console.error('❌ Error creating receipts collection:', error);
    }
  }
}

// Run the setup
createReceiptsCollection()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
