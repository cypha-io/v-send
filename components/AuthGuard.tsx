import AuthScreen from '@/components/AuthScreen';
import { useAuth } from '@/contexts/WalletContext';
import { router } from 'expo-router';
import React, { ReactNode, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useAuth();

  // Always check profile completion status consistently
  const isProfileComplete = React.useMemo(() => {
    // Profile is complete if user has both first name and last name
    const hasFirstName = !!(state.user?.firstName && state.user.firstName.trim());
    const hasLastName = !!(state.user?.lastName && state.user.lastName.trim());
    console.log('Profile completion check:', { 
      hasFirstName, 
      hasLastName, 
      firstName: state.user?.firstName,
      lastName: state.user?.lastName 
    });
    return hasFirstName && hasLastName;
  }, [state.user?.firstName, state.user?.lastName]);
  
  // Handle routing based on authentication and profile status
  useEffect(() => {
    // Only navigate if we have a clear authentication state (not loading)
    if (!state.isLoading) {
      if (state.isAuthenticated && state.user && !isProfileComplete) {
        router.replace('/user-setup');
      }
    }
  }, [state.isAuthenticated, state.isLoading, state.user, isProfileComplete]);

  // Show loading while checking authentication
  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show auth screen if not authenticated
  if (!state.isAuthenticated || !state.user) {
    return <AuthScreen />;
  }

  // Show the main app if authenticated and profile is complete
  return <>{children}</>;
}
