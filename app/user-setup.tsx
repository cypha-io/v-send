import { useAuth } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { pinService } from '@/services/pinService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

export default function UserDetailsSetup() {
  const { state: authState, updateUser } = useAuth();
  
  // Initialize with existing user data, but handle empty/phone-number-based names
  const initialFirstName = authState.user?.firstName || '';
  const initialLastName = authState.user?.lastName || '';
  
  // Check if the current names are just phone numbers or empty
  const isPhoneNumber = (str: string) => /^\d+$/.test(str?.trim() || '');
  const needsRealName = !initialFirstName || !initialLastName || 
                       isPhoneNumber(initialFirstName) || isPhoneNumber(initialLastName);

  const [firstName, setFirstName] = useState(needsRealName ? '' : initialFirstName);
  const [lastName, setLastName] = useState(needsRealName ? '' : initialLastName);
  const [email, setEmail] = useState(authState.user?.email || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: profile info, 2: PIN setup
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');

  const handleSaveProfile = async () => {
    if (step === 1) {
      // Validate profile information
      if (!firstName.trim()) {
        Alert.alert('Error', 'Please enter your first name');
        return;
      }

      if (!lastName.trim()) {
        Alert.alert('Error', 'Please enter your last name');
        return;
      }

      // Move to PIN setup
      setStep(2);
      return;
    }

    // Step 2: PIN setup
    if (!pin.trim()) {
      Alert.alert('Error', 'Please enter a 6-digit PIN');
      return;
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      Alert.alert('Error', 'PIN must be exactly 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Update profile first
      await updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });

      // Set up PIN
      const userId = (authState.user as any)?.$id || authState.user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      await pinService.setupPin({
        userId,
        pin,
        confirmPin,
      });

      Alert.alert(
        'Setup Complete!',
        'Your profile and PIN have been set up successfully. You can now use all wallet features.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error during setup:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can update your profile later in settings. We will use basic information for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            // Update with minimal info to mark profile as "complete enough"
            try {
              setIsLoading(true);
              await updateUser({
                firstName: firstName || 'User',
                lastName: lastName || authState.user?.phoneNumber || '',
              });
              router.replace('/(tabs)');
            } catch (error) {
              console.error('Error during skip:', error);
              // Force navigation even if update fails
              router.replace('/(tabs)');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name={step === 1 ? "person-add" : "lock-closed"} size={32} color={tintColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>
              {step === 1 ? 'Complete Your Profile' : 'Set Up Your PIN'}
            </Text>
            <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
              {step === 1 
                ? "Let's personalize your wallet experience"
                : "Create a 6-digit PIN to secure your transactions"
              }
            </Text>
            
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, { backgroundColor: tintColor }]} />
              <View style={[styles.stepLine, { backgroundColor: step === 2 ? tintColor : textColor + '30' }]} />
              <View style={[styles.stepDot, { backgroundColor: step === 2 ? tintColor : textColor + '30' }]} />
            </View>
          </View>

          {/* User Info Display */}
          <View style={[styles.userInfoCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Account Information
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color={tintColor} />
              <Text style={[styles.infoText, { color: textColor }]}>
                {authState.user?.phoneNumber || 'No phone number'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="finger-print" size={16} color={tintColor} />
              <Text style={[styles.infoText, { color: textColor, fontFamily: 'monospace' }]}>
                User ID: ...{((authState.user as any)?.$id || '').slice(-8) || 'Loading...'}
              </Text>
            </View>
          </View>

          {/* Profile Form */}
          {step === 1 ? (
            <View style={[styles.formCard, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Personal Details
              </Text>

              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  First Name *
                </Text>
                <View style={[styles.inputContainer, { borderColor: textColor + '20' }]}>
                  <Ionicons name="person" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter your first name"
                    placeholderTextColor={textColor + '60'}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Last Name *
                </Text>
                <View style={[styles.inputContainer, { borderColor: textColor + '20' }]}>
                  <Ionicons name="person" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter your last name"
                    placeholderTextColor={textColor + '60'}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Email Address (Optional)
                </Text>
                <View style={[styles.inputContainer, { borderColor: textColor + '20' }]}>
                  <Ionicons name="mail" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter your email address"
                    placeholderTextColor={textColor + '60'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.formCard, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Security Setup
              </Text>
              
              <Text style={[styles.description, { color: textColor, opacity: 0.7, marginBottom: 20 }]}>
                Your PIN will be required for all transactions and sensitive operations. 
                Choose a 6-digit PIN that you can remember easily.
              </Text>

              {/* PIN Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Create PIN *
                </Text>
                <View style={[styles.inputContainer, { borderColor: textColor + '20' }]}>
                  <Ionicons name="lock-closed" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter 6-digit PIN"
                    placeholderTextColor={textColor + '60'}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Confirm PIN Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Confirm PIN *
                </Text>
                <View style={[styles.inputContainer, { borderColor: textColor + '20' }]}>
                  <Ionicons name="lock-closed" size={20} color={tintColor} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Confirm your PIN"
                    placeholderTextColor={textColor + '60'}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {step === 1 ? (
              <>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: tintColor }]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>Processing...</Text>
                  ) : (
                    <>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                      <Text style={styles.buttonText}>Continue to PIN Setup</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.skipButton, { backgroundColor: cardColor, borderColor: textColor + '20' }]}
                  onPress={handleSkip}
                  disabled={isLoading}
                >
                  <Text style={[styles.skipButtonText, { color: textColor }]}>
                    Skip for now
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: tintColor }]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>Setting up...</Text>
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.buttonText}>Complete Setup</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.skipButton, { backgroundColor: cardColor, borderColor: textColor + '20' }]}
                  onPress={() => setStep(1)}
                  disabled={isLoading}
                >
                  <Text style={[styles.skipButtonText, { color: textColor }]}>
                    Back to Profile
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  userInfoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    height: 2,
    width: 30,
    marginHorizontal: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
