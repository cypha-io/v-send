import { QuickActionModal } from '@/components/QuickActionModal';
import { UserProfileHeader } from '@/components/UserProfileHeader';
import { WalletIdentifier } from '@/components/WalletIdentifier';
import { useAuth, useWallet } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatCurrency, formatDateTime, getTransactionTypeIcon } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletDashboard() {
  const { logout } = useAuth();
  const { state: walletState, refreshTransactions, toggleBalanceVisibility } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'topup' | 'send' | 'pay' | 'withdraw'>('topup');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#f8f9fa', dark: '#1c1c1e' }, 'background');

  // Remove the problematic useEffect that was calling loadWalletData
  // The wallet data is now loaded automatically by the WalletProvider

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTransactions();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout()
        },
      ]
    );
  };

  const handleQuickAction = (action: 'topup' | 'send' | 'pay' | 'withdraw') => {
    setSelectedAction(action);
    setModalVisible(true);
  };

  const recentTransactions = walletState.transactions.slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
      >
        {/* User Profile Header */}
        <UserProfileHeader onLogout={handleLogout} />

        {/* Wallet Identifier - Shows this is a unique personal wallet */}
        <WalletIdentifier />

        {/* Personalized Greeting */}
        <View style={[styles.greetingCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.greetingText, { color: textColor }]}>
            Welcome to your personal wallet! 🎉
          </Text>
          <Text style={[styles.greetingSubtext, { color: textColor, opacity: 0.7 }]}>
            Your wallet account {walletState.account?.accountNumber || 'is loading...'} is active and secure.
          </Text>
          {walletState.transactions.length > 0 && (
            <Text style={[styles.statsText, { color: tintColor }]}>
              📊 You have {walletState.transactions.length} transactions
            </Text>
          )}
        </View>

        {/* Balance Card - Enhanced UI */}
        <View style={[styles.balanceCard, { backgroundColor: tintColor }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <TouchableOpacity
              onPress={toggleBalanceVisibility}
              style={styles.visibilityButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={walletState.balanceVisible ? "eye" : "eye-off"} 
                size={20} 
                color="rgba(255, 255, 255, 0.9)" 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceDisplay}>
            <Text style={styles.balanceAmount}>
              {walletState.balanceVisible 
                ? formatCurrency(walletState.account?.balance || 0)
                : '••••••'
              }
            </Text>
            {walletState.balanceVisible && (
              <View style={styles.balanceTrend}>
                <Ionicons name="trending-up" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.trendText}>Available</Text>
              </View>
            )}
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountNumber}>
              Account: {walletState.account?.accountNumber || 'Loading...'}
            </Text>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: cardColor }]}
              onPress={() => handleQuickAction('topup')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
                <Ionicons name="add-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.actionText, { color: textColor }]}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: cardColor }]}
              onPress={() => handleQuickAction('send')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#2196F3' + '20' }]}>
                <Ionicons name="send" size={24} color="#2196F3" />
              </View>
              <Text style={[styles.actionText, { color: textColor }]}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: cardColor }]}
              onPress={() => handleQuickAction('pay')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FF9800' + '20' }]}>
                <Ionicons name="card" size={24} color="#FF9800" />
              </View>
              <Text style={[styles.actionText, { color: textColor }]}>Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: cardColor }]}
              onPress={() => handleQuickAction('withdraw')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#F44336' + '20' }]}>
                <Ionicons name="download" size={24} color="#F44336" />
              </View>
              <Text style={[styles.actionText, { color: textColor }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactions}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: tintColor }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <View
                key={transaction.id || `transaction-${index}`}
                style={[styles.transactionItem, { backgroundColor: cardColor }]}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={getTransactionTypeIcon(transaction.type) as any}
                    size={20}
                    color={tintColor}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionDescription, { color: textColor }]}>
                    {transaction.description}
                  </Text>
                  <Text style={[styles.transactionDate, { color: textColor, opacity: 0.6 }]}>
                    {formatDateTime(transaction.createdAt)}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { 
                    color: transaction.type === 'credit' || transaction.type === 'topup' 
                      ? '#4CAF50' 
                      : '#F44336' 
                  }
                ]}>
                  {transaction.type === 'credit' || transaction.type === 'topup' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
              <Ionicons name="receipt-outline" size={48} color={tintColor} opacity={0.5} />
              <Text style={[styles.emptyStateText, { color: textColor, opacity: 0.6 }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptyStateText, { color: textColor, opacity: 0.4 }]}>
                Try making a transaction to see it here
              </Text>
            </View>
          )}
        </View>

        {/* Account Status */}
        <View style={[styles.statusCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.statusTitle, { color: textColor }]}>Account Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: textColor, opacity: 0.7 }]}>
                Status
              </Text>
              <Text style={[styles.statusValue, { color: '#4CAF50' }]}>
                {walletState.account?.status || 'Loading...'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: textColor, opacity: 0.7 }]}>
                Daily Limit
              </Text>
              <Text style={[styles.statusValue, { color: textColor }]}>
                {formatCurrency(walletState.account?.dailyLimit || 0)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Quick Action Modal */}
      <QuickActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={selectedAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 14,
    marginTop: 2,
  },
  greetingCard: {
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
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  greetingSubtext: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  visibilityButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  balanceDisplay: {
    alignItems: 'center',
    marginVertical: 12,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  accountNumber: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactions: {
    padding: 20,
    paddingTop: 0,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  statusCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});