import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { pinService } from '@/services/pinService';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface PinSetupModalProps {
  visible: boolean;
  userId: string;
  onPinSetup: () => void;
  onCancel?: () => void;
  isRequired?: boolean;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  visible,
  userId,
  onPinSetup,
  onCancel,
  isRequired = true,
}) => {
  const colorScheme = useColorScheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupPin = async () => {
    if (!pin || !confirmPin) {
      Alert.alert('Error', 'Please enter both PIN and confirmation');
      return;
    }

    if (pin.length < 4 || pin.length > 6) {
      Alert.alert('Error', 'PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PIN confirmation does not match');
      return;
    }

    setIsLoading(true);
    try {
      await pinService.setupPin({
        userId,
        pin,
        confirmPin,
      });

      Alert.alert(
        'Success',
        'Your PIN has been set up successfully!',
        [{ text: 'OK', onPress: onPinSetup }]
      );
      
      setPin('');
      setConfirmPin('');
    } catch (error) {
      console.error('PIN setup error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to set up PIN');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Set Up Your PIN
        </Text>
        
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          Create a 4-6 digit PIN to secure your transactions
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Enter PIN
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                color: Colors[colorScheme ?? 'light'].text,
              },
            ]}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter 4-6 digit PIN"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Confirm PIN
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                color: Colors[colorScheme ?? 'light'].text,
              },
            ]}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm your PIN"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSetupPin}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Setting Up...' : 'Set PIN'}
            </Text>
          </TouchableOpacity>

          {!isRequired && onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={[styles.secondaryButtonText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PinSetupModal;
