export interface PaystackPaymentRequest {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: {
    userId: string;
    phoneNumber: string;
    description: string;
    recipientPhone?: string;
  };
}

export interface PaystackPaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackTransferRecipient {
  type: 'nuban' | 'mobile_money';
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}

export interface PaystackTransferRequest {
  source: string;
  amount: number; // in kobo
  recipient: string;
  reason: string;
  reference?: string;
}

export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor() {
    // In production, these should come from environment variables
    this.secretKey = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key_here';
    this.publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Initialize a payment (for wallet top-ups)
  async initializePayment(request: PaystackPaymentRequest): Promise<PaystackPaymentResponse> {
    try {
      console.log('🔄 Initializing Paystack payment:', request);
      
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          amount: Math.round(request.amount * 100), // Convert to kobo
          currency: request.currency || 'GHS',
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      console.log('✅ Payment initialized:', data);
      return data;
    } catch (error) {
      console.error('❌ Paystack payment initialization error:', error);
      throw error;
    }
  }

  // Verify a payment
  async verifyPayment(reference: string): Promise<any> {
    try {
      console.log('🔄 Verifying payment:', reference);
      
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      console.log('✅ Payment verified:', data);
      return data;
    } catch (error) {
      console.error('❌ Paystack payment verification error:', error);
      throw error;
    }
  }

  // Create a transfer recipient (for sending money to bank accounts)
  async createTransferRecipient(recipient: PaystackTransferRecipient): Promise<any> {
    try {
      console.log('🔄 Creating transfer recipient:', recipient);
      
      const response = await fetch(`${this.baseUrl}/transferrecipient`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(recipient),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create transfer recipient');
      }

      console.log('✅ Transfer recipient created:', data);
      return data;
    } catch (error) {
      console.error('❌ Paystack transfer recipient creation error:', error);
      throw error;
    }
  }

  // Initiate a transfer (for withdrawals or direct bank transfers)
  async initiateTransfer(transfer: PaystackTransferRequest): Promise<any> {
    try {
      console.log('🔄 Initiating transfer:', transfer);
      
      const response = await fetch(`${this.baseUrl}/transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...transfer,
          amount: Math.round(transfer.amount * 100), // Convert to kobo
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Transfer initiation failed');
      }

      console.log('✅ Transfer initiated:', data);
      return data;
    } catch (error) {
      console.error('❌ Paystack transfer initiation error:', error);
      throw error;
    }
  }

  // Get list of banks (for bank transfers and withdrawals)
  async getBanks(): Promise<any> {
    try {
      console.log('🔄 Fetching banks list');
      
      const response = await fetch(`${this.baseUrl}/bank`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch banks');
      }

      console.log('✅ Banks list fetched:', data.data?.length, 'banks');
      return data;
    } catch (error) {
      console.error('❌ Paystack banks fetch error:', error);
      throw error;
    }
  }

  // Resolve account number (to verify bank account details)
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      console.log('🔄 Resolving account:', { accountNumber, bankCode });
      
      const response = await fetch(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Account resolution failed');
      }

      console.log('✅ Account resolved:', data);
      return data;
    } catch (error) {
      console.error('❌ Paystack account resolution error:', error);
      throw error;
    }
  }

  // Generate a unique reference for transactions
  generateReference(prefix: string = 'VS'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  // Convert amount from Naira to Kobo
  toKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  // Convert amount from Kobo to Naira
  fromKobo(amount: number): number {
    return amount / 100;
  }
}

export default new PaystackService();
