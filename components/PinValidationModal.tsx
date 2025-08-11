import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { pinService } from '@/services/pinService';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface PinValidationModalProps {
  visible: boolean;
  userId: string;
  title?: string;
  message?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinValidationModal: React.FC<PinValidationModalProps> = ({
  visible,
  userId,
  title = 'Enter PIN',
  message = 'Please enter your PIN to continue',
  onSuccess,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleValidatePin = async () => {
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await pinService.validatePin({ userId, pin });
      
      if (isValid) {
        setPin('');
        onSuccess();
      } else {
        Alert.alert('Error', 'Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('PIN validation error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to validate PIN');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            {title}
          </Text>
          
          <Text style={[styles.message, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            {message}
          </Text>

          <View style={styles.pinContainer}>
            <TextInput
              style={[
                styles.pinInput,
                {
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text,
                },
              ]}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter PIN"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleValidatePin}
              disabled={isLoading || !pin}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Validating...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 350,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    width: 120,
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PinValidationModal;
