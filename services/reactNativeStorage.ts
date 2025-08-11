import { Transaction, User, WalletAccount } from '@/types/wallet';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * React Native compatible storage service
 * This replaces MongoDB for local development
 * Can be easily upgraded to use REST API calls to a backend server with MongoDB
 */
export class ReactNativeStorageService {
  private static readonly STORAGE_KEYS = {
    USERS: 'vsend_users',
    WALLET_ACCOUNTS: 'vsend_wallet_accounts',
    TRANSACTIONS: 'vsend_transactions',
    PINS: 'vsend_pins',
    AUTH_TOKENS: 'vsend_auth_tokens',
  };

  // User Management
  static async saveUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.id === userId) || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.phoneNumber === phoneNumber) || null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) return null;
      
      users[userIndex] = { ...users[userIndex], ...updates };
      await AsyncStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
      
      return users[userIndex];
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  private static async getUsers(): Promise<User[]> {
    try {
      const usersData = await AsyncStorage.getItem(this.STORAGE_KEYS.USERS);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Wallet Account Management
  static async saveWalletAccount(account: WalletAccount): Promise<void> {
    try {
      const accounts = await this.getWalletAccounts();
      const existingIndex = accounts.findIndex(a => a.id === account.id);
      
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.WALLET_ACCOUNTS, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving wallet account:', error);
      throw error;
    }
  }

  static async getWalletAccount(userId: string): Promise<WalletAccount | null> {
    try {
      const accounts = await this.getWalletAccounts();
      return accounts.find(a => a.userId === userId) || null;
    } catch (error) {
      console.error('Error getting wallet account:', error);
      return null;
    }
  }

  static async updateWalletBalance(userId: string, newBalance: number): Promise<void> {
    try {
      const accounts = await this.getWalletAccounts();
      const accountIndex = accounts.findIndex(a => a.userId === userId);
      
      if (accountIndex >= 0) {
        accounts[accountIndex].balance = newBalance;
        accounts[accountIndex].updatedAt = new Date();
        await AsyncStorage.setItem(this.STORAGE_KEYS.WALLET_ACCOUNTS, JSON.stringify(accounts));
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  private static async getWalletAccounts(): Promise<WalletAccount[]> {
    try {
      const accountsData = await AsyncStorage.getItem(this.STORAGE_KEYS.WALLET_ACCOUNTS);
      return accountsData ? JSON.parse(accountsData) : [];
    } catch (error) {
      console.error('Error getting wallet accounts:', error);
      return [];
    }
  }

  // Transaction Management
  static async saveTransaction(transaction: Transaction & { walletAccountId: string }): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.unshift(transaction); // Add to beginning for recent-first order
      await AsyncStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  static async getTransactions(walletAccountId?: string): Promise<Transaction[]> {
    try {
      const transactionsData = await AsyncStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
      const allTransactions = transactionsData ? JSON.parse(transactionsData) : [];
      
      if (walletAccountId) {
        return allTransactions.filter((t: any) => t.walletAccountId === walletAccountId);
      }
      
      return allTransactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  static async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const transactions = await this.getTransactions();
      return transactions.find(t => t.id === transactionId) || null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  // PIN Management
  static async saveHashedPin(userId: string, hashedPin: string): Promise<void> {
    try {
      const pins = await this.getPins();
      const existingIndex = pins.findIndex(p => p.userId === userId);
      
      const pinData = {
        userId,
        hashedPin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        pins[existingIndex] = pinData;
      } else {
        pins.push(pinData);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.PINS, JSON.stringify(pins));
    } catch (error) {
      console.error('Error saving hashed PIN:', error);
      throw error;
    }
  }

  static async getHashedPin(userId: string): Promise<string | null> {
    try {
      const pins = await this.getPins();
      const pinData = pins.find(p => p.userId === userId);
      return pinData?.hashedPin || null;
    } catch (error) {
      console.error('Error getting hashed PIN:', error);
      return null;
    }
  }

  private static async getPins(): Promise<any[]> {
    try {
      const pinsData = await AsyncStorage.getItem(this.STORAGE_KEYS.PINS);
      return pinsData ? JSON.parse(pinsData) : [];
    } catch (error) {
      console.error('Error getting pins:', error);
      return [];
    }
  }

  // Auth Token Management
  static async saveAuthToken(userId: string, token: string): Promise<void> {
    try {
      const tokens = await this.getAuthTokens();
      
      // Deactivate old tokens for this user
      tokens.forEach(t => {
        if (t.userId === userId) {
          t.isActive = false;
        }
      });
      
      // Add new token
      tokens.push({
        userId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        isActive: true,
        createdAt: new Date().toISOString()
      });
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  static async getAuthToken(userId: string): Promise<string | null> {
    try {
      const tokens = await this.getAuthTokens();
      const activeToken = tokens.find(t => 
        t.userId === userId && 
        t.isActive && 
        new Date(t.expiresAt) > new Date()
      );
      return activeToken?.token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  static async clearAuthTokens(userId: string): Promise<void> {
    try {
      const tokens = await this.getAuthTokens();
      tokens.forEach(t => {
        if (t.userId === userId) {
          t.isActive = false;
        }
      });
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
      throw error;
    }
  }

  private static async getAuthTokens(): Promise<any[]> {
    try {
      const tokensData = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKENS);
      return tokensData ? JSON.parse(tokensData) : [];
    } catch (error) {
      console.error('Error getting auth tokens:', error);
      return [];
    }
  }

  // Clear all user data (for logout)
  static async clearUserData(userId: string): Promise<void> {
    await this.clearAuthTokens(userId);
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      // Test AsyncStorage availability
      await AsyncStorage.setItem('vsend_health_check', 'ok');
      await AsyncStorage.removeItem('vsend_health_check');
      return true;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }

  // Utility method to clear all data (for development/testing)
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.USERS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.WALLET_ACCOUNTS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.TRANSACTIONS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.PINS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKENS),
      ]);
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}
