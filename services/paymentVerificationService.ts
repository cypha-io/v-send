import { config, databases } from '@/config/appwrite';
import { Query } from 'react-native-appwrite';

export interface PaymentVerificationResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  status?: string;
  message?: string;
}

export class PaymentVerificationService {
  private static paystackSecretKey = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY;

  // Verify payment with Paystack
  static async verifyPaymentWithPaystack(reference: string): Promise<PaymentVerificationResult> {
    try {
      console.log('🔍 Verifying payment with Paystack:', reference);
      
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📄 Paystack verification response:', data);

      if (data.status && data.data?.status === 'success') {
        return {
          success: true,
          transactionId: data.data.id,
          amount: data.data.amount / 100, // Convert from kobo/pesewas to main currency
          currency: data.data.currency,
          reference: data.data.reference,
          status: data.data.status,
          message: 'Payment verified successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Payment verification failed',
        };
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      return {
        success: false,
        message: 'Failed to verify payment with Paystack',
      };
    }
  }

  // Process successful payment (update wallet balance)
  static async processSuccessfulPayment(
    userId: string,
    reference: string,
    amount: number,
    currency: string = 'GHS'
  ): Promise<boolean> {
    try {
      console.log('💰 Processing successful payment:', { userId, reference, amount, currency });

      // Get user's wallet account
      const accountResponse = await databases.listDocuments(
        config.databaseId,
        config.collections.walletAccounts,
        [Query.equal('userId', userId)]
      );

      if (accountResponse.documents.length === 0) {
        throw new Error('Wallet account not found');
      }

      const walletAccount = accountResponse.documents[0];
      const newBalance = walletAccount.balance + amount;

      // Update wallet balance
      await databases.updateDocument(
        config.databaseId,
        config.collections.walletAccounts,
        walletAccount.$id,
        {
          balance: newBalance,
          lastTransactionAt: new Date().toISOString(),
        }
      );

      // Create transaction record
      const transactionData = {
        fromUserId: userId,
        toUserId: userId, // Self-transaction for top-up
        amount,
        type: 'topup',
        status: 'completed',
        description: 'Wallet top-up via Paystack',
        paymentReference: reference,
        currency,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          paymentMethod: 'card',
          provider: 'paystack',
          verified: true,
        }),
      };

      const transaction = await databases.createDocument(
        config.databaseId,
        config.collections.transactions,
        'unique()',
        transactionData
      );

      console.log('✅ Payment processed successfully:', transaction.$id);
      return true;
    } catch (error) {
      console.error('❌ Failed to process payment:', error);
      return false;
    }
  }

  // Complete payment flow: verify with Paystack and update wallet
  static async completePaymentFlow(
    userId: string,
    reference: string
  ): Promise<PaymentVerificationResult> {
    try {
      // First verify with Paystack
      const verification = await this.verifyPaymentWithPaystack(reference);
      
      if (!verification.success) {
        return verification;
      }

      // Process the successful payment
      const processed = await this.processSuccessfulPayment(
        userId,
        reference,
        verification.amount!,
        verification.currency
      );

      if (!processed) {
        return {
          success: false,
          message: 'Payment verified but failed to update wallet',
        };
      }

      return {
        ...verification,
        success: true,
        message: 'Payment completed successfully',
      };
    } catch (error) {
      console.error('❌ Complete payment flow error:', error);
      return {
        success: false,
        message: 'Failed to complete payment flow',
      };
    }
  }
}

export const paymentVerificationService = PaymentVerificationService;
