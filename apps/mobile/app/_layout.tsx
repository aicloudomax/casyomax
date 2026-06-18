import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'Error: Unable to activate keep awake',
]);

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as AppThemeProvider } from '@/theme/ThemeProvider';
import { buildNavTheme } from '@/theme/navigationTheme';
import { MenuProvider } from 'react-native-popup-menu';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/toastConfig';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <MenuProvider>
        <AppThemeProvider>
          <NavThemeProvider value={buildNavTheme(colorScheme)}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="caretaker" options={{ headerShown: false }} />
              <Stack.Screen name="patient" options={{ headerShown: false }} />
              <Stack.Screen name="auth/register" options={{ headerShown: false }} />
              <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
            <Toast config={toastConfig} />
          </NavThemeProvider>
        </AppThemeProvider>
      </MenuProvider>
    </SafeAreaProvider>
  );
}
