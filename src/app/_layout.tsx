import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackupProvider } from '../data/backup';
import { DB_NAME, initDb } from '../data/db';
import { StoreProvider } from '../data/store';
import { C, F } from '../ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.pageBot, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.ink} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold, Fredoka_700Bold, Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold, PatrickHand_400Regular,
  });
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) return <Loading />;

  const modal = {
    presentation: 'modal' as const,
    headerStyle: { backgroundColor: C.night },
    headerTintColor: C.panel,
    headerTitleStyle: { fontFamily: F.displayBold },
    contentStyle: { backgroundColor: C.pageBot },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DB_NAME} onInit={initDb} useSuspense>
          <StoreProvider>
           <BackupProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.pageBot } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="record" options={{ ...modal, headerShown: true, title: 'Thought record' }} />
              <Stack.Screen name="journal" options={{ ...modal, headerShown: true, title: 'Journal' }} />
              <Stack.Screen name="entry/[id]" options={{ ...modal, headerShown: true, title: 'Entry' }} />
              <Stack.Screen name="step" options={{ ...modal, headerShown: true, title: 'Ladder step' }} />
              <Stack.Screen name="try" options={{ ...modal, headerShown: true, title: 'Log a try' }} />
              <Stack.Screen name="checkin" options={{ ...modal, headerShown: true, title: 'Weekly check-in' }} />
              <Stack.Screen name="test" options={{ ...modal, headerShown: true, title: 'Self-check' }} />
              <Stack.Screen name="import" options={{ ...modal, headerShown: true, title: 'Import from tracker' }} />
              <Stack.Screen name="backup" options={{ ...modal, headerShown: true, title: 'Cloud backup' }} />
              <Stack.Screen name="about" options={{ ...modal, headerShown: true, title: 'About and privacy' }} />
              <Stack.Screen name="guide" options={{ ...modal, headerShown: true, title: 'How to use' }} />
              <Stack.Screen name="sayings" options={{ ...modal, headerShown: true, title: 'Your sayings' }} />
              <Stack.Screen name="quick-help" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            </Stack>
           </BackupProvider>
          </StoreProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
