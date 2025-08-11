import { useAuth } from '@/contexts/WalletContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (!state.isLoading) {
      if (state.isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor 
    }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
