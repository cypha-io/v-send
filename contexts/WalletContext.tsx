import { appwriteAuthService } from '@/services/appwriteAuth';
import appwriteWalletService from '@/services/appwriteWallet';
import { AuthState, Transaction, User, WalletAccount, WalletState } from '@/types/wallet';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

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

  const loadStoredAuth = async () => {
    try {
      // For now, we'll skip the stored auth loading since Appwrite handles this differently
      // In a full implementation, you'd check for existing Appwrite sessions
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error loading stored auth:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    loadStoredAuth();
  }, []); // Empty dependency array is correct here

  const login = async (phoneNumber: string): Promise<User> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🔍 Checking if user exists with phone:', phoneNumber);
      
      // First, check if user already exists in our database
      let existingUser = await appwriteWalletService.getUserByPhone(phoneNumber);
      
      if (existingUser) {
        console.log('✅ User found in database:', existingUser);
        console.log('User has complete profile:', !!(existingUser.firstName && existingUser.lastName));
        
        // User exists - attempt to authenticate them
        const tempPassword = 'password123'; // In production, this would be proper auth
        
        try {
          // Check if already authenticated as this user
          try {
            const currentAuthUser = await appwriteAuthService.getCurrentUser();
            if (currentAuthUser && currentAuthUser.$id === existingUser.$id) {
              console.log('🎉 User already authenticated');
              dispatch({ type: 'LOGIN', payload: { user: existingUser as any, token: currentAuthUser.$id } });
              return existingUser as any;
            } else if (currentAuthUser) {
              // Different user session active - logout first
              console.log('Different user session active, logging out...');
              await appwriteAuthService.logout();
            }
          } catch {
            // No current user, continue with login
            console.log('No current session, proceeding with login');
          }
          
          // Try to login existing user
          await appwriteAuthService.login(phoneNumber, tempPassword);
          const authUser = await appwriteAuthService.getCurrentUser();
          
          if (authUser) {
            console.log('🎉 Existing user logged in successfully');
            dispatch({ type: 'LOGIN', payload: { user: existingUser as any, token: authUser.$id } });
            return existingUser as any;
          }
        } catch (authError) {
          console.error('Authentication failed for existing user:', authError);
          throw new Error('Authentication failed');
        }
      }
      
      console.log('📝 New user - creating account and profile');
      
      // User doesn't exist - create new account and profile
      const tempPassword = 'password123';
      
      // Make sure no session is active before creating new account
      try {
        const currentUser = await appwriteAuthService.getCurrentUser();
        if (currentUser) {
          console.log('Clearing existing session before creating new account');
          await appwriteAuthService.logout();
        }
      } catch {
        // No session active, continue
      }
      
      try {
        // Create new Appwrite auth account
        const newAuthUser = await appwriteAuthService.createAccount(phoneNumber, tempPassword);
        console.log('Auth account created:', newAuthUser.$id);
        
        // Since account creation automatically creates a session, get current user
        const currentUser = await appwriteAuthService.getCurrentUser();
        
        if (!currentUser) {
          throw new Error('Failed to authenticate after account creation');
        }
        
        console.log('Creating user profile with minimal info for setup');
        // Create user profile with phone number (names will be added in setup)
        const newUser = await appwriteWalletService.createUserProfile(
          currentUser.$id, 
          phoneNumber, 
          '' // Empty name - will be filled in setup
        );
        
        console.log('User profile created:', newUser);
        
        // Create wallet account for new user
        console.log('Creating wallet account for user:', newUser.$id);
        await appwriteWalletService.createWalletAccount(newUser.$id!);
        console.log('✅ Wallet account created successfully');
        
        dispatch({ type: 'LOGIN', payload: { user: newUser as any, token: currentUser.$id } });
        return newUser as any;
        
      } catch (createError: any) {
        if (createError.message?.includes('already exists') || createError.code === 409) {
          console.log('Account exists in auth but not in our DB - recovering...');
          
          // Account exists in auth but not in our database - try to login
          try {
            await appwriteAuthService.login(phoneNumber, tempPassword);
          } catch (loginError: any) {
            if (loginError.message?.includes('session is active')) {
              // Session already active, just get current user
              console.log('Session already active, getting current user');
            } else {
              throw loginError;
            }
          }
          
          const existingAuthUser = await appwriteAuthService.getCurrentUser();
          
          if (existingAuthUser) {
            // Create the missing user profile
            const recoveredUser = await appwriteWalletService.createUserProfile(
              existingAuthUser.$id, 
              phoneNumber, 
              '' // Empty name - will be filled in setup
            );
            
            // Create wallet account
            await appwriteWalletService.createWalletAccount(recoveredUser.$id!);
            
            dispatch({ type: 'LOGIN', payload: { user: recoveredUser as any, token: existingAuthUser.$id } });
            return recoveredUser as any;
          }
        }
        throw createError;
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.user) {
        await appwriteWalletService.logout((state.user as any).$id || state.user.id);
      }
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!state.user) {
        throw new Error('No authenticated user to update');
      }

      const userId = (state.user as any).$id || state.user.id;
      if (!userId) {
        throw new Error('User ID is required for update');
      }

      console.log('Updating user with ID:', userId, 'Updates:', updates);
      const updatesWithId = { ...updates, $id: userId };
      const updatedUser = await appwriteWalletService.updateUser(updatesWithId as any);
      console.log('User updated successfully:', updatedUser);
      
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER', payload: updatedUser as any });
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
  | { type: 'TOGGLE_BALANCE_VISIBILITY' }
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
    case 'TOGGLE_BALANCE_VISIBILITY':
      return {
        ...state,
        balanceVisible: !state.balanceVisible,
      };
    case 'CLEAR_WALLET':
      return {
        account: null,
        transactions: [],
        isLoading: false,
        error: undefined,
        balanceVisible: true,
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
  balanceVisible: true,
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
  toggleBalanceVisibility: () => void;
  clearWallet: () => void;
} | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);
  const { state: authState } = useAuth();

  const getCurrentUserId = (): string => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }
    // Support both old and new user ID formats
    return (authState.user as any).$id || authState.user.id;
  };

  const loadWalletData = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Loading wallet data for user ID:', userId);
      
      const [account, transactions] = await Promise.all([
        appwriteWalletService.getWalletAccount(userId),
        appwriteWalletService.getTransactionHistory(userId),
      ]);

      console.log('Loaded wallet account:', account);
      console.log('Loaded transactions count:', transactions?.length || 0);

      if (account) {
        dispatch({ type: 'SET_ACCOUNT', payload: account as any });
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions as any });
      } else {
        console.warn('No wallet account found for user:', userId);
        dispatch({ type: 'SET_ERROR', payload: 'No wallet account found' });
      }
    } catch (error) {
      console.error('Error loading wallet data for user:', userId, error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load wallet data' });
    }
  };

  // Load wallet data when user changes, but only once per user
  useEffect(() => {
    if (authState.user && authState.isAuthenticated) {
      const userId = (authState.user as any).$id || authState.user.id;
      console.log('User changed, loading wallet for user ID:', userId);
      loadWalletData(userId);
    } else {
      // Clear wallet when user logs out
      console.log('Clearing wallet data - user not authenticated');
      dispatch({ type: 'CLEAR_WALLET' });
    }
  }, [authState.user, authState.isAuthenticated]); // Depend on full user object and auth status

  const creditWallet = async (amount: number, description: string) => {
    try {
      const userId = getCurrentUserId();
      const transaction = await appwriteWalletService.creditWallet(userId, amount, description);
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction as any });
      dispatch({ type: 'UPDATE_BALANCE', payload: (state.account?.balance || 0) + amount });
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  };

  const debitWallet = async (amount: number, description: string) => {
    try {
      const userId = getCurrentUserId();
      const transaction = await appwriteWalletService.debitWallet(userId, amount, description);
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction as any });
      dispatch({ type: 'UPDATE_BALANCE', payload: (state.account?.balance || 0) - amount });
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  };

  const setWalletPin = async (pin: string) => {
    try {
      const userId = getCurrentUserId();
      await appwriteWalletService.setWalletPin(userId, pin);
    } catch (error) {
      console.error('Error setting wallet PIN:', error);
      throw error;
    }
  };

  const verifyWalletPin = async (pin: string): Promise<boolean> => {
    try {
      const userId = getCurrentUserId();
      return await appwriteWalletService.verifyWalletPin(userId, pin);
    } catch (error) {
      console.error('Error verifying wallet PIN:', error);
      return false;
    }
  };

  const hasWalletPin = async (): Promise<boolean> => {
    try {
      const userId = getCurrentUserId();
      return await appwriteWalletService.hasWalletPin(userId);
    } catch (error) {
      console.error('Error checking wallet PIN:', error);
      return false;
    }
  };

  const refreshTransactions = async () => {
    try {
      const userId = getCurrentUserId();
      const transactions = await appwriteWalletService.getTransactionHistory(userId);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions as any });
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const toggleBalanceVisibility = () => {
    dispatch({ type: 'TOGGLE_BALANCE_VISIBILITY' });
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
      toggleBalanceVisibility,
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
