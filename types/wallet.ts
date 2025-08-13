export interface User {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: Date;
  isVerified: boolean;
  role: 'user' | 'admin';
}

export interface WalletAccount {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'closed';
  dailyLimit: number;
  monthlyLimit: number;
  pin?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit' | 'transfer' | 'withdrawal' | 'topup';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface TransactionSummary {
  totalIn: number;
  totalOut: number;
  transactionCount: number;
  period: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}

export interface WalletState {
  account: WalletAccount | null;
  transactions: Transaction[];
  isLoading: boolean;
  error?: string;
  balanceVisible: boolean;
}

export type TransactionFilter = {
  type?: Transaction['type'];
  status?: Transaction['status'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};
