import { config, databases } from '@/config/appwrite';

export interface TransactionReceipt {
  id: string;
  transactionId: string;
  receiptNumber: string;
  transactionType: 'send' | 'receive' | 'topup' | 'payment';
  amount: number;
  currency: string;
  senderName: string;
  senderPhone: string;
  recipientName?: string;
  recipientPhone?: string;
  description: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  paymentReference?: string;
  fee?: number;
  balanceAfter: number;
  metadata?: {
    paymentMethod?: string;
    bankName?: string;
    accountNumber?: string;
    [key: string]: any;
  };
}

export class ReceiptService {
  // Generate unique receipt number
  private static generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `VSE${timestamp}${random}`;
  }

  // Create receipt for transaction
  static async createReceipt(
    transactionId: string,
    transactionData: {
      type: 'send' | 'receive' | 'topup' | 'payment';
      amount: number;
      currency: string;
      senderName: string;
      senderPhone: string;
      recipientName?: string;
      recipientPhone?: string;
      description: string;
      status: 'success' | 'failed' | 'pending';
      paymentReference?: string;
      fee?: number;
      balanceAfter: number;
      metadata?: any;
    }
  ): Promise<TransactionReceipt> {
    try {
      const receiptNumber = this.generateReceiptNumber();
      
      const receiptData = {
        transactionId,
        receiptNumber,
        transactionType: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency,
        senderName: transactionData.senderName,
        senderPhone: transactionData.senderPhone,
        recipientName: transactionData.recipientName || '',
        recipientPhone: transactionData.recipientPhone || '',
        description: transactionData.description,
        status: transactionData.status,
        timestamp: new Date().toISOString(),
        paymentReference: transactionData.paymentReference || '',
        fee: transactionData.fee || 0,
        balanceAfter: transactionData.balanceAfter,
        metadata: JSON.stringify(transactionData.metadata || {}),
      };

      const receipt = await databases.createDocument(
        config.databaseId,
        config.collections.receipts,
        'unique()',
        receiptData
      );

      console.log('✅ Receipt created:', receiptNumber);
      return this.mapReceiptFromDatabase(receipt);
    } catch (error) {
      console.error('❌ Failed to create receipt:', error);
      throw error;
    }
  }

  // Get receipt by transaction ID
  static async getReceiptByTransactionId(transactionId: string): Promise<TransactionReceipt | null> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.receipts,
        [
          `transactionId.equal("${transactionId}")`
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      return this.mapReceiptFromDatabase(response.documents[0]);
    } catch (error) {
      console.error('❌ Failed to get receipt:', error);
      return null;
    }
  }

  // Get receipt by receipt number
  static async getReceiptByNumber(receiptNumber: string): Promise<TransactionReceipt | null> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.receipts,
        [
          `receiptNumber.equal("${receiptNumber}")`
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      return this.mapReceiptFromDatabase(response.documents[0]);
    } catch (error) {
      console.error('❌ Failed to get receipt by number:', error);
      return null;
    }
  }

  // Get all receipts for a user (by phone number)
  static async getUserReceipts(
    userPhone: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<TransactionReceipt[]> {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.receipts,
        [
          `senderPhone.equal("${userPhone}")`,
          `recipientPhone.equal("${userPhone}")`,
        ]
      );

      return response.documents.map(doc => this.mapReceiptFromDatabase(doc));
    } catch (error) {
      console.error('❌ Failed to get user receipts:', error);
      return [];
    }
  }

  // Update receipt status
  static async updateReceiptStatus(
    receiptId: string,
    status: 'success' | 'failed' | 'pending',
    balanceAfter?: number
  ): Promise<void> {
    try {
      const updateData: any = { status };
      if (balanceAfter !== undefined) {
        updateData.balanceAfter = balanceAfter;
      }

      await databases.updateDocument(
        config.databaseId,
        config.collections.receipts,
        receiptId,
        updateData
      );

      console.log('✅ Receipt status updated:', receiptId);
    } catch (error) {
      console.error('❌ Failed to update receipt status:', error);
      throw error;
    }
  }

  // Generate receipt summary for sharing
  static generateReceiptSummary(receipt: TransactionReceipt): string {
    const date = new Date(receipt.timestamp).toLocaleString();
    const amount = `${receipt.currency} ${receipt.amount.toFixed(2)}`;
    
    let summary = `📧 V-SEND RECEIPT\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `Receipt: ${receipt.receiptNumber}\n`;
    summary += `Date: ${date}\n`;
    summary += `Type: ${receipt.transactionType.toUpperCase()}\n`;
    summary += `Amount: ${amount}\n`;
    summary += `Status: ${receipt.status.toUpperCase()}\n\n`;
    
    if (receipt.transactionType === 'send' || receipt.transactionType === 'payment') {
      summary += `From: ${receipt.senderName} (${receipt.senderPhone})\n`;
      if (receipt.recipientName) {
        summary += `To: ${receipt.recipientName} (${receipt.recipientPhone})\n`;
      }
    } else if (receipt.transactionType === 'receive') {
      summary += `From: ${receipt.senderName} (${receipt.senderPhone})\n`;
      summary += `To: You (${receipt.recipientPhone})\n`;
    } else if (receipt.transactionType === 'topup') {
      summary += `Account: ${receipt.senderName} (${receipt.senderPhone})\n`;
    }
    
    summary += `\nDescription: ${receipt.description}\n`;
    
    if (receipt.fee && receipt.fee > 0) {
      summary += `Fee: ${receipt.currency} ${receipt.fee.toFixed(2)}\n`;
    }
    
    summary += `Balance After: ${receipt.currency} ${receipt.balanceAfter.toFixed(2)}\n`;
    
    if (receipt.paymentReference) {
      summary += `Reference: ${receipt.paymentReference}\n`;
    }
    
    summary += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `Powered by V-Send Wallet 💰`;
    
    return summary;
  }

  // Map database document to TransactionReceipt interface
  private static mapReceiptFromDatabase(doc: any): TransactionReceipt {
    return {
      id: doc.$id,
      transactionId: doc.transactionId,
      receiptNumber: doc.receiptNumber,
      transactionType: doc.transactionType,
      amount: doc.amount,
      currency: doc.currency,
      senderName: doc.senderName,
      senderPhone: doc.senderPhone,
      recipientName: doc.recipientName || undefined,
      recipientPhone: doc.recipientPhone || undefined,
      description: doc.description,
      status: doc.status,
      timestamp: doc.timestamp,
      paymentReference: doc.paymentReference || undefined,
      fee: doc.fee || 0,
      balanceAfter: doc.balanceAfter,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
    };
  }
}

export const receiptService = ReceiptService;
