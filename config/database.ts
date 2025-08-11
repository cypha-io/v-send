import mongoose from 'mongoose';

// MongoDB configuration
export const MONGODB_CONFIG = {
  // For development, you can use MongoDB Atlas free tier or local MongoDB
  // Replace this with your actual MongoDB connection string
  connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/vsend-wallet',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority',
  } as mongoose.ConnectOptions,
};

// Database connection manager
class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(MONGODB_CONFIG.connectionString, MONGODB_CONFIG.options);
      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async ensureConnection(): Promise<void> {
    if (!this.isConnectedToDatabase()) {
      await this.connect();
    }
  }
}

export const dbManager = DatabaseManager.getInstance();

// Initialize database connection on app start
export const initializeDatabase = async (): Promise<void> => {
  try {
    await dbManager.connect();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // In a production app, you might want to handle this differently
    // For now, we'll continue without database connection
  }
};
