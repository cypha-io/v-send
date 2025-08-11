import { WalletIdentifier } from '@/components/WalletIdentifier';
import { useWallet } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatCurrency, formatDateTime, getTransactionStatusColor, getTransactionTypeIcon } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const { state: walletState, refreshTransactions } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'credit' | 'debit' | 'transfer'>('all');
  const [viewType, setViewType] = useState<'list' | 'card'>('card');

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');
  const surfaceColor = useThemeColor({ light: '#f8f9fa', dark: '#2c2c2e' }, 'background');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter transactions based on search and filter
  const filteredTransactions = walletState.transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || transaction.type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: 'all', label: 'All', icon: 'list', count: walletState.transactions.length },
    { key: 'credit', label: 'Credit', icon: 'add-circle', count: walletState.transactions.filter(t => t.type === 'credit').length },
    { key: 'debit', label: 'Debit', icon: 'remove-circle', count: walletState.transactions.filter(t => t.type === 'debit').length },
    { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal', count: walletState.transactions.filter(t => t.type === 'transfer').length },
  ] as const;

  // Calculate stats
  const totalCredit = walletState.transactions
    .filter(t => t.type === 'credit' || t.type === 'topup')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebit = walletState.transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const renderTransactionCard = ({ item: transaction, index }: { item: any, index: number }) => (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: cardColor }]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.transactionIcon, 
          { backgroundColor: getTransactionStatusColor(transaction.type) + '20' }
        ]}>
          <Ionicons
            name={getTransactionTypeIcon(transaction.type) as any}
            size={24}
            color={getTransactionStatusColor(transaction.type)}
          />
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.transactionTitle, { color: textColor }]}>
            {transaction.description}
          </Text>
          <Text style={[styles.transactionDate, { color: textColor, opacity: 0.6 }]}>
            {formatDateTime(transaction.createdAt)}
          </Text>
        </View>
        
        <View style={styles.amountContainer}>
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
          <View style={[
            styles.statusBadge,
            { backgroundColor: getTransactionStatusColor(transaction.status) + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getTransactionStatusColor(transaction.status) }
            ]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.cardFooter, { borderTopColor: surfaceColor }]}>
        <Text style={[styles.referenceText, { color: textColor, opacity: 0.5 }]}>
          Ref: {transaction.reference}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Wallet Identifier - Shows whose transactions these are */}
      <WalletIdentifier />
      
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: textColor }]}>Your Transactions</Text>
        <View style={styles.titleActions}>
          <TouchableOpacity 
            style={[styles.viewToggle, { backgroundColor: tintColor + '20' }]}
            onPress={() => setViewType(viewType === 'card' ? 'list' : 'card')}
          >
            <Ionicons 
              name={viewType === 'card' ? 'list' : 'grid'} 
              size={18} 
              color={tintColor} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: tintColor + '20' }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={18} color={tintColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '20' }]}>
            <Ionicons name="arrow-down" size={16} color="#4CAF50" />
          </View>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {formatCurrency(totalCredit)}
          </Text>
          <Text style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
            Total Credit
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <View style={[styles.statIcon, { backgroundColor: '#F44336' + '20' }]}>
            <Ionicons name="arrow-up" size={16} color="#F44336" />
          </View>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {formatCurrency(totalDebit)}
          </Text>
          <Text style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
            Total Debit
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <View style={[styles.statIcon, { backgroundColor: tintColor + '20' }]}>
            <Ionicons name="receipt" size={16} color={tintColor} />
          </View>
          <Text style={[styles.statValue, { color: textColor }]}>
            {filteredTransactions.length}
          </Text>
          <Text style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}>
            Transactions
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: cardColor }]}>
        <Ionicons name="search" size={20} color={tintColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search transactions..."
          placeholderTextColor={textColor + '80'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={textColor + '80'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              { backgroundColor: selectedFilter === filter.key ? tintColor : cardColor },
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={16} 
              color={selectedFilter === filter.key ? 'white' : tintColor} 
            />
            <Text style={[
              styles.filterText,
              { color: selectedFilter === filter.key ? 'white' : textColor }
            ]}>
              {filter.label}
            </Text>
            <View style={[
              styles.filterBadge,
              { backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.2)' : tintColor + '20' }
            ]}>
              <Text style={[
                styles.filterBadgeText,
                { color: selectedFilter === filter.key ? 'white' : tintColor }
              ]}>
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
      <View style={[styles.emptyIcon, { backgroundColor: tintColor + '10' }]}>
        <Ionicons name="receipt-outline" size={48} color={tintColor} opacity={0.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No transactions found
      </Text>
      <Text style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
        {searchQuery || selectedFilter !== 'all' 
          ? 'Try adjusting your search or filter'
          : 'Your transactions will appear here'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surfaceColor }]}>
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionCard}
        keyExtractor={(item, index) => item.id || `transaction-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  titleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  referenceText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    borderRadius: 16,
    marginTop: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
