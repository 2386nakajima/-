import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

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
import { PROVIDERS, Provider, providerInfo } from '@/lib/types';

export default function SettingsScreen() {
  const { settings } = useDB();
  const provider = settings.provider;
  const info = providerInfo(provider);
  const [key, setKey] = useState(settings.keys[provider] ?? '');
  const [model, setModel] = useState(settings.models[provider] ?? '');
  const [count, setCount] = useState(String(settings.questionCount));
  const [message, setMessage] = useState('');

  const switchProvider = (next: Provider) => {
    saveSettings({ provider: next });
    setKey(settings.keys[next] ?? '');
    setModel(settings.models[next] ?? providerInfo(next).defaultModel);
    setMessage('');
  };

  const save = () => {
    const n = Number(count);
    saveSettings({
      keys: { ...settings.keys, [provider]: key.trim() },
      models: {
        ...settings.models,
        [provider]: model.trim() || info.defaultModel,
      },
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
        <Text style={styles.label}>生成に使うAI</Text>
        <Row wrap>
          {PROVIDERS.map((p) => (
            <Chip
              key={p.id}
              label={p.free ? `${p.label}` : p.label}
              active={provider === p.id}
              onPress={() => switchProvider(p.id)}
            />
          ))}
        </Row>
        <View style={{ height: space.sm }} />
        <Muted>{info.note}</Muted>
        <View style={{ height: space.md }} />
        <Button
          title="APIキーの取得ページを開く"
          variant="ghost"
          small
          onPress={() => Linking.openURL(info.keyUrl)}
        />
        <View style={{ height: space.lg }} />
        <Field
          label={`${info.label} のAPIキー`}
          value={key}
          onChangeText={setKey}
          placeholder="発行したAPIキーを貼り付け"
          secure
        />
        <Field
          label="モデルID（変更可）"
          value={model}
          onChangeText={setModel}
          placeholder={info.defaultModel}
        />
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
        <View style={{ height: space.md }} />
        <Muted>
          キーはブラウザのlocalStorageに保存し、AIサービスへ直接送信します（サーバーを経由しません）。共有PCでは使わないでください。
        </Muted>
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
