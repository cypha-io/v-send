const { ReceiptService } = require('./services/receiptService');
require('dotenv').config();

async function testReceiptCreation() {
    try {
        console.log('🧪 Testing receipt creation...');
        
        const testReceipt = await ReceiptService.createReceipt(
            'test-transaction-123',
            'test-wallet-account-id', // Add wallet account ID
            {
                type: 'send',
                amount: 50.00,
                currency: 'GHS',
                senderName: 'Test Sender',
                senderPhone: '+233200000001',
                recipientName: 'Test Recipient',
                recipientPhone: '+233200000002',
                description: 'Test transfer',
                status: 'success',
                balanceAfter: 950.00,
                metadata: { testMode: true }
            }
        );
        
        console.log('✅ Receipt created successfully:', testReceipt.receiptNumber);
        
        // Try to retrieve the receipt
        const retrieved = await ReceiptService.getReceiptByTransactionId('test-transaction-123');
        if (retrieved) {
            console.log('✅ Receipt retrieved successfully:', retrieved.receiptNumber);
        } else {
            console.log('❌ Failed to retrieve receipt');
        }
        
    } catch (error) {
        console.error('❌ Receipt test failed:', error.message);
    }
}

testReceiptCreation();
