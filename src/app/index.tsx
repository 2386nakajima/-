import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container} accessibilityLabel="ホーム画面">
      <Text style={styles.title}>WakeUpQR</Text>
      <Text style={styles.subtitle}>
        QRコードを読み取るまで止められない目覚まし
      </Text>
      <Text style={styles.note}>Step 1: プロジェクト起動確認用の画面です</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  note: {
    color: '#666666',
    fontSize: 13,
    marginTop: 32,
    textAlign: 'center',
  },
});
