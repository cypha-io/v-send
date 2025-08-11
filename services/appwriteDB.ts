import { config, databases } from '@/config/appwrite';
import { Permission, Role } from 'react-native-appwrite';

export class AppwriteDBManager {
  private static instance: AppwriteDBManager;
  private isInitialized = false;

  static getInstance(): AppwriteDBManager {
    if (!AppwriteDBManager.instance) {
      AppwriteDBManager.instance = new AppwriteDBManager();
    }
    return AppwriteDBManager.instance;
  }

  /**
   * Initialize database and create all collections with proper schemas
   */
  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Database already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Appwrite database...');
      
      // Create all collections (database is created automatically in Appwrite Cloud)
      await this.createUsersCollection();
      await this.createWalletAccountsCollection();
      await this.createTransactionsCollection();
      await this.createReceiptsCollection();
      await this.createPinsCollection();
      await this.createAuthTokensCollection();
      
      this.isInitialized = true;
      console.log('✅ Appwrite database initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      // Don't throw error, continue with app functionality
      console.log('📋 Continuing with existing database setup...');
      this.isInitialized = true;
    }
  }

  private async createUsersCollection(): Promise<void> {
    await this.createCollectionIfNotExists(
      config.collections.users,
      'Users',
      [
        // String attributes
        { key: 'phoneNumber', size: 20, required: true, default: undefined, array: false },
        { key: 'firstName', size: 50, required: false, default: undefined, array: false },
        { key: 'lastName', size: 50, required: false, default: undefined, array: false },
        { key: 'email', size: 100, required: false, default: undefined, array: false },
        { key: 'role', size: 20, required: true, default: 'user', array: false },
        { key: 'pinHash', size: 128, required: false, default: undefined, array: false },
        { key: 'pinSalt', size: 64, required: false, default: undefined, array: false },
      ],
      [
        // Boolean attributes
        { key: 'isVerified', required: true, default: false, array: false },
        { key: 'isActive', required: true, default: true, array: false },
        { key: 'isPinSet', required: true, default: false, array: false },
      ],
      [
        // DateTime attributes
        { key: 'lastLoginAt', required: false, default: undefined, array: false },
      ],
      [
        // Create index on phoneNumber for fast lookups
        { key: 'phoneNumber_index', type: 'key', attributes: ['phoneNumber'], orders: ['ASC'] },
      ]
    );
  }

  private async createWalletAccountsCollection(): Promise<void> {
    await this.createCollectionIfNotExists(
      config.collections.walletAccounts,
      'Wallet Accounts',
      [
        // String attributes
        { key: 'userId', size: 50, required: true, default: undefined, array: false },
        { key: 'accountNumber', size: 20, required: true, default: undefined, array: false },
        { key: 'currency', size: 10, required: true, default: 'GHS', array: false },
        { key: 'status', size: 20, required: true, default: 'active', array: false },
      ],
      [
        // Boolean attributes
        { key: 'isDefault', required: true, default: true, array: false },
      ],
      [
        // DateTime attributes  
        { key: 'lastTransactionAt', required: false, default: undefined, array: false },
      ],
      [
        // Create indexes
        { key: 'userId_index', type: 'key', attributes: ['userId'], orders: ['ASC'] },
        { key: 'accountNumber_index', type: 'unique', attributes: ['accountNumber'], orders: ['ASC'] },
      ],
      [
        // Float attributes
        { key: 'balance', min: 0.0, max: 999999999.99, default: 0.0, required: true, array: false },
        { key: 'dailyLimit', min: 0.0, max: 999999999.99, default: 10000.0, required: true, array: false },
        { key: 'monthlyLimit', min: 0.0, max: 999999999.99, default: 100000.0, required: true, array: false },
      ]
    );
  }

  private async createTransactionsCollection(): Promise<void> {
    await this.createCollectionIfNotExists(
      config.collections.transactions,
      'Transactions',
      [
        // String attributes
        { key: 'walletAccountId', size: 50, required: true, default: undefined, array: false },
        { key: 'type', size: 20, required: true, default: undefined, array: false },
        { key: 'description', size: 500, required: false, default: undefined, array: false },
        { key: 'reference', size: 50, required: true, default: undefined, array: false },
        { key: 'status', size: 20, required: true, default: 'pending', array: false },
        { key: 'recipientPhone', size: 20, required: false, default: undefined, array: false },
        { key: 'metadata', size: 2000, required: false, default: undefined, array: false },
      ],
      [],
      [],
      [
        // Create indexes
        { key: 'walletAccountId_index', type: 'key', attributes: ['walletAccountId'], orders: ['DESC'] },
        { key: 'type_index', type: 'key', attributes: ['type'], orders: ['ASC'] },
        { key: 'status_index', type: 'key', attributes: ['status'], orders: ['ASC'] },
        { key: 'reference_index', type: 'unique', attributes: ['reference'], orders: ['ASC'] },
      ],
      [
        // Float attributes
        { key: 'amount', min: 0.01, max: 999999999.99, default: undefined, required: true, array: false },
      ]
    );
  }

  private async createReceiptsCollection(): Promise<void> {
    await this.createCollectionIfNotExists(
      config.collections.receipts,
      'Receipts',
      [
        // String attributes
        { key: 'transactionId', size: 50, required: true, default: undefined, array: false },
        { key: 'receiptNumber', size: 30, required: true, default: undefined, array: false },
        { key: 'transactionType', size: 20, required: true, default: undefined, array: false },
        { key: 'currency', size: 10, required: true, default: 'GHS', array: false },
        { key: 'senderName', size: 100, required: true, default: undefined, array: false },
        { key: 'senderPhone', size: 20, required: true, default: undefined, array: false },
        { key: 'recipientName', size: 100, required: false, default: undefined, array: false },
        { key: 'recipientPhone', size: 20, required: false, default: undefined, array: false },
        { key: 'description', size: 500, required: true, default: undefined, array: false },
        { key: 'status', size: 20, required: true, default: 'pending', array: false },
        { key: 'timestamp', size: 50, required: true, default: undefined, array: false },
        { key: 'paymentReference', size: 100, required: false, default: undefined, array: false },
        { key: 'metadata', size: 2000, required: false, default: undefined, array: false },
      ],
      [],
      [],
      [
        // Create indexes
        { key: 'transactionId_index', type: 'key', attributes: ['transactionId'], orders: ['ASC'] },
        { key: 'receiptNumber_index', type: 'unique', attributes: ['receiptNumber'], orders: ['ASC'] },
        { key: 'senderPhone_index', type: 'key', attributes: ['senderPhone'], orders: ['ASC'] },
        { key: 'recipientPhone_index', type: 'key', attributes: ['recipientPhone'], orders: ['ASC'] },
        { key: 'timestamp_index', type: 'key', attributes: ['timestamp'], orders: ['DESC'] },
      ],
      [
        // Float attributes
        { key: 'amount', min: 0.01, max: 999999999.99, default: undefined, required: true, array: false },
        { key: 'fee', min: 0.0, max: 999999999.99, default: 0.0, required: false, array: false },
        { key: 'balanceAfter', min: 0.0, max: 999999999.99, default: undefined, required: true, array: false },
      ]
    );
  }

  private async createPinsCollection(): Promise<void> {
    await this.createCollectionIfNotExists(
      config.collections.pins,
      'PINs',
      [
        // String attributes
        { key: 'userId', size: 50, required: true, default: undefined, array: false },
        { key: 'hashedPin', size: 128, required: true, default: undefined, array: false },
        { key: 'salt', size: 64, required: true, default: undefined, array: false },
      ],
      [
        // Boolean attributes
        { key: 'isActive', required: true, default: true, array: false },
      ],
      [
        // DateTime attributes
        { key: 'lastUsedAt', required: false, default: undefined, array: false },
      ],
      [
        // Create index
        { key: 'userId_index', type: 'unique', attributes: ['userId'], orders: ['ASC'] },
      ]
    );
  }

  private async createAuthTokensCollection(): Promise<void> {
    await this.createCollectionIfNotExists(
      config.collections.authTokens,
      'Auth Tokens',
      [
        // String attributes
        { key: 'userId', size: 50, required: true, default: undefined, array: false },
        { key: 'token', size: 128, required: true, default: undefined, array: false },
        { key: 'deviceInfo', size: 500, required: false, default: undefined, array: false },
      ],
      [
        // Boolean attributes
        { key: 'isActive', required: true, default: true, array: false },
      ],
      [
        // DateTime attributes
        { key: 'expiresAt', required: true, default: undefined, array: false },
        { key: 'lastUsedAt', required: false, default: undefined, array: false },
      ],
      [
        // Create indexes
        { key: 'userId_index', type: 'key', attributes: ['userId'], orders: ['ASC'] },
        { key: 'token_index', type: 'unique', attributes: ['token'], orders: ['ASC'] },
      ]
    );
  }

  private async createCollectionIfNotExists(
    collectionId: string,
    name: string,
    stringAttributes: any[] = [],
    booleanAttributes: any[] = [],
    datetimeAttributes: any[] = [],
    indexes: any[] = [],
    floatAttributes: any[] = []
  ): Promise<void> {
    try {
      // Try to get the collection first
      await databases.getCollection(config.databaseId, collectionId);
      console.log(`📁 Collection '${name}' already exists`);
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`📁 Creating collection '${name}'...`);
        
        // Create collection with proper permissions
        await databases.createCollection(
          config.databaseId,
          collectionId,
          name,
          [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ]
        );

        // Add string attributes
        for (const attr of stringAttributes) {
          await databases.createStringAttribute(
            config.databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
        }

        // Add boolean attributes
        for (const attr of booleanAttributes) {
          await databases.createBooleanAttribute(
            config.databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        }

        // Add datetime attributes
        for (const attr of datetimeAttributes) {
          await databases.createDatetimeAttribute(
            config.databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
        }

        // Add float attributes
        for (const attr of floatAttributes) {
          await databases.createFloatAttribute(
            config.databaseId,
            collectionId,
            attr.key,
            attr.min,
            attr.max,
            attr.default,
            attr.required,
            attr.array
          );
        }

        // Wait a bit for attributes to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create indexes
        for (const index of indexes) {
          try {
            await databases.createIndex(
              config.databaseId,
              collectionId,
              index.key,
              index.type,
              index.attributes,
              index.orders
            );
          } catch (indexError) {
            console.warn(`⚠️  Index '${index.key}' creation warning:`, indexError);
          }
        }

        console.log(`✅ Collection '${name}' created successfully`);
      } else {
        throw error;
      }
    }
  }
}

export const dbManager = AppwriteDBManager.getInstance();
