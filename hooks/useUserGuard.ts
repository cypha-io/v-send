import { useAuth } from '@/contexts/WalletContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook to ensure user isolation and proper authentication state
 */
export function useUserGuard() {
  const { state: authState } = useAuth();
  const router = useRouter();

  const getCurrentUserId = (): string | null => {
    if (!authState.user) return null;
    return (authState.user as any).$id || authState.user.id;
  };

  const isProfileComplete = (): boolean => {
    if (!authState.user) return false;
    const user = authState.user;
    return !!(user.firstName && user.lastName);
  };

  const needsProfileSetup = (): boolean => {
    return authState.isAuthenticated && !isProfileComplete();
  };

  useEffect(() => {
    const isProfileComplete = authState.user?.firstName && authState.user?.lastName;
    const needsSetup = authState.isAuthenticated && !isProfileComplete;

    // If user is not authenticated, redirect to auth screen
    if (!authState.isAuthenticated && !authState.isLoading) {
      router.replace('/auth');
    }
    // If user is authenticated but profile is incomplete, redirect to setup
    else if (authState.isAuthenticated && !authState.isLoading && needsSetup) {
      router.replace('/user-setup');
    }
  }, [authState.isAuthenticated, authState.isLoading, authState.user?.firstName, authState.user?.lastName, router]);

  const getUserDisplayName = (): string => {
    if (!authState.user) return 'User';
    const firstName = authState.user.firstName || '';
    const lastName = authState.user.lastName || '';
    return firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';
  };

  const getUserPhone = (): string => {
    return authState.user?.phoneNumber || '';
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    user: authState.user,
    userId: getCurrentUserId(),
    displayName: getUserDisplayName(),
    phoneNumber: getUserPhone(),
    isProfileComplete: isProfileComplete(),
    needsProfileSetup: needsProfileSetup(),
  };
}
