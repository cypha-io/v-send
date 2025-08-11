import { Transaction, TransactionFilter, User, WalletAccount } from '@/types/wallet';
import { CryptoService } from './crypto';
import { StorageService } from './storage';

export class WalletService {
  /**
   * Create a new user account
   */
  static async createUser(phoneNumber: string): Promise<User> {
    try {
      const existingUser = await this.getUserByPhone(phoneNumber);
      if (existingUser) {
        throw new Error('User with this phone number already exists');
      }

      const user: User = {
        id: CryptoService.generateUserId(),
        phoneNumber,
        createdAt: new Date(),
        isVerified: false,
        role: 'user',
      };

      await StorageService.saveUser(user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by phone number
   */
  static async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const user = await StorageService.getUser();
      return user && user.phoneNumber === phoneNumber ? user : null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }

  /**
   * Update user information
   */
  static async updateUser(updates: Partial<User>): Promise<User | null> {
    try {
      const currentUser = await StorageService.getUser();
      if (!currentUser) {
        throw new Error('No user found');
      }

      const updatedUser = { ...currentUser, ...updates };
      await StorageService.saveUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Create a wallet account for a user
   */
  static async createWalletAccount(userId: string, currency: string = 'GHS'): Promise<WalletAccount> {
    try {
      const existingAccount = await StorageService.getWalletAccount();
      if (existingAccount && existingAccount.userId === userId) {
        throw new Error('User already has a wallet account');
      }

      const account: WalletAccount = {
        id: CryptoService.generateWalletId(),
        userId,
        accountNumber: CryptoService.generateAccountNumber(),
        balance: 0,
        currency,
        status: 'active',
        dailyLimit: 1000,
        monthlyLimit: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await StorageService.saveWalletAccount(account);
      return account;
    } catch (error) {
      console.error('Error creating wallet account:', error);
      throw error;
    }
  }

  /**
   * Get wallet account by user ID
   */
  static async getWalletAccount(userId: string): Promise<WalletAccount | null> {
    try {
      const account = await StorageService.getWalletAccount();
      return account && account.userId === userId ? account : null;
    } catch (error) {
      console.error('Error getting wallet account:', error);
      return null;
    }
  }

  /**
   * Update wallet account
   */
  static async updateWalletAccount(updates: Partial<WalletAccount>): Promise<WalletAccount | null> {
    try {
      const currentAccount = await StorageService.getWalletAccount();
      if (!currentAccount) {
        throw new Error('No wallet account found');
      }

      const updatedAccount = { 
        ...currentAccount, 
        ...updates, 
        updatedAt: new Date() 
      };
      await StorageService.saveWalletAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Error updating wallet account:', error);
      throw error;
    }
  }

  /**
   * Set PIN for wallet
   */
  static async setWalletPin(pin: string): Promise<void> {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      const pinHash = await CryptoService.hashPin(pin);
      await StorageService.savePinHash(pinHash);
      
      // Update wallet account to indicate PIN is set
      const account = await StorageService.getWalletAccount();
      if (account) {
        await this.updateWalletAccount({ pin: 'SET' });
      }
    } catch (error) {
      console.error('Error setting wallet PIN:', error);
      throw error;
    }
  }

  /**
   * Verify wallet PIN
   */
  static async verifyWalletPin(pin: string): Promise<boolean> {
    try {
      const pinHash = await StorageService.getPinHash();
      if (!pinHash) {
        return false;
      }

      return await CryptoService.verifyPin(pin, pinHash);
    } catch (error) {
      console.error('Error verifying wallet PIN:', error);
      return false;
    }
  }

  /**
   * Check if wallet has PIN set
   */
  static async hasWalletPin(): Promise<boolean> {
    try {
      const pinHash = await StorageService.getPinHash();
      return !!pinHash;
    } catch (error) {
      console.error('Error checking wallet PIN:', error);
      return false;
    }
  }

  /**
   * Create a transaction
   */
  static async createTransaction(
    type: Transaction['type'],
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      const account = await StorageService.getWalletAccount();
      if (!account) {
        throw new Error('No wallet account found');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const transaction: Transaction = {
        id: CryptoService.generateTransactionId(),
        fromAccountId: type === 'debit' || type === 'transfer' || type === 'withdrawal' ? account.id : undefined,
        toAccountId: type === 'credit' || type === 'transfer' || type === 'topup' ? account.id : undefined,
        amount,
        currency: account.currency,
        type,
        status: 'pending',
        description,
        reference: CryptoService.generateTransactionReference(),
        metadata,
        createdAt: new Date(),
      };

      await StorageService.addTransaction(transaction);
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Process a credit transaction (add money to wallet)
   */
  static async creditWallet(amount: number, description: string): Promise<Transaction> {
    try {
      const account = await StorageService.getWalletAccount();
      if (!account) {
        throw new Error('No wallet account found');
      }

      const transaction = await this.createTransaction('credit', amount, description);
      
      // Update balance
      const newBalance = account.balance + amount;
      await this.updateWalletAccount({ balance: newBalance });

      // Update transaction status
      const updatedTransaction = { ...transaction, status: 'completed' as const, completedAt: new Date() };
      const transactions = await StorageService.getTransactions();
      const updatedTransactions = transactions.map(t => 
        t.id === transaction.id ? updatedTransaction : t
      );
      await StorageService.saveTransactions(updatedTransactions);

      return updatedTransaction;
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  }

  /**
   * Process a debit transaction (remove money from wallet)
   */
  static async debitWallet(amount: number, description: string): Promise<Transaction> {
    try {
      const account = await StorageService.getWalletAccount();
      if (!account) {
        throw new Error('No wallet account found');
      }

      if (account.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const transaction = await this.createTransaction('debit', amount, description);
      
      // Update balance
      const newBalance = account.balance - amount;
      await this.updateWalletAccount({ balance: newBalance });

      // Update transaction status
      const updatedTransaction = { ...transaction, status: 'completed' as const, completedAt: new Date() };
      const transactions = await StorageService.getTransactions();
      const updatedTransactions = transactions.map(t => 
        t.id === transaction.id ? updatedTransaction : t
      );
      await StorageService.saveTransactions(updatedTransactions);

      return updatedTransaction;
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  }

  /**
   * Get transaction history with optional filtering
   */
  static async getTransactionHistory(filter?: TransactionFilter): Promise<Transaction[]> {
    try {
      let transactions = await StorageService.getTransactions();

      if (filter) {
        if (filter.type) {
          transactions = transactions.filter(t => t.type === filter.type);
        }
        if (filter.status) {
          transactions = transactions.filter(t => t.status === filter.status);
        }
        if (filter.startDate) {
          transactions = transactions.filter(t => new Date(t.createdAt) >= filter.startDate!);
        }
        if (filter.endDate) {
          transactions = transactions.filter(t => new Date(t.createdAt) <= filter.endDate!);
        }
        if (filter.limit) {
          transactions = transactions.slice(0, filter.limit);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(): Promise<number> {
    try {
      const account = await StorageService.getWalletAccount();
      return account?.balance || 0;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  /**
   * Check transaction limits
   */
  static async checkTransactionLimits(amount: number): Promise<{ canTransact: boolean; reason?: string }> {
    try {
      const account = await StorageService.getWalletAccount();
      if (!account) {
        return { canTransact: false, reason: 'No wallet account found' };
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyTransactions = await this.getTransactionHistory({
        startDate: today,
        type: 'debit'
      });

      const dailyTotal = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (dailyTotal + amount > account.dailyLimit) {
        return { canTransact: false, reason: 'Daily limit exceeded' };
      }

      // Check monthly limit
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyTransactions = await this.getTransactionHistory({
        startDate: monthStart,
        type: 'debit'
      });

      const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (monthlyTotal + amount > account.monthlyLimit) {
        return { canTransact: false, reason: 'Monthly limit exceeded' };
      }

      return { canTransact: true };
    } catch (error) {
      console.error('Error checking transaction limits:', error);
      return { canTransact: false, reason: 'Error checking limits' };
    }
  }

  /**
   * Logout and clear all data
   */
  static async logout(): Promise<void> {
    try {
      await StorageService.clearAll();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
}
