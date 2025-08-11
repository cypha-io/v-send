import { Transaction, User } from '@/services/appwriteStorage';
import appwriteWalletService from '@/services/appwriteWallet';
import paystackService from '@/services/paystack';
import { pinService } from '@/services/pinService';
import { receiptService } from '@/services/receiptService';
import { recipientService } from '@/services/recipientService';

export interface SendMoneyRequest {
  fromUserId: string;
  toPhoneNumber: string;
  amount: number;
  description: string;
  pin: string; // PIN is now required
}

export interface PaymentRequest {
  userId: string;
  merchantPhone: string;
  amount: number;
  description: string;
  pin: string; // PIN is now required
}

export interface TopUpRequest {
  userId: string;
  amount: number;
  description?: string;
  paymentMethod: 'card' | 'bank_transfer' | 'ussd';
  pin: string; // PIN is now required for top-up
}

export interface WithdrawRequest {
  userId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName?: string;
  description?: string;
  pin?: string;
}

export class EnhancedWalletService {
  private walletService = appwriteWalletService;
  private paystackService = paystackService;

  // Validate that phone number exists in database and is not the current user
  async validateRecipient(senderUserId: string, recipientPhone: string): Promise<User> {
    console.log('🔍 Validating recipient:', { senderUserId, recipientPhone });

    // Get sender details to compare
    const senderAccount = await this.walletService.getWalletAccount(senderUserId);
    if (!senderAccount) {
      throw new Error('Sender account not found');
    }

    // Use recipient service for validation
    const validation = await recipientService.validateRecipient(recipientPhone, senderAccount.userId);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid recipient');
    }

    // Get full user details for transaction
    const recipient = await this.walletService.getUserByPhone(recipientPhone);
    if (!recipient) {
      throw new Error('Recipient details not found');
    }

    console.log('✅ Recipient validated:', validation.recipient?.fullName);
    return recipient;
  }

  // Get all registered phone numbers except current user (for recipient suggestions)
  async getAvailableRecipients(currentUserId: string): Promise<User[]> {
    try {
      // This would require a new method in appwriteWallet to get all users
      // For now, we'll return an empty array and implement this later
      console.log('📱 Getting available recipients for user:', currentUserId);
      
      // TODO: Implement method to get all users except current user
      // This should be done carefully for privacy - maybe only return users who have opted in
      return [];
    } catch (error) {
      console.error('Error getting available recipients:', error);
      return [];
    }
  }

  // Send money to another user (PIN required)
  async sendMoney(request: SendMoneyRequest): Promise<Transaction> {
    try {
      console.log('💸 Processing send money request:', request);

      // Validate PIN first
      const pinValid = await pinService.validatePin({
        userId: request.fromUserId,
        pin: request.pin,
      });
      if (!pinValid) {
        throw new Error('Invalid PIN');
      }

      // Validate recipient (ensures they exist in database)
      const recipient = await this.validateRecipient(request.fromUserId, request.toPhoneNumber);

      // Check sender balance
      const senderAccount = await this.walletService.getWalletAccount(request.fromUserId);
      if (!senderAccount || senderAccount.balance < request.amount) {
        throw new Error('Insufficient balance');
      }

      // Get sender details for receipt
      const sender = await this.walletService.getUserByPhone(senderAccount.userId);
      if (!sender) {
        throw new Error('Sender details not found');
      }

      // Process the transfer using existing wallet service
      const transaction = await this.walletService.transferFunds(
        request.fromUserId,
        request.toPhoneNumber,
        request.amount,
        request.description
      );

      // Create receipt
      await receiptService.createReceipt(transaction.$id, {
        type: 'send',
        amount: request.amount,
        currency: 'GHS',
        senderName: `${sender.firstName} ${sender.lastName}`.trim() || sender.phoneNumber,
        senderPhone: sender.phoneNumber,
        recipientName: `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.phoneNumber,
        recipientPhone: recipient.phoneNumber,
        description: request.description,
        status: 'success',
        balanceAfter: senderAccount.balance - request.amount,
        paymentReference: transaction.$id,
      });

      console.log('✅ Money sent successfully with receipt:', transaction);
      return transaction;
    } catch (error) {
      console.error('❌ Send money error:', error);
      throw error;
    }
  }

  // Make payment to a merchant (similar to send money but with different UX)
  async makePayment(request: PaymentRequest): Promise<Transaction> {
    try {
      console.log('💳 Processing payment request:', request);

      // Validate PIN first
      const pinValid = await pinService.validatePin({
        userId: request.userId,
        pin: request.pin,
      });
      if (!pinValid) {
        throw new Error('Invalid PIN');
      }

      // Validate merchant (ensures they exist in database)
      const merchant = await this.validateRecipient(request.userId, request.merchantPhone);

      // Get user account for balance
      const userAccount = await this.walletService.getWalletAccount(request.userId);
      if (!userAccount) {
        throw new Error('User account not found');
      }

      // Get user details for receipt
      const user = await this.walletService.getUserByPhone(userAccount.userId);
      if (!user) {
        throw new Error('User details not found');
      }

      // Process as a transfer with payment description
      const transaction = await this.walletService.transferFunds(
        request.userId,
        request.merchantPhone,
        request.amount,
        `Payment: ${request.description}`
      );

      // Create receipt
      await receiptService.createReceipt(transaction.$id || '', {
        type: 'payment',
        amount: request.amount,
        currency: 'GHS',
        senderName: `${user.firstName} ${user.lastName}`.trim() || user.phoneNumber,
        senderPhone: user.phoneNumber,
        recipientName: `${merchant.firstName} ${merchant.lastName}`.trim() || merchant.phoneNumber,
        recipientPhone: merchant.phoneNumber,
        description: request.description,
        status: 'success',
        balanceAfter: userAccount.balance - request.amount,
        paymentReference: transaction.$id,
      });

      console.log('✅ Payment completed successfully:', transaction);
      return transaction;
    } catch (error) {
      console.error('❌ Payment error:', error);
      throw error;
    }
  }

  // Top up wallet using Paystack (PIN required)
  async topUpWallet(request: TopUpRequest): Promise<{ paymentUrl: string; reference: string }> {
    try {
      console.log('💰 Processing wallet top-up:', request);

      // Validate PIN first
      const pinValid = await pinService.validatePin({
        userId: request.userId,
        pin: request.pin,
      });
      if (!pinValid) {
        throw new Error('Invalid PIN');
      }

      // Get user details for payment
      const walletAccount = await this.walletService.getWalletAccount(request.userId);
      if (!walletAccount) {
        throw new Error('Wallet account not found');
      }

      // Generate unique reference
      const reference = this.paystackService.generateReference('TOPUP');

      // Create email for payment (using phone number if no email)
      const userEmail = `${walletAccount.userId}@vsend.app`; // Placeholder email

      // Initialize Paystack payment
      const paymentResponse = await this.paystackService.initializePayment({
        email: userEmail,
        amount: request.amount * 100, // Convert to pesewas (smallest unit of GHS)
        reference,
        currency: 'GHS',
        metadata: {
          userId: request.userId,
          phoneNumber: walletAccount.userId, // This should be the phone number
          description: request.description || 'Wallet top-up',
        },
      });

      console.log('✅ Top-up payment initialized:', paymentResponse);
      
      return {
        paymentUrl: paymentResponse.data.authorization_url,
        reference: paymentResponse.data.reference,
      };
    } catch (error) {
      console.error('❌ Top-up error:', error);
      throw error;
    }
  }

  // Process successful payment callback from Paystack
  async processTopUpCallback(reference: string): Promise<Transaction> {
    try {
      console.log('🔄 Processing top-up callback for reference:', reference);

      // Verify payment with Paystack
      const verification = await this.paystackService.verifyPayment(reference);
      
      if (!verification.status || verification.data.status !== 'success') {
        throw new Error('Payment verification failed');
      }

      const { data } = verification;
      const amount = this.paystackService.fromKobo(data.amount);
      const userId = data.metadata?.userId;

      if (!userId) {
        throw new Error('User ID not found in payment metadata');
      }

      // Credit the user's wallet
      const transaction = await this.walletService.creditWallet(
        userId,
        amount,
        `Wallet top-up via Paystack - ${reference}`
      );

      console.log('✅ Top-up processed successfully:', transaction);
      return transaction;
    } catch (error) {
      console.error('❌ Top-up callback error:', error);
      throw error;
    }
  }

  // Withdraw funds to bank account using Paystack
  async withdrawFunds(request: WithdrawRequest): Promise<any> {
    try {
      console.log('🏦 Processing withdrawal request:', request);

      // Validate PIN
      if (request.pin) {
        const pinValid = await this.walletService.verifyWalletPin(request.userId, request.pin);
        if (!pinValid) {
          throw new Error('Invalid PIN');
        }
      }

      // Check balance
      const walletAccount = await this.walletService.getWalletAccount(request.userId);
      if (!walletAccount || walletAccount.balance < request.amount) {
        throw new Error('Insufficient balance');
      }

      // Resolve bank account to verify details
      const accountInfo = await this.paystackService.resolveAccountNumber(
        request.accountNumber,
        request.bankCode
      );

      if (!accountInfo.status) {
        throw new Error('Invalid bank account details');
      }

      // Create transfer recipient
      const recipient = await this.paystackService.createTransferRecipient({
        type: 'nuban',
        name: request.accountName || accountInfo.data.account_name,
        account_number: request.accountNumber,
        bank_code: request.bankCode,
      });

      // Initiate transfer
      const transfer = await this.paystackService.initiateTransfer({
        source: 'balance',
        amount: request.amount,
        recipient: recipient.data.recipient_code,
        reason: request.description || 'Wallet withdrawal',
        reference: this.paystackService.generateReference('WITHDRAW'),
      });

      // Debit user's wallet if transfer is successful
      if (transfer.status) {
        await this.walletService.debitWallet(
          request.userId,
          request.amount,
          `Withdrawal to ${request.accountNumber} - ${transfer.data.reference}`
        );
      }

      console.log('✅ Withdrawal processed successfully:', transfer);
      return transfer;
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      throw error;
    }
  }

  // Get available banks for withdrawal
  async getAvailableBanks(): Promise<any[]> {
    try {
      const banksResponse = await this.paystackService.getBanks();
      return banksResponse.data || [];
    } catch (error) {
      console.error('Error fetching banks:', error);
      return [];
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
    // Remove any spaces, dashes, or special characters
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid Nigerian phone number format
    const nigerianPhoneRegex = /^(\+234|234|0)?([789][01])\d{8}$/;
    
    if (!nigerianPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        error: 'Please enter a valid Nigerian phone number (e.g., 08012345678)'
      };
    }

    return { isValid: true };
  }

  // Format phone number consistently
  formatPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Convert to standard format (without country code)
    if (cleanPhone.startsWith('+234')) {
      return '0' + cleanPhone.substring(4);
    } else if (cleanPhone.startsWith('234')) {
      return '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('0')) {
      return cleanPhone;
    } else {
      return '0' + cleanPhone;
    }
  }
}

export default new EnhancedWalletService();
