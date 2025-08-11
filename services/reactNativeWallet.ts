import { Transaction, User, WalletAccount } from '@/types/wallet';
import { CryptoService } from './crypto';
import { ReactNativeStorageService } from './reactNativeStorage';

export class ReactNativeWalletService {
  // User Management
  static async createUser(phoneNumber: string): Promise<User> {
    try {
      const userId = CryptoService.generateUserId();
      const user: User = {
        id: userId,
        phoneNumber,
        firstName: '',
        lastName: '',
        email: '',
        createdAt: new Date(),
        isVerified: false,
        role: 'user'
      };

      await ReactNativeStorageService.saveUser(user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      return await ReactNativeStorageService.getUserByPhone(phoneNumber);
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }

  static async updateUser(updates: Partial<User>): Promise<User | null> {
    try {
      if (!updates.id) {
        throw new Error('User ID is required for updates');
      }

      return await ReactNativeStorageService.updateUser(updates.id, updates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Wallet Account Management
  static async createWalletAccount(userId: string): Promise<WalletAccount> {
    try {
      const walletId = CryptoService.generateWalletId();
      const accountNumber = CryptoService.generateAccountNumber();
      
      const walletAccount: WalletAccount = {
        id: walletId,
        userId,
        accountNumber,
        balance: 0,
        currency: 'USD',
        status: 'active',
        dailyLimit: 10000,
        monthlyLimit: 100000,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await ReactNativeStorageService.saveWalletAccount(walletAccount);
      return walletAccount;
    } catch (error) {
      console.error('Error creating wallet account:', error);
      throw new Error('Failed to create wallet account');
    }
  }

  static async getWalletAccount(userId: string): Promise<WalletAccount | null> {
    try {
      return await ReactNativeStorageService.getWalletAccount(userId);
    } catch (error) {
      console.error('Error getting wallet account:', error);
      return null;
    }
  }

  // Transaction Management
  static async creditWallet(userId: string, amount: number, description: string): Promise<Transaction> {
    try {
      const walletAccount = await ReactNativeStorageService.getWalletAccount(userId);
      if (!walletAccount) {
        throw new Error('Wallet account not found');
      }

      const newBalance = walletAccount.balance + amount;
      const transactionId = CryptoService.generateTransactionId();
      const reference = CryptoService.generateTransactionReference();

      const transaction: Transaction & { walletAccountId: string } = {
        id: transactionId,
        walletAccountId: walletAccount.id,
        fromAccountId: undefined,
        toAccountId: walletAccount.id,
        amount,
        currency: 'USD',
        type: 'credit',
        status: 'completed',
        description,
        reference,
        metadata: {},
        createdAt: new Date(),
        completedAt: new Date()
      };

      // Save transaction and update balance
      await Promise.all([
        ReactNativeStorageService.saveTransaction(transaction),
        ReactNativeStorageService.updateWalletBalance(userId, newBalance)
      ]);

      // Return transaction without walletAccountId for type compatibility
      const { walletAccountId, ...returnTransaction } = transaction;
      return returnTransaction;
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  }

  static async debitWallet(userId: string, amount: number, description: string): Promise<Transaction> {
    try {
      const walletAccount = await ReactNativeStorageService.getWalletAccount(userId);
      if (!walletAccount) {
        throw new Error('Wallet account not found');
      }

      if (walletAccount.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = walletAccount.balance - amount;
      const transactionId = CryptoService.generateTransactionId();
      const reference = CryptoService.generateTransactionReference();

      const transaction: Transaction & { walletAccountId: string } = {
        id: transactionId,
        walletAccountId: walletAccount.id,
        fromAccountId: walletAccount.id,
        toAccountId: undefined,
        amount,
        currency: 'USD',
        type: 'debit',
        status: 'completed',
        description,
        reference,
        metadata: {},
        createdAt: new Date(),
        completedAt: new Date()
      };

      // Save transaction and update balance
      await Promise.all([
        ReactNativeStorageService.saveTransaction(transaction),
        ReactNativeStorageService.updateWalletBalance(userId, newBalance)
      ]);

      // Return transaction without walletAccountId for type compatibility
      const { walletAccountId, ...returnTransaction } = transaction;
      return returnTransaction;
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  }

  static async getTransactionHistory(userId: string): Promise<Transaction[]> {
    try {
      const walletAccount = await ReactNativeStorageService.getWalletAccount(userId);
      if (!walletAccount) {
        return [];
      }

      return await ReactNativeStorageService.getTransactions(walletAccount.id);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // PIN Management
  static async setWalletPin(userId: string, pin: string): Promise<void> {
    try {
      const hashedPin = await CryptoService.hashPin(pin);
      await ReactNativeStorageService.saveHashedPin(userId, hashedPin);
    } catch (error) {
      console.error('Error setting wallet PIN:', error);
      throw error;
    }
  }

  static async verifyWalletPin(userId: string, pin: string): Promise<boolean> {
    try {
      const hashedPin = await ReactNativeStorageService.getHashedPin(userId);
      if (!hashedPin) {
        return false;
      }

      const inputHashedPin = await CryptoService.hashPin(pin);
      return hashedPin === inputHashedPin;
    } catch (error) {
      console.error('Error verifying wallet PIN:', error);
      return false;
    }
  }

  static async hasWalletPin(userId: string): Promise<boolean> {
    try {
      const hashedPin = await ReactNativeStorageService.getHashedPin(userId);
      return !!hashedPin;
    } catch (error) {
      console.error('Error checking wallet PIN:', error);
      return false;
    }
  }

  // Authentication
  static async logout(userId: string): Promise<void> {
    try {
      await ReactNativeStorageService.clearUserData(userId);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  // Transfer between users
  static async transferToUser(
    fromUserId: string, 
    toPhoneNumber: string, 
    amount: number, 
    description: string
  ): Promise<Transaction[]> {
    try {
      // Get sender and receiver wallets
      const [fromWallet, toUser] = await Promise.all([
        ReactNativeStorageService.getWalletAccount(fromUserId),
        ReactNativeStorageService.getUserByPhone(toPhoneNumber)
      ]);

      if (!fromWallet) {
        throw new Error('Sender wallet not found');
      }

      if (!toUser) {
        throw new Error('Recipient not found');
      }

      const toWallet = await ReactNativeStorageService.getWalletAccount(toUser.id);
      if (!toWallet) {
        throw new Error('Recipient wallet not found');
      }

      if (fromWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transactions
      const reference = CryptoService.generateTransactionReference();
      const timestamp = new Date();

      const debitTransaction: Transaction & { walletAccountId: string } = {
        id: CryptoService.generateTransactionId(),
        walletAccountId: fromWallet.id,
        fromAccountId: fromWallet.id,
        toAccountId: toWallet.id,
        amount,
        currency: 'USD',
        type: 'transfer',
        status: 'completed',
        description: `Transfer to ${toUser.phoneNumber}: ${description}`,
        reference,
        metadata: { recipientPhone: toPhoneNumber },
        createdAt: timestamp,
        completedAt: timestamp
      };

      const creditTransaction: Transaction & { walletAccountId: string } = {
        id: CryptoService.generateTransactionId(),
        walletAccountId: toWallet.id,
        fromAccountId: fromWallet.id,
        toAccountId: toWallet.id,
        amount,
        currency: 'USD',
        type: 'transfer',
        status: 'completed',
        description: `Received from ${fromWallet.accountNumber}: ${description}`,
        reference,
        metadata: { senderAccountNumber: fromWallet.accountNumber },
        createdAt: timestamp,
        completedAt: timestamp
      };

      // Execute transfer
      await Promise.all([
        ReactNativeStorageService.saveTransaction(debitTransaction),
        ReactNativeStorageService.saveTransaction(creditTransaction),
        ReactNativeStorageService.updateWalletBalance(fromUserId, fromWallet.balance - amount),
        ReactNativeStorageService.updateWalletBalance(toUser.id, toWallet.balance + amount)
      ]);

      // Return both transactions without walletAccountId
      const { walletAccountId: _, ...debitTx } = debitTransaction;
      const { walletAccountId: __, ...creditTx } = creditTransaction;
      
      return [debitTx, creditTx];
    } catch (error) {
      console.error('Error transferring to user:', error);
      throw error;
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      return await ReactNativeStorageService.healthCheck();
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }
}

// Export for backward compatibility with existing code
export const WalletService = ReactNativeWalletService;
