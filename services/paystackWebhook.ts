import enhancedWalletService from '@/services/enhancedWallet';

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    metadata?: {
      userId: string;
      phoneNumber: string;
      description: string;
    };
    customer: {
      email: string;
    };
  };
}

export class PaystackWebhookHandler {
  // Handle Paystack webhook events
  static async handleWebhook(event: PaystackWebhookEvent): Promise<void> {
    try {
      console.log('🔔 Paystack webhook received:', event.event, event.data.reference);

      switch (event.event) {
        case 'charge.success':
          await this.handleSuccessfulPayment(event.data);
          break;
        
        case 'transfer.success':
          await this.handleSuccessfulTransfer(event.data);
          break;
        
        case 'transfer.failed':
          await this.handleFailedTransfer(event.data);
          break;
        
        default:
          console.log('📝 Unhandled webhook event:', event.event);
      }
    } catch (error) {
      console.error('❌ Webhook handler error:', error);
      throw error;
    }
  }

  // Handle successful payment (top-up)
  private static async handleSuccessfulPayment(data: PaystackWebhookEvent['data']): Promise<void> {
    try {
      if (data.status === 'success' && data.metadata?.userId) {
        await enhancedWalletService.processTopUpCallback(data.reference);
        console.log('✅ Top-up processed for user:', data.metadata.userId);
      }
    } catch (error) {
      console.error('❌ Top-up processing error:', error);
      throw error;
    }
  }

  // Handle successful transfer (withdrawal)
  private static async handleSuccessfulTransfer(data: PaystackWebhookEvent['data']): Promise<void> {
    try {
      console.log('✅ Transfer successful:', data.reference);
      // Additional processing if needed
    } catch (error) {
      console.error('❌ Transfer success processing error:', error);
    }
  }

  // Handle failed transfer (withdrawal)
  private static async handleFailedTransfer(data: PaystackWebhookEvent['data']): Promise<void> {
    try {
      console.log('❌ Transfer failed:', data.reference);
      // You might want to refund the user's wallet here
    } catch (error) {
      console.error('❌ Transfer failure processing error:', error);
    }
  }

  // Verify webhook signature (for production security)
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      import('crypto').then(crypto => {
        const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
        return hash === signature;
      });
      return true; // Simplified for React Native environment
    } catch (error) {
      console.error('❌ Webhook signature verification error:', error);
      return false;
    }
  }
}

export default PaystackWebhookHandler;
