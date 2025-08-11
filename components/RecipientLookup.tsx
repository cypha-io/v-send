import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecipientInfo, recipientService } from '@/services/recipientService';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

interface RecipientLookupProps {
  onRecipientSelected: (recipient: RecipientInfo) => void;
  currentUserPhone: string;
  placeholder?: string;
}

export const RecipientLookup: React.FC<RecipientLookupProps> = ({
  onRecipientSelected,
  currentUserPhone,
  placeholder = 'Enter phone number',
}) => {
  const colorScheme = useColorScheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phoneNumber.length >= 10) {
      lookupRecipient();
    } else {
      setRecipient(null);
      setError(null);
    }
  }, [phoneNumber]);

  const lookupRecipient = async () => {
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const validation = await recipientService.validateRecipient(phoneNumber, currentUserPhone);
      
      if (validation.isValid && validation.recipient) {
        setRecipient(validation.recipient);
        onRecipientSelected(validation.recipient);
        setError(null);
      } else {
        setRecipient(null);
        setError(validation.error || 'Recipient not found');
      }
    } catch (err) {
      setRecipient(null);
      setError('Failed to lookup recipient');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    const cleaned = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // Format as XXX-XXX-XXXX
    if (limited.length >= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    } else if (limited.length >= 3) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    }
    
    return limited;
  };

  const handlePhoneChange = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
        Recipient Phone Number
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: error 
                ? '#F44336' 
                : recipient 
                ? '#4CAF50' 
                : Colors[colorScheme ?? 'light'].tabIconDefault,
              color: Colors[colorScheme ?? 'light'].text,
            },
          ]}
          value={formatPhoneNumber(phoneNumber)}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          keyboardType="phone-pad"
          maxLength={12} // Formatted length: XXX-XXX-XXXX
        />
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {recipient && (
        <View style={[styles.recipientContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <Text style={styles.recipientLabel}>Sending to:</Text>
          <View style={styles.recipientInfo}>
            <Text style={[styles.recipientName, { color: Colors[colorScheme ?? 'light'].text }]}>
              {recipient.fullName}
            </Text>
            <Text style={[styles.recipientPhone, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              {recipientService.formatPhoneForDisplay(recipient.phoneNumber)}
            </Text>
            {recipient.isVerified && (
              <Text style={styles.verifiedBadge}>✅ Verified</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    paddingRight: 40, // Space for loading indicator
  },
  loadingContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
  recipientContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  recipientLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  recipientPhone: {
    fontSize: 14,
    marginRight: 8,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default RecipientLookup;
