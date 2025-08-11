import { useAuth, useWallet } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

export function WalletIdentifier() {
  const { state: authState } = useAuth();
  const { state: walletState } = useWallet();
  
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');

  const getUserDisplayName = () => {
    if (!authState.user) return 'User';
    const firstName = authState.user.firstName || '';
    const lastName = authState.user.lastName || '';
    
    // If we have proper names, use them
    if (firstName && lastName && firstName !== authState.user.phoneNumber) {
      return `${firstName} ${lastName}`;
    }
    
    // If firstName is same as phone number, it's a temporary name
    if (firstName === authState.user.phoneNumber) {
      return 'User ' + (authState.user.phoneNumber?.slice(-4) || '');
    }
    
    return firstName || 'User';
  };

  const getWalletId = () => {
    const userId = (authState.user as any)?.$id || '';
    return userId.slice(-8) || 'Loading...';
  };

  const getAccountNumber = () => {
    return walletState.account?.accountNumber || 'Generating...';
  };

  return (
    <View style={[styles.container, { backgroundColor: cardColor }]}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={24} color={tintColor} />
        <Text style={[styles.title, { color: textColor }]}>
          Personal Wallet
        </Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
            Owner:
          </Text>
          <Text style={[styles.value, { color: textColor }]}>
            {getUserDisplayName()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
            Account:
          </Text>
          <Text style={[styles.value, { color: tintColor, fontFamily: 'monospace' }]}>
            {getAccountNumber()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
            Wallet ID:
          </Text>
          <Text style={[styles.value, { color: textColor, fontFamily: 'monospace' }]}>
            ...{getWalletId()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: textColor, opacity: 0.7 }]}>
            User ID:
          </Text>
          <Text style={[styles.value, { color: textColor, fontFamily: 'monospace' }]}>
            ...{((authState.user as any)?.$id || '').slice(-8) || 'Loading...'}
          </Text>
        </View>
      </View>
      
      <View style={[styles.badge, { backgroundColor: tintColor + '20' }]}>
        <Ionicons name="shield-checkmark" size={14} color={tintColor} />
        <Text style={[styles.badgeText, { color: tintColor }]}>
          Private & Secure
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  details: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
