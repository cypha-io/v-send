import { config, databases } from '@/config/appwrite';

export interface RecipientInfo {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
}

export class RecipientService {
  // Get recipient information by phone number
  static async getRecipientByPhone(phoneNumber: string): Promise<RecipientInfo | null> {
    try {
      console.log('🔍 Looking up recipient:', phoneNumber);
      
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.users,
        [
          `phoneNumber.equal("${phoneNumber}")`
        ]
      );

      if (response.documents.length === 0) {
        console.log('❌ Recipient not found:', phoneNumber);
        return null;
      }

      const user = response.documents[0];
      const recipientInfo: RecipientInfo = {
        id: user.$id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || phoneNumber,
        isActive: user.isActive || false,
        isVerified: user.isVerified || false,
      };

      console.log('✅ Recipient found:', recipientInfo.fullName);
      return recipientInfo;
    } catch (error) {
      console.error('❌ Failed to lookup recipient:', error);
      return null;
    }
  }

  // Validate recipient exists and is active
  static async validateRecipient(phoneNumber: string, currentUserPhone: string): Promise<{
    isValid: boolean;
    recipient?: RecipientInfo;
    error?: string;
  }> {
    try {
      // Check if trying to send to self
      if (phoneNumber === currentUserPhone) {
        return {
          isValid: false,
          error: 'You cannot send money to yourself',
        };
      }

      // Look up recipient
      const recipient = await this.getRecipientByPhone(phoneNumber);
      
      if (!recipient) {
        return {
          isValid: false,
          error: 'Recipient not found. They must be registered with V-Send to receive payments.',
        };
      }

      if (!recipient.isActive) {
        return {
          isValid: false,
          error: 'Recipient account is inactive',
        };
      }

      return {
        isValid: true,
        recipient,
      };
    } catch (error) {
      console.error('❌ Recipient validation error:', error);
      return {
        isValid: false,
        error: 'Failed to validate recipient',
      };
    }
  }

  // Format phone number for display
  static formatPhoneForDisplay(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX if it's a 10-digit number
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return original if can't format
    return phone;
  }

  // Search for recipients by name or phone
  static async searchRecipients(query: string, limit: number = 10): Promise<RecipientInfo[]> {
    try {
      // Search by phone number
      const phoneResponse = await databases.listDocuments(
        config.databaseId,
        config.collections.users,
        [
          `phoneNumber.search("${query}")`
        ]
      );

      // Search by first name
      const firstNameResponse = await databases.listDocuments(
        config.databaseId,
        config.collections.users,
        [
          `firstName.search("${query}")`
        ]
      );

      // Search by last name
      const lastNameResponse = await databases.listDocuments(
        config.databaseId,
        config.collections.users,
        [
          `lastName.search("${query}")`
        ]
      );

      // Combine and deduplicate results
      const allUsers = [
        ...phoneResponse.documents,
        ...firstNameResponse.documents,
        ...lastNameResponse.documents,
      ];

      const uniqueUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.$id === user.$id)
      );

      // Map to RecipientInfo and filter active users
      const recipients = uniqueUsers
        .filter(user => user.isActive)
        .slice(0, limit)
        .map(user => ({
          id: user.$id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber,
          isActive: user.isActive || false,
          isVerified: user.isVerified || false,
        }));

      return recipients;
    } catch (error) {
      console.error('❌ Failed to search recipients:', error);
      return [];
    }
  }
}

export const recipientService = RecipientService;
