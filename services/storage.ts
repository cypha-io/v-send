import { Transaction, User, WalletAccount } from '@/types/wallet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  USER: '@wallet_user',
  AUTH_TOKEN: '@wallet_auth_token',
  WALLET_ACCOUNT: '@wallet_account',
  TRANSACTIONS: '@wallet_transactions',
  PIN_HASH: '@wallet_pin_hash',
} as const;

export class StorageService {
  // Secure storage for sensitive data
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error storing secure item:', error);
      throw error;
    }
  }

  static async getSecureItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      return null;
    }
  }

  static async deleteSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error deleting secure item:', error);
    }
  }

  // Regular storage for non-sensitive data
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  // User management
  static async saveUser(user: User): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER, user);
  }

  static async getUser(): Promise<User | null> {
    return await this.getItem<User>(STORAGE_KEYS.USER);
  }

  static async removeUser(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER);
  }

  // Auth token management
  static async saveAuthToken(token: string): Promise<void> {
    await this.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  static async getAuthToken(): Promise<string | null> {
    return await this.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static async removeAuthToken(): Promise<void> {
    await this.deleteSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Wallet account management
  static async saveWalletAccount(account: WalletAccount): Promise<void> {
    await this.setItem(STORAGE_KEYS.WALLET_ACCOUNT, account);
  }

  static async getWalletAccount(): Promise<WalletAccount | null> {
    return await this.getItem<WalletAccount>(STORAGE_KEYS.WALLET_ACCOUNT);
  }

  static async removeWalletAccount(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.WALLET_ACCOUNT);
  }

  // Transactions management
  static async saveTransactions(transactions: Transaction[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static async getTransactions(): Promise<Transaction[]> {
    const transactions = await this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
    return transactions || [];
  }

  static async addTransaction(transaction: Transaction): Promise<void> {
    const existingTransactions = await this.getTransactions();
    const updatedTransactions = [transaction, ...existingTransactions];
    await this.saveTransactions(updatedTransactions);
  }

  // PIN management
  static async savePinHash(pinHash: string): Promise<void> {
    await this.setSecureItem(STORAGE_KEYS.PIN_HASH, pinHash);
  }

  static async getPinHash(): Promise<string | null> {
    return await this.getSecureItem(STORAGE_KEYS.PIN_HASH);
  }

  static async removePinHash(): Promise<void> {
    await this.deleteSecureItem(STORAGE_KEYS.PIN_HASH);
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    await Promise.all([
      this.removeUser(),
      this.removeAuthToken(),
      this.removeWalletAccount(),
      this.removeItem(STORAGE_KEYS.TRANSACTIONS),
      this.removePinHash(),
    ]);
  }
}
