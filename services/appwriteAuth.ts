import { account } from '@/config/appwrite';
import { ID } from 'react-native-appwrite';

export interface AuthUser {
  $id: string;
  name: string;
  email: string;
  phone: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  status: boolean;
  registration: string;
}

export interface AuthSession {
  $id: string;
  userId: string;
  expire: string;
  provider: string;
  providerUid: string;
  providerAccessToken: string;
  providerAccessTokenExpiry: string;
  providerRefreshToken: string;
  ip: string;
  osCode: string;
  osName: string;
  osVersion: string;
  clientType: string;
  clientCode: string;
  clientName: string;
  clientVersion: string;
  clientEngine: string;
  clientEngineVersion: string;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  countryCode: string;
  countryName: string;
  current: boolean;
}

class AppwriteAuthService {
  // Create account with phone number (using email as required field)
  async createAccount(phoneNumber: string, password: string, firstName?: string, lastName?: string): Promise<AuthUser> {
    try {
      // Since Appwrite requires email for account creation, we'll use phone as email temporarily
      const email = `${phoneNumber.replace('+', '')}@vsend.temp`;
      const name = `${firstName || ''} ${lastName || ''}`.trim() || phoneNumber;
      
      console.log('Creating Appwrite account with:', { email, name, phoneNumber });
      
      const user = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      console.log('Account created successfully:', user);
      
      // Update phone number if possible
      try {
        await account.updatePhone(phoneNumber, password);
        console.log('Phone number updated successfully');
      } catch (phoneError) {
        console.log('Phone update failed (this is okay):', phoneError);
      }

      return user as AuthUser;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Login with email/phone and password
  async login(identifier: string, password: string): Promise<AuthSession> {
    try {
      // If identifier looks like a phone number, convert to email format
      const email = identifier.includes('@') ? identifier : `${identifier.replace('+', '')}@vsend.temp`;
      
      console.log('Logging in with:', email);
      
      const session = await account.createEmailPasswordSession(email, password);
      
      console.log('Login successful:', session);
      return session as AuthSession;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get();
      return user as AuthUser;
    } catch (error) {
      console.log('No authenticated user:', error);
      return null;
    }
  }

  // Get current session
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const session = await account.getSession('current');
      return session as AuthSession;
    } catch (error) {
      console.log('No active session:', error);
      return null;
    }
  }

  // Logout (delete current session)
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Logout from all devices
  async logoutAll(): Promise<void> {
    try {
      await account.deleteSessions();
      console.log('Logged out from all devices');
    } catch (error) {
      console.error('Error logging out from all devices:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(name?: string, email?: string): Promise<AuthUser> {
    try {
      let user = await account.get();
      
      if (name) {
        user = await account.updateName(name);
      }
      
      if (email && email !== user.email) {
        user = await account.updateEmail(email, 'password123'); // You'll need the current password
      }
      
      return user as AuthUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(newPassword: string, oldPassword: string): Promise<AuthUser> {
    try {
      const user = await account.updatePassword(newPassword, oldPassword);
      return user as AuthUser;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }

  // Get user by phone number (for checking if user exists)
  async getUserByPhone(phoneNumber: string): Promise<AuthUser | null> {
    try {
      // Since we store phone numbers as emails, convert and check
      const email = `${phoneNumber.replace('+', '')}@vsend.temp`;
      
      // We can't directly search for users with client SDK
      // This would need to be done through a server function
      // For now, we'll return null and handle user existence during login attempts
      return null;
    } catch (error) {
      console.log('Error getting user by phone:', error);
      return null;
    }
  }
}

export const appwriteAuthService = new AppwriteAuthService();
export default appwriteAuthService;
