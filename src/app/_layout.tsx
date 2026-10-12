import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors, fontAssets } from '@/theme';

// Ruta inicial del Stack raíz: el catálogo público (grupo de tabs).
// Sin esto, el Stack tomaría como ancla la primera ruta alfabética.
export const unstable_settings = { anchor: '(tabs)' };

// Mantener el splash visible hasta que fuentes + sesión estén listos.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator fontsReady={Boolean(fontsLoaded || fontError)} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isRestoring } = useAuth();
  const ready = fontsReady && !isRestoring;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  // Mientras no esté listo, no renderizamos nada: el splash sigue en pantalla.
  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.body },
      }}
    />
  );
}
