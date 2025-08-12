import { useAuth } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { paymentVerificationService } from '@/services/paymentVerificationService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PaystackWebViewProps {
  visible: boolean;
  paymentUrl: string;
  onPaymentComplete: (reference: string, status: 'success' | 'failed') => void;
  onClose: () => void;
}

export function PaystackWebView({ visible, paymentUrl, onPaymentComplete, onClose }: PaystackWebViewProps) {
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const { state: authState } = useAuth();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  console.log('🔍 PaystackWebView render:', { visible, paymentUrl: paymentUrl ? 'SET' : 'NOT_SET' });

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    setCurrentUrl(url);
    
    // Check if the URL contains success or failure indicators
    if (url.includes('success') || url.includes('completed')) {
      setVerifying(true);
      
      // Extract reference from URL if possible
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const reference = urlParams.get('reference') || urlParams.get('trxref') || '';
      
      if (reference && authState.user) {
        try {
          const verificationResult = await paymentVerificationService.verifyPayment(reference);
          
          if (verificationResult.success) {
            onPaymentComplete(reference, 'success');
          } else {
            onPaymentComplete(reference, 'failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          onPaymentComplete(reference, 'failed');
        }
      } else {
        onPaymentComplete('', 'failed');
      }
      setVerifying(false);
    } else if (url.includes('cancel') || url.includes('failed')) {
      // Handle cancellation or failure
      setTimeout(() => {
        onPaymentComplete('', 'failed');
      }, 1000);
    }
  };

  const handleError = () => {
    setLoading(false);
    Alert.alert(
      'Payment Error',
      'There was an error loading the payment page. Please try again.',
      [
        { text: 'Close', onPress: onClose },
        { text: 'Retry', onPress: () => setLoading(true) }
      ]
    );
  };

  console.log('📱 PaystackWebView Modal about to render with visible:', visible);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: textColor + '20' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Secure Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>Loading secure payment...</Text>
          </View>
        )}

        {/* Verification overlay */}
        {verifying && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>Verifying payment...</Text>
          </View>
        )}

        {/* Test view to verify modal is showing */}
        <View style={styles.webView}>
          <Text style={[styles.loadingText, { color: textColor }]}>
            TEST: PaystackWebView is visible! {paymentUrl ? '✅ URL SET' : '❌ NO URL'}
          </Text>
          {paymentUrl && (
            <Text style={[styles.debugText, { color: textColor }]} numberOfLines={2}>
              URL: {paymentUrl}
            </Text>
          )}
        </View>

        {/* Current URL indicator (for debugging) */}
        {__DEV__ && currentUrl && (
          <View style={[styles.debugContainer, { backgroundColor: textColor + '10' }]}>
            <Text style={[styles.debugText, { color: textColor }]} numberOfLines={1}>
              Current URL: {currentUrl}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  debugContainer: {
    padding: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 10,
  },
});
