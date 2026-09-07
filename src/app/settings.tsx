import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Field,
  Muted,
  Row,
  Screen,
  confirmAction,
  styles,
} from '@/components/ui';
import { clearAllData, saveSettings, useDB } from '@/lib/storage';
import { colors, space } from '@/lib/theme';
import { MODELS, ModelId } from '@/lib/types';

export default function SettingsScreen() {
  const { settings } = useDB();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [count, setCount] = useState(String(settings.questionCount));
  const [message, setMessage] = useState('');

  const save = () => {
    const n = Number(count);
    saveSettings({
      apiKey: apiKey.trim(),
      questionCount: Number.isFinite(n) ? Math.min(50, Math.max(10, n)) : 12,
    });
    setMessage('保存しました。');
  };

  return (
    <Screen
      title="設定"
      subtitle="設定とデータはこの端末のブラウザ内にのみ保存されます。"
    >
      <Card>
        <Field
          label="Anthropic APIキー"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-..."
          secure
        />
        <Muted>
          個人利用前提のため、キーはブラウザのlocalStorageに保存し、直接Claude
          APIを呼び出します。共有PCでは使わないでください。
        </Muted>
        <View style={{ height: space.lg }} />
        <Text style={styles.label}>生成に使うモデル</Text>
        <Row wrap>
          {MODELS.map((m) => (
            <Chip
              key={m.id}
              label={m.label}
              active={settings.model === m.id}
              onPress={() => saveSettings({ model: m.id as ModelId })}
            />
          ))}
        </Row>
        <View style={{ height: space.lg }} />
        <Field
          label="1回の生成で作る問題数（10〜50）"
          value={count}
          onChangeText={setCount}
          keyboardType="numeric"
        />
        <Button title="保存" onPress={save} />
        {message ? (
          <Text
            style={[
              styles.muted,
              { marginTop: space.md, color: colors.success },
            ]}
          >
            {message}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.label}>データ管理</Text>
        <Muted>
          問題と文字起こしをすべて削除します。事前に問題集タブからJSONを書き出しておくと復元できます。
        </Muted>
        <View style={{ height: space.md }} />
        <Button
          title="すべてのデータを削除"
          variant="danger"
          onPress={() => {
            if (
              !confirmAction(
                'すべての問題と文字起こしを削除します。よろしいですか？',
              )
            )
              return;
            clearAllData();
            setMessage('削除しました。');
          }}
        />
      </Card>
    </Screen>
  );
}
