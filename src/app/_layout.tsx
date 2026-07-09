import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavBar } from '@/components/NavBar';
import { hydrate } from '@/lib/store';
import { colors } from '@/theme';

export default function RootLayout() {
  // クライアントで一度だけ localStorage から復元する
  useEffect(() => {
    hydrate();
  }, []);

  return (
    <View style={styles.root}>
      <NavBar />
      <View style={styles.body}>
        <Slot />
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
});
