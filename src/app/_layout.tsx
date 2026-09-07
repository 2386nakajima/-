import { useEffect } from 'react';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { hydrate } from '@/lib/storage';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  // localStorageの読み込みはマウント後に行う（初回描画の不一致を避ける）
  useEffect(() => {
    hydrate();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: '問題作成 | QuizBank' }} />
        <Stack.Screen name="bank" options={{ title: '問題集 | QuizBank' }} />
        <Stack.Screen name="study" options={{ title: '演習 | QuizBank' }} />
        <Stack.Screen name="settings" options={{ title: '設定 | QuizBank' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
