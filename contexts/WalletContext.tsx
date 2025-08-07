import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, WalletAccount, Transaction, AuthState, WalletState } from '@/types/wallet';
import { WalletService } from '@/services/wallet';
import { StorageService } from '@/services/storage';

// Auth Context
type AuthAction = 
  | { type: 'LOGIN'; payload: { user: User; token?: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState & { isLoading: boolean }, action: AuthAction): AuthState & { isLoading: boolean } => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: undefined,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialAuthState: AuthState & { isLoading: boolean } = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<{
  state: AuthState & { isLoading: boolean };
  login: (phoneNumber: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
} | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [user, token] = await Promise.all([
        StorageService.getUser(),
        StorageService.getAuthToken(),
      ]);

      if (user) {
        dispatch({ type: 'LOGIN', payload: { user, token: token || undefined } });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (phoneNumber: string): Promise<User> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      let user = await WalletService.getUserByPhone(phoneNumber);
      
      if (!user) {
        user = await WalletService.createUser(phoneNumber);
        // Create wallet account for new user
        await WalletService.createWalletAccount(user.id);
      }

      // Generate a simple auth token (in production, this would come from a server)
      const token = `token_${user.id}_${Date.now()}`;
      await StorageService.saveAuthToken(token);

      dispatch({ type: 'LOGIN', payload: { user, token } });
      return user;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await WalletService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const updatedUser = await WalletService.updateUser(updates);
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Wallet Context
type WalletAction = 
  | { type: 'SET_ACCOUNT'; payload: WalletAccount }
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'CLEAR_WALLET' };

const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.payload,
        isLoading: false,
        error: undefined,
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        account: state.account ? { ...state.account, balance: action.payload } : null,
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_WALLET':
      return {
        account: null,
        transactions: [],
        isLoading: false,
        error: undefined,
      };
    default:
      return state;
  }
};

const initialWalletState: WalletState = {
  account: null,
  transactions: [],
  isLoading: true,
  error: undefined,
};

const WalletContext = createContext<{
  state: WalletState;
  loadWalletData: (userId: string) => Promise<void>;
  creditWallet: (amount: number, description: string) => Promise<void>;
  debitWallet: (amount: number, description: string) => Promise<void>;
  setWalletPin: (pin: string) => Promise<void>;
  verifyWalletPin: (pin: string) => Promise<boolean>;
  hasWalletPin: () => Promise<boolean>;
  refreshTransactions: () => Promise<void>;
  clearWallet: () => void;
} | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);

  const loadWalletData = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [account, transactions] = await Promise.all([
        WalletService.getWalletAccount(userId),
        WalletService.getTransactionHistory(),
      ]);

      if (account) {
        dispatch({ type: 'SET_ACCOUNT', payload: account });
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'No wallet account found' });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load wallet data' });
    }
  };

  const creditWallet = async (amount: number, description: string) => {
    try {
      const transaction = await WalletService.creditWallet(amount, description);
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      dispatch({ type: 'UPDATE_BALANCE', payload: (state.account?.balance || 0) + amount });
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  };

  const debitWallet = async (amount: number, description: string) => {
    try {
      const transaction = await WalletService.debitWallet(amount, description);
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      dispatch({ type: 'UPDATE_BALANCE', payload: (state.account?.balance || 0) - amount });
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  };

  const setWalletPin = async (pin: string) => {
    try {
      await WalletService.setWalletPin(pin);
    } catch (error) {
      console.error('Error setting wallet PIN:', error);
      throw error;
    }
  };

  const verifyWalletPin = async (pin: string): Promise<boolean> => {
    try {
      return await WalletService.verifyWalletPin(pin);
    } catch (error) {
      console.error('Error verifying wallet PIN:', error);
      return false;
    }
  };

  const hasWalletPin = async (): Promise<boolean> => {
    try {
      return await WalletService.hasWalletPin();
    } catch (error) {
      console.error('Error checking wallet PIN:', error);
      return false;
    }
  };

  const refreshTransactions = async () => {
    try {
      const transactions = await WalletService.getTransactionHistory();
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const clearWallet = () => {
    dispatch({ type: 'CLEAR_WALLET' });
  };

  return (
    <WalletContext.Provider value={{
      state,
      loadWalletData,
      creditWallet,
      debitWallet,
      setWalletPin,
      verifyWalletPin,
      hasWalletPin,
      refreshTransactions,
      clearWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
