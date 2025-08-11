import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TransactionReceipt, receiptService } from '@/services/receiptService';
import { formatCurrency } from '@/utils/format';
import React from 'react';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ReceiptViewerProps {
  receipt: TransactionReceipt;
  onClose: () => void;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ receipt, onClose }) => {
  const colorScheme = useColorScheme();

  const handleShare = async () => {
    try {
      const summary = receiptService.generateReceiptSummary(receipt);
      await Share.share({
        message: summary,
        title: 'V-Send Receipt',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return Colors[colorScheme ?? 'light'].tabIconDefault;
    }
  };

  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case 'send':
        return 'Money Sent';
      case 'receive':
        return 'Money Received';
      case 'topup':
        return 'Wallet Top-up';
      case 'payment':
        return 'Payment Made';
      default:
        return type.toUpperCase();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={[styles.content, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            📧 Transaction Receipt
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.receiptCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={styles.receiptHeader}>
            <Text style={[styles.receiptNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
              Receipt: {receipt.receiptNumber}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) }]}>
              <Text style={styles.statusText}>{receipt.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Transaction Type
            </Text>
            <Text style={[styles.value, { color: Colors[colorScheme ?? 'light'].text }]}>
              {getTransactionTypeDisplay(receipt.transactionType)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Amount
            </Text>
            <Text style={[styles.value, styles.amount, { color: Colors[colorScheme ?? 'light'].text }]}>
              {formatCurrency(receipt.amount, receipt.currency)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Date & Time
            </Text>
            <Text style={[styles.value, { color: Colors[colorScheme ?? 'light'].text }]}>
              {formatDate(receipt.timestamp)}
            </Text>
          </View>

          {receipt.transactionType !== 'topup' && (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  From
                </Text>
                <Text style={[styles.value, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {receipt.senderName} ({receipt.senderPhone})
                </Text>
              </View>

              {receipt.recipientName && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    To
                  </Text>
                  <Text style={[styles.value, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {receipt.recipientName} ({receipt.recipientPhone})
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Description
            </Text>
            <Text style={[styles.value, { color: Colors[colorScheme ?? 'light'].text }]}>
              {receipt.description}
            </Text>
          </View>

          {receipt.fee && receipt.fee > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Fee
              </Text>
              <Text style={[styles.value, { color: Colors[colorScheme ?? 'light'].text }]}>
                {formatCurrency(receipt.fee, receipt.currency)}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Balance After
            </Text>
            <Text style={[styles.value, styles.amount, { color: Colors[colorScheme ?? 'light'].text }]}>
              {formatCurrency(receipt.balanceAfter, receipt.currency)}
            </Text>
          </View>

          {receipt.paymentReference && (
            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Reference
              </Text>
              <Text style={[styles.value, styles.reference, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                {receipt.paymentReference}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Powered by V-Send Wallet 💰
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.closeActionButton]}
          onPress={onClose}
        >
          <Text style={[styles.closeActionButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  receiptCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reference: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeActionButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  closeActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptViewer;
