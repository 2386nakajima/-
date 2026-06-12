import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'WakeUpQR' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
