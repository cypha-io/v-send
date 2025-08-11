import { useAuth, useWallet } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import enhancedWalletService from '@/services/enhancedWallet';
import { formatCurrency, validateAmount } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaystackWebView } from './PaystackWebView';

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'topup' | 'send' | 'pay' | 'withdraw';
}

export function QuickActionModal({ visible, onClose, type }: QuickActionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [showBankList, setShowBankList] = useState(false);
  const [showPaystackWebView, setShowPaystackWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  
  const { state: authState } = useAuth();
  const { creditWallet, debitWallet, state, loadWalletData } = useWallet();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#f8f9fa', dark: '#1c1c1e' }, 'background');

  useEffect(() => {
    if (type === 'withdraw' && visible) {
      loadBanks();
    }
  }, [type, visible]);

  const loadBanks = async () => {
    try {
      const availableBanks = await enhancedWalletService.getAvailableBanks();
      setBanks(availableBanks);
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const getActionConfig = () => {
    switch (type) {
      case 'topup':
        return {
          title: 'Top Up Wallet',
          icon: 'add-circle',
          color: '#4CAF50',
          defaultDescription: 'Wallet top-up',
        };
      case 'send':
        return {
          title: 'Send Money',
          icon: 'send',
          color: '#2196F3',
          defaultDescription: 'Money transfer',
        };
      case 'pay':
        return {
          title: 'Make Payment',
          icon: 'card',
          color: '#FF9800',
          defaultDescription: 'Payment',
        };
      case 'withdraw':
        return {
          title: 'Withdraw',
          icon: 'download',
          color: '#F44336',
          defaultDescription: 'Withdrawal',
        };
      default:
        return {
          title: 'Transaction',
          icon: 'card',
          color: tintColor,
          defaultDescription: 'Transaction',
        };
    }
  };

  const config = getActionConfig();

  const validateInputs = (): boolean => {
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      Alert.alert('Invalid Amount', validation.error);
      return false;
    }

    if ((type === 'send' || type === 'pay') && !phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return false;
    }

    if ((type === 'send' || type === 'pay') && phoneNumber) {
      const phoneValidation = enhancedWalletService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        Alert.alert('Error', phoneValidation.error);
        return false;
      }
    }

    if (type === 'withdraw') {
      if (!bankCode || !accountNumber) {
        Alert.alert('Error', 'Please select a bank and enter account number');
        return false;
      }
    }

    return true;
  };

  const refreshWalletData = async () => {
    // Get the current user from auth state and refresh wallet data
    if (authState.user) {
      const userId = (authState.user as any).$id || authState.user.id;
      await loadWalletData(userId);
    }
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    const numAmount = parseFloat(amount);
    const finalDescription = description.trim() || config.defaultDescription;

    setIsLoading(true);

    try {
      if (!authState.user) {
        Alert.alert('Error', 'User session not found');
        return;
      }

      switch (type) {
        case 'topup':
          await handleTopUp(numAmount, finalDescription);
          break;
        case 'send':
          await handleSendMoney(numAmount, finalDescription);
          break;
        case 'pay':
          await handleMakePayment(numAmount, finalDescription);
          break;
        case 'withdraw':
          await handleWithdraw(numAmount, finalDescription);
          break;
      }
    } catch (error: any) {
      console.error(`${type} error:`, error);
      Alert.alert('Error', error.message || `Failed to ${config.title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (amount: number, description: string) => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }
    const userId = (authState.user as any).$id || authState.user.id;
    const { paymentUrl: url } = await enhancedWalletService.topUpWallet({
      userId,
      amount,
      description,
      paymentMethod: 'card',
      pin: '000000', // Temporary PIN for top-up, will be validated later when PIN is mandatory
    });

    // Show PaystackWebView instead of opening browser
    setPaymentUrl(url);
    setShowPaystackWebView(true);
  };

    const handleSendMoney = async (amount: number, description: string) => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }
    const userId = (authState.user as any).$id || authState.user.id;
    const formattedPhone = enhancedWalletService.formatPhoneNumber(phoneNumber);
    
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN to authorize this transaction');
      return;
    }
    
    await enhancedWalletService.sendMoney({
      fromUserId: userId,
      toPhoneNumber: formattedPhone,
      amount,
      description,
      pin: pin,
    });

    Alert.alert('Success', 'Money sent successfully!');
  };

    const handleMakePayment = async (amount: number, description: string) => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }
    const userId = (authState.user as any).$id || authState.user.id;
    const formattedPhone = enhancedWalletService.formatPhoneNumber(phoneNumber);
    
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN to authorize this payment');
      return;
    }
    
    await enhancedWalletService.makePayment({
      userId,
      merchantPhone: formattedPhone,
      amount,
      description,
      pin: pin,
    });

    Alert.alert('Success', 'Payment completed successfully!');
  };

  const handleWithdraw = async (amount: number, description: string) => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }
    const userId = (authState.user as any).$id || authState.user.id;
    await enhancedWalletService.withdrawFunds({
      userId,
      amount,
      bankCode,
      accountNumber,
      accountName,
      description,
      pin: pin || undefined,
    });

    Alert.alert('Success', 'Withdrawal initiated successfully!');
    await refreshWalletData();
    handleClose();
  };

  const selectBank = (bank: any) => {
    setBankCode(bank.code);
    setShowBankList(false);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setPhoneNumber('');
    setBankCode('');
    setAccountNumber('');
    setAccountName('');
    setPin('');
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setPhoneNumber('');
    setBankCode('');
    setAccountNumber('');
    setAccountName('');
    setPin('');
    setShowBankList(false);
    setShowPaystackWebView(false);
    setPaymentUrl('');
    onClose();
  };

  const handlePaymentComplete = async (reference: string, status: 'success' | 'failed') => {
    setShowPaystackWebView(false);
    
    if (status === 'success') {
      Alert.alert(
        'Payment Successful!',
        'Your wallet has been topped up successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (authState.user) {
                const userId = (authState.user as any).$id || authState.user.id;
                loadWalletData(userId); // Reload wallet data to show updated balance
              }
              handleClose();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Payment Failed',
        'Your payment could not be processed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderPhoneNumberInput = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: textColor }]}>
        {type === 'send' ? 'Recipient Phone Number' : 'Merchant Phone Number'}
      </Text>
      <TextInput
        style={[styles.textInput, { backgroundColor: cardColor, borderColor: tintColor, color: textColor }]}
        placeholder="08012345678"
        placeholderTextColor={textColor + '80'}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        editable={!isLoading}
      />
      <Text style={[styles.helperText, { color: textColor, opacity: 0.7 }]}>
        Only registered phone numbers can receive {type === 'send' ? 'transfers' : 'payments'}
      </Text>
    </View>
  );

  const renderBankSelection = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: textColor }]}>Bank</Text>
      <TouchableOpacity
        style={[styles.textInput, { backgroundColor: cardColor, borderColor: tintColor, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => setShowBankList(true)}
        disabled={isLoading}
      >
        <Text style={[styles.bankSelectText, { color: bankCode ? textColor : textColor + '80', flex: 1 }]}>
          {bankCode ? banks.find(b => b.code === bankCode)?.name || 'Select Bank' : 'Select Bank'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={textColor} />
      </TouchableOpacity>
    </View>
  );

  const renderBankList = () => (
    <Modal
      visible={showBankList}
      animationType="slide"
      onRequestClose={() => setShowBankList(false)}
    >
      <View style={[styles.bankListContainer, { backgroundColor }]}>
        <View style={[styles.bankListHeader, { borderBottomColor: cardColor }]}>
          <Text style={[styles.bankListTitle, { color: textColor }]}>Select Bank</Text>
          <TouchableOpacity onPress={() => setShowBankList(false)}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.bankList}>
          {banks.map((bank) => (
            <TouchableOpacity
              key={bank.code}
              style={[styles.bankItem, { borderBottomColor: cardColor }]}
              onPress={() => selectBank(bank)}
            >
              <Text style={[styles.bankName, { color: textColor }]}>{bank.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView 
          style={[styles.container, { backgroundColor }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: cardColor }]}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: textColor }]}>{config.title}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content with ScrollView */}
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon as any} size={32} color="white" />
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Amount</Text>
                <View style={[styles.inputContainer, { backgroundColor: cardColor, borderColor: tintColor }]}>
                  <Text style={[styles.currency, { color: textColor }]}>₦</Text>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="0.00"
                    placeholderTextColor={textColor + '80'}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {(type === 'send' || type === 'pay') && renderPhoneNumberInput()}

              {type === 'withdraw' && (
                <>
                  {renderBankSelection()}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: textColor }]}>Account Number</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: cardColor, borderColor: tintColor, color: textColor }]}
                      placeholder="0123456789"
                      placeholderTextColor={textColor + '80'}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: textColor }]}>Account Name (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: cardColor, borderColor: tintColor, color: textColor }]}
                      placeholder="Account holder name"
                      placeholderTextColor={textColor + '80'}
                      value={accountName}
                      onChangeText={setAccountName}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: cardColor, borderColor: tintColor, color: textColor }]}
                  placeholder={`Enter description for ${type}`}
                  placeholderTextColor={textColor + '80'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>

              {(type === 'send' || type === 'pay' || type === 'withdraw') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>PIN (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: cardColor, borderColor: tintColor, color: textColor }]}
                    placeholder="Enter your wallet PIN"
                    placeholderTextColor={textColor + '80'}
                    value={pin}
                    onChangeText={setPin}
                    secureTextEntry
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>
              )}

              {/* Balance Info */}
              {type !== 'topup' && (
                <View style={[styles.balanceInfo, { backgroundColor: cardColor }]}>
                  <Text style={[styles.balanceLabel, { color: textColor, opacity: 0.7 }]}>
                    Available Balance
                  </Text>
                  <Text style={[styles.balanceAmount, { color: textColor }]}>
                    {formatCurrency(state.account?.balance || 0)}
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: config.color },
                  (isLoading || !amount.trim() || 
                   ((type === 'send' || type === 'pay') && !phoneNumber.trim()) ||
                   (type === 'withdraw' && (!bankCode || !accountNumber.trim()))
                  ) && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !amount.trim() || 
                         ((type === 'send' || type === 'pay') && !phoneNumber.trim()) ||
                         (type === 'withdraw' && (!bankCode || !accountNumber.trim()))}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {type === 'topup' ? 'Continue to Payment' : config.title}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      {renderBankList()}
      
      {/* Paystack WebView Modal */}
      <PaystackWebView
        visible={showPaystackWebView}
        paymentUrl={paymentUrl}
        onPaymentComplete={handlePaymentComplete}
        onClose={() => setShowPaystackWebView(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    alignSelf: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  currency: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  bankSelectText: {
    fontSize: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bankListContainer: {
    flex: 1,
    paddingTop: 50,
  },
  bankListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  bankListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bankList: {
    flex: 1,
  },
  bankItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  bankName: {
    fontSize: 16,
  },
});
