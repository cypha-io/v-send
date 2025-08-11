import { useAuth, useWallet } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatCurrency } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface UserProfileHeaderProps {
  onLogout?: () => void;
  showLogoutButton?: boolean;
}

export function UserProfileHeader({ onLogout, showLogoutButton = true }: UserProfileHeaderProps) {
  const { state: authState } = useAuth();
  const { state: walletState } = useWallet();
  
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#f8f9fa', dark: '#1c1c1e' }, 'background');

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

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const getWalletAccountNumber = () => {
    return walletState.account?.accountNumber || 'No wallet';
  };

  const getWalletBalance = () => {
    return walletState.account?.balance || 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: cardColor }]}>
      {/* User Avatar */}
      <View style={[styles.avatar, { backgroundColor: tintColor }]}>
        <Text style={styles.initials}>
          {getUserInitials()}
        </Text>
      </View>
      
      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: textColor }]}>
          {getUserDisplayName()}
        </Text>
        <Text style={[styles.userPhone, { color: textColor, opacity: 0.7 }]}>
          {authState.user?.phoneNumber || 'No phone'}
        </Text>
        <Text style={[styles.walletInfo, { color: tintColor, fontSize: 12, fontWeight: '600' }]}>
          💳 {getWalletAccountNumber()}
        </Text>
        <Text style={[styles.balanceInfo, { color: '#4CAF50', fontSize: 14, fontWeight: 'bold' }]}>
          {formatCurrency(getWalletBalance())}
        </Text>
      </View>
      
      {/* Logout Button */}
      {showLogoutButton && onLogout && (
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: tintColor + '20' }]}
          onPress={onLogout}
        >
          <Ionicons name="log-out" size={20} color={tintColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  walletInfo: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  balanceInfo: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
