import { useAuth } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { cleanPhoneNumber, formatPhoneNumber, validatePhoneNumber } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const handleSubmit = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanedPhoneNumber = cleanPhoneNumber(phoneNumber);
      await login(cleanedPhoneNumber);
      
      Alert.alert(
        'Welcome!',
        'You have been logged in successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'An error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumberInput = (text: string) => {
    const cleaned = cleanPhoneNumber(text);
    const formatted = formatPhoneNumber(cleaned);
    setPhoneNumber(formatted);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: tintColor }]}>
                <Ionicons name="wallet" size={40} color="white" />
              </View>
              <Text style={[styles.title, { color: textColor }]}>VSend</Text>
              <Text style={[styles.subtitle, { color: textColor }]}>
                Your Digital Wallet
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={[styles.formTitle, { color: textColor }]}>
                Welcome to V-Send
              </Text>
              <Text style={[styles.formSubtitle, { color: textColor, opacity: 0.7 }]}>
                Enter your phone number to continue
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textColor }]}>
                  Phone Number
                </Text>
                <View style={[styles.inputWrapper, { borderColor: tintColor }]}>
                  <Ionicons 
                    name="call" 
                    size={20} 
                    color={tintColor} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor={textColor + '80'}
                    value={phoneNumber}
                    onChangeText={formatPhoneNumberInput}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: tintColor },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !phoneNumber.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.feature}>
                <Ionicons name="shield-checkmark" size={24} color={tintColor} />
                <Text style={[styles.featureText, { color: textColor }]}>
                  Secure & Encrypted
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="flash" size={24} color={tintColor} />
                <Text style={[styles.featureText, { color: textColor }]}>
                  Instant Transfers
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="card" size={24} color={tintColor} />
                <Text style={[styles.featureText, { color: textColor }]}>
                  Digital Payments
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  form: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
