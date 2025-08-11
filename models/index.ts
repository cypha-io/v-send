import { Transaction, User, WalletAccount } from '@/types/wallet';
import mongoose, { Document, Schema } from 'mongoose';

// Define enums for the schemas
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed'
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
  WITHDRAWAL = 'withdrawal',
  TOPUP = 'topup'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// User Schema
export interface IUserDocument extends Omit<User, 'id'>, Document {
  id: string;
}

const UserSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, default: '' },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
UserSchema.index({ phoneNumber: 1 });
UserSchema.index({ id: 1 });
UserSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);

// Wallet Account Schema
export interface IWalletAccountDocument extends Omit<WalletAccount, 'id'>, Document {
  id: string;
}

const WalletAccountSchema = new Schema<IWalletAccountDocument>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  accountNumber: { type: String, required: true, unique: true, index: true },
  balance: { type: Number, required: true, default: 0, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: Object.values(WalletStatus), 
    default: WalletStatus.ACTIVE 
  },
  dailyLimit: { type: Number, default: 10000 },
  monthlyLimit: { type: Number, default: 100000 },
  pin: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
WalletAccountSchema.index({ userId: 1 });
WalletAccountSchema.index({ accountNumber: 1 });
WalletAccountSchema.index({ id: 1 });
WalletAccountSchema.index({ status: 1 });

// Virtual for user reference
WalletAccountSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'id',
  justOne: true
});

export const WalletAccountModel = mongoose.model<IWalletAccountDocument>('WalletAccount', WalletAccountSchema);

// Transaction Schema
export interface ITransactionDocument extends Omit<Transaction, 'id'>, Document {
  id: string;
  walletAccountId: string; // Additional field for linking to wallet
}

const TransactionSchema = new Schema<ITransactionDocument>({
  id: { type: String, required: true, unique: true, index: true },
  walletAccountId: { type: String, required: true, index: true },
  fromAccountId: { type: String },
  toAccountId: { type: String },
  type: { 
    type: String, 
    enum: Object.values(TransactionType), 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(TransactionStatus), 
    default: TransactionStatus.COMPLETED 
  },
  reference: { type: String, required: true, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
TransactionSchema.index({ walletAccountId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ recipientPhone: 1 });
TransactionSchema.index({ createdAt: -1 });

// Virtual for wallet account reference
TransactionSchema.virtual('walletAccount', {
  ref: 'WalletAccount',
  localField: 'walletAccountId',
  foreignField: 'id',
  justOne: true
});

export const TransactionModel = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

// PIN Storage Schema (for secure PIN management)
export interface IPinDocument extends Document {
  _id: string;
  userId: string;
  hashedPin: string;
  createdAt: Date;
  updatedAt: Date;
}

const PinSchema = new Schema<IPinDocument>({
  userId: { type: String, required: true, unique: true, index: true },
  hashedPin: { type: String, required: true },
}, {
  timestamps: true
});

PinSchema.index({ userId: 1 });

export const PinModel = mongoose.model<IPinDocument>('Pin', PinSchema);

// Auth Token Schema (for session management)
export interface IAuthTokenDocument extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthTokenSchema = new Schema<IAuthTokenDocument>({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  deviceInfo: { type: String },
}, {
  timestamps: true
});

AuthTokenSchema.index({ userId: 1 });
AuthTokenSchema.index({ token: 1 });
AuthTokenSchema.index({ expiresAt: 1 });

export const AuthTokenModel = mongoose.model<IAuthTokenDocument>('AuthToken', AuthTokenSchema);

// Export all models for easy import
export const Models = {
  User: UserModel,
  WalletAccount: WalletAccountModel,
  Transaction: TransactionModel,
  Pin: PinModel,
  AuthToken: AuthTokenModel,
};

// Function to create indexes and ensure database schema
export const ensureDatabaseSchema = async (): Promise<void> => {
  try {
    console.log('🔄 Ensuring database schema...');
    
    // Create collections if they don't exist and ensure indexes
    await Promise.all([
      UserModel.createIndexes(),
      WalletAccountModel.createIndexes(),
      TransactionModel.createIndexes(),
      PinModel.createIndexes(),
      AuthTokenModel.createIndexes(),
    ]);
    
    console.log('✅ Database schema ensured successfully');
  } catch (error) {
    console.error('❌ Error ensuring database schema:', error);
    throw error;
  }
};
