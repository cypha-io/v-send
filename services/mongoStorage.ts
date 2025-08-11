import { dbManager } from '@/config/database';
import {
    ITransactionDocument,
    IUserDocument,
    IWalletAccountDocument,
    Models
} from '@/models';
import { Transaction, User, WalletAccount } from '@/types/wallet';

export class MongoStorageService {
  // Ensure database connection before operations
  private async ensureConnection(): Promise<void> {
    await dbManager.ensureConnection();
  }

  // User Management
  async saveUser(user: User): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.User.findOneAndUpdate(
        { id: user.id },
        user,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async getUser(userId?: string): Promise<User | null> {
    if (!userId) return null;
    
    await this.ensureConnection();
    try {
      const userDoc = await Models.User.findOne({ id: userId }).lean();
      return userDoc ? this.documentToUser(userDoc) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    await this.ensureConnection();
    try {
      const userDoc = await Models.User.findOne({ phoneNumber }).lean();
      return userDoc ? this.documentToUser(userDoc) : null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await this.ensureConnection();
    try {
      const userDoc = await Models.User.findOneAndUpdate(
        { id: userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      return userDoc ? this.documentToUser(userDoc) : null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.User.deleteOne({ id: userId });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Wallet Account Management
  async saveWalletAccount(account: WalletAccount): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.WalletAccount.findOneAndUpdate(
        { id: account.id },
        account,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving wallet account:', error);
      throw error;
    }
  }

  async getWalletAccount(userId?: string): Promise<WalletAccount | null> {
    if (!userId) return null;
    
    await this.ensureConnection();
    try {
      const accountDoc = await Models.WalletAccount.findOne({ userId }).lean();
      return accountDoc ? this.documentToWalletAccount(accountDoc) : null;
    } catch (error) {
      console.error('Error getting wallet account:', error);
      return null;
    }
  }

  async updateWalletBalance(userId: string, newBalance: number): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.WalletAccount.findOneAndUpdate(
        { userId },
        { balance: newBalance, updatedAt: new Date() }
      );
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  // Transaction Management
  async saveTransaction(transaction: Transaction & { walletAccountId: string }): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.Transaction.create(transaction);
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async getTransactions(walletAccountId?: string): Promise<Transaction[]> {
    if (!walletAccountId) return [];
    
    await this.ensureConnection();
    try {
      const transactionDocs = await Models.Transaction
        .find({ walletAccountId })
        .sort({ createdAt: -1 })
        .lean();
      
      return transactionDocs.map(this.documentToTransaction);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    await this.ensureConnection();
    try {
      const transactionDoc = await Models.Transaction.findOne({ id: transactionId }).lean();
      return transactionDoc ? this.documentToTransaction(transactionDoc) : null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  // PIN Management
  async saveHashedPin(userId: string, hashedPin: string): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.Pin.findOneAndUpdate(
        { userId },
        { hashedPin },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving hashed PIN:', error);
      throw error;
    }
  }

  async getHashedPin(userId: string): Promise<string | null> {
    await this.ensureConnection();
    try {
      const pinDoc = await Models.Pin.findOne({ userId }).lean();
      return pinDoc?.hashedPin || null;
    } catch (error) {
      console.error('Error getting hashed PIN:', error);
      return null;
    }
  }

  async deleteHashedPin(userId: string): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.Pin.deleteOne({ userId });
    } catch (error) {
      console.error('Error deleting hashed PIN:', error);
      throw error;
    }
  }

  // Auth Token Management
  async saveAuthToken(userId: string, token: string, expiresAt?: Date): Promise<void> {
    await this.ensureConnection();
    try {
      const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      
      // Deactivate old tokens
      await Models.AuthToken.updateMany(
        { userId },
        { isActive: false }
      );
      
      // Create new token
      await Models.AuthToken.create({
        userId,
        token,
        expiresAt: expiry,
        isActive: true
      });
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  async getAuthToken(userId?: string): Promise<string | null> {
    if (!userId) return null;
    
    await this.ensureConnection();
    try {
      const tokenDoc = await Models.AuthToken
        .findOne({ 
          userId, 
          isActive: true, 
          expiresAt: { $gt: new Date() } 
        })
        .sort({ createdAt: -1 })
        .lean();
      
      return tokenDoc?.token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async verifyAuthToken(token: string): Promise<boolean> {
    await this.ensureConnection();
    try {
      const tokenDoc = await Models.AuthToken
        .findOne({ 
          token, 
          isActive: true, 
          expiresAt: { $gt: new Date() } 
        })
        .lean();
      
      return !!tokenDoc;
    } catch (error) {
      console.error('Error verifying auth token:', error);
      return false;
    }
  }

  async clearAuthTokens(userId: string): Promise<void> {
    await this.ensureConnection();
    try {
      await Models.AuthToken.updateMany(
        { userId },
        { isActive: false }
      );
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
      throw error;
    }
  }

  // Clear all user data (for logout)
  async clearUserData(userId: string): Promise<void> {
    await this.clearAuthTokens(userId);
    // Note: We don't delete user data, just deactivate tokens
  }

  // Utility methods to convert documents to domain objects
  private documentToUser(doc: IUserDocument): User {
    return {
      id: doc.id,
      phoneNumber: doc.phoneNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      createdAt: doc.createdAt,
      isVerified: doc.isVerified,
      role: doc.role as 'user' | 'admin'
    };
  }

  private documentToWalletAccount(doc: IWalletAccountDocument): WalletAccount {
    return {
      id: doc.id,
      userId: doc.userId,
      accountNumber: doc.accountNumber,
      balance: doc.balance,
      currency: doc.currency,
      status: doc.status as 'active' | 'suspended' | 'closed',
      dailyLimit: doc.dailyLimit,
      monthlyLimit: doc.monthlyLimit,
      pin: doc.pin,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  private documentToTransaction(doc: ITransactionDocument): Transaction {
    return {
      id: doc.id,
      fromAccountId: doc.fromAccountId,
      toAccountId: doc.toAccountId,
      amount: doc.amount,
      currency: doc.currency,
      type: doc.type as 'credit' | 'debit' | 'transfer' | 'withdrawal' | 'topup',
      status: doc.status as 'pending' | 'completed' | 'failed' | 'cancelled',
      description: doc.description,
      reference: doc.reference,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      completedAt: doc.completedAt
    };
  }

  // Database health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      return dbManager.isConnectedToDatabase();
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mongoStorageService = new MongoStorageService();
