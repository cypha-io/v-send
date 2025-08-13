import { useAuth } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
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

export default function ProfileScreen() {
  const { state: authState, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState(authState.user?.firstName || '');
  const [lastName, setLastName] = useState(authState.user?.lastName || '');
  const [email, setEmail] = useState(authState.user?.email || '');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({ light: '#f8f9fa', dark: '#1c1c1e' }, 'background');

  const getUserInitials = () => {
    const first = firstName || authState.user?.firstName || '';
    const last = lastName || authState.user?.lastName || '';
    return (first[0] || '') + (last[0] || '') || 'U';
  };

  const getUserDisplayName = () => {
    const first = firstName || authState.user?.firstName || '';
    const last = lastName || authState.user?.lastName || '';
    if (first && last && first !== authState.user?.phoneNumber) {
      return `${first} ${last}`;
    }
    return first || 'User';
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(authState.user?.firstName || '');
    setLastName(authState.user?.lastName || '');
    setEmail(authState.user?.email || '');
    setIsEditing(false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Profile</Text>
            {!isEditing && (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={[styles.editButton, { backgroundColor: tintColor + '20' }]}
              >
                <Ionicons name="pencil" size={20} color={tintColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: tintColor }]}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            <Text style={[styles.displayName, { color: textColor }]}>
              {getUserDisplayName()}
            </Text>
            <Text style={[styles.phoneNumber, { color: textColor, opacity: 0.7 }]}>
              {authState.user?.phoneNumber}
            </Text>
          </View>

          {/* Profile Form */}
          <View style={[styles.formSection, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Personal Information
            </Text>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor, opacity: 0.7 }]}>
                First Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    color: textColor,
                    backgroundColor: isEditing ? backgroundColor : 'transparent',
                    borderColor: isEditing ? tintColor : 'transparent',
                  }
                ]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor={textColor + '60'}
                editable={isEditing}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor, opacity: 0.7 }]}>
                Last Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    color: textColor,
                    backgroundColor: isEditing ? backgroundColor : 'transparent',
                    borderColor: isEditing ? tintColor : 'transparent',
                  }
                ]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor={textColor + '60'}
                editable={isEditing}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor, opacity: 0.7 }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    color: textColor,
                    backgroundColor: isEditing ? backgroundColor : 'transparent',
                    borderColor: isEditing ? tintColor : 'transparent',
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={textColor + '60'}
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Number (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor, opacity: 0.7 }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    color: textColor,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    opacity: 0.6,
                  }
                ]}
                value={authState.user?.phoneNumber || ''}
                editable={false}
              />
              <Text style={[styles.helpText, { color: textColor, opacity: 0.5 }]}>
                Phone number cannot be changed
              </Text>
            </View>
          </View>

          {/* Account Status */}
          <View style={[styles.statusSection, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Account Status
            </Text>
            <View style={styles.statusItem}>
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={[styles.statusText, { color: textColor }]}>
                  Account Verified
                </Text>
              </View>
              <Text style={[styles.statusValue, { color: '#4CAF50' }]}>
                Active
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={styles.statusRow}>
                <Ionicons name="shield-checkmark" size={20} color={tintColor} />
                <Text style={[styles.statusText, { color: textColor }]}>
                  Security Level
                </Text>
              </View>
              <Text style={[styles.statusValue, { color: tintColor }]}>
                Basic
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: tintColor }]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={20} color="#F44336" />
                <Text style={[styles.logoutButtonText, { color: '#F44336' }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacer} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusSection: {
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
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
