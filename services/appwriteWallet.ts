import appwriteStorageService, { Transaction, User, WalletAccount } from '@/services/appwriteStorage';

export class AppwriteWalletService {
  private storageService = appwriteStorageService;

  // User Management
  async createUser(phoneNumber: string, firstName?: string, lastName?: string): Promise<User> {
    try {
      return await this.storageService.createUser(phoneNumber, firstName, lastName);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createUserProfile(authUserId: string, phoneNumber: string, name?: string): Promise<User> {
    try {
      const nameParts = name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return await this.storageService.createUserProfile(authUserId, phoneNumber, firstName, lastName);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      return await this.storageService.getUserByPhone(phoneNumber);
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw error;
    }
  }

  async updateUser(updates: Partial<User>): Promise<User | null> {
    try {
      if (!updates.$id) {
        throw new Error('User ID is required for update');
      }
      return await this.storageService.updateUser(updates.$id, updates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Wallet Account Management
  async createWalletAccount(userId: string): Promise<WalletAccount> {
    try {
      return await this.storageService.createWalletAccount(userId);
    } catch (error) {
      console.error('Error creating wallet account:', error);
      throw error;
    }
  }

  async getWalletAccount(userId: string): Promise<WalletAccount | null> {
    try {
      return await this.storageService.getWalletAccount(userId);
    } catch (error) {
      console.error('Error getting wallet account:', error);
      return null;
    }
  }

  // Transaction Management
  async creditWallet(userId: string, amount: number, description: string): Promise<Transaction> {
    try {
      const account = await this.getWalletAccount(userId);
      if (!account) {
        throw new Error('Wallet account not found');
      }

      // Create credit transaction
      const transaction = await this.storageService.createTransaction(
        account.$id!,
        'credit',
        amount,
        description
      );

      // Update wallet balance
      const newBalance = account.balance + amount;
      await this.storageService.updateWalletBalance(account.$id!, newBalance);

      return transaction;
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  }

  async debitWallet(userId: string, amount: number, description: string): Promise<Transaction> {
    try {
      const account = await this.getWalletAccount(userId);
      if (!account) {
        throw new Error('Wallet account not found');
      }

      if (account.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Create debit transaction
      const transaction = await this.storageService.createTransaction(
        account.$id!,
        'debit',
        amount,
        description
      );

      // Update wallet balance
      const newBalance = account.balance - amount;
      await this.storageService.updateWalletBalance(account.$id!, newBalance);

      return transaction;
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  }

  async transferFunds(
    fromUserId: string,
    toPhoneNumber: string,
    amount: number,
    description: string
  ): Promise<Transaction> {
    try {
      // Get sender's account
      const senderAccount = await this.getWalletAccount(fromUserId);
      if (!senderAccount) {
        throw new Error('Sender wallet account not found');
      }

      if (senderAccount.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Get recipient by phone number
      const recipient = await this.getUserByPhone(toPhoneNumber);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Get recipient's account
      const recipientAccount = await this.getWalletAccount(recipient.$id!);
      if (!recipientAccount) {
        throw new Error('Recipient wallet account not found');
      }

      // Create debit transaction for sender
      const debitTransaction = await this.storageService.createTransaction(
        senderAccount.$id!,
        'transfer_out',
        amount,
        `Transfer to ${toPhoneNumber}: ${description}`,
        toPhoneNumber
      );

      // Create credit transaction for recipient
      await this.storageService.createTransaction(
        recipientAccount.$id!,
        'transfer_in',
        amount,
        `Transfer from sender: ${description}`,
        toPhoneNumber
      );

      // Update sender balance
      await this.storageService.updateWalletBalance(
        senderAccount.$id!,
        senderAccount.balance - amount
      );

      // Update recipient balance
      await this.storageService.updateWalletBalance(
        recipientAccount.$id!,
        recipientAccount.balance + amount
      );

      return debitTransaction;
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  }

  async getTransactionHistory(userId: string): Promise<Transaction[]> {
    try {
      const account = await this.getWalletAccount(userId);
      if (!account) {
        return [];
      }

      return await this.storageService.getTransactionHistory(account.$id!);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // PIN Management
  async setWalletPin(userId: string, pin: string): Promise<void> {
    try {
      await this.storageService.setWalletPin(userId, pin);
    } catch (error) {
      console.error('Error setting wallet PIN:', error);
      throw error;
    }
  }

  async verifyWalletPin(userId: string, pin: string): Promise<boolean> {
    try {
      return await this.storageService.verifyWalletPin(userId, pin);
    } catch (error) {
      console.error('Error verifying wallet PIN:', error);
      return false;
    }
  }

  async hasWalletPin(userId: string): Promise<boolean> {
    try {
      return await this.storageService.hasWalletPin(userId);
    } catch (error) {
      console.error('Error checking wallet PIN:', error);
      return false;
    }
  }

  // Authentication
  async logout(userId: string): Promise<void> {
    try {
      await this.storageService.clearUserData(userId);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  // Initialize service
  async initialize(): Promise<void> {
    try {
      console.log('✅ Appwrite wallet service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Appwrite wallet service:', error);
      throw error;
    }
  }
}

export default new AppwriteWalletService();
