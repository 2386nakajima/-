import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  Button,
  Card,
  Field,
  Muted,
  Row,
  Screen,
  styles,
} from '@/components/ui';
import { AIError, generateWithAI, hasKey } from '@/lib/ai';
import { generateOffline } from '@/lib/generator';
import { addQuestions, addSource, useDB } from '@/lib/storage';
import { colors, space } from '@/lib/theme';
import { Draft, providerInfo } from '@/lib/types';

type Candidate = Draft & { selected: boolean };

export default function CreateScreen() {
  const { settings } = useDB();
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const target = settings.questionCount;
  const provider = providerInfo(settings.provider);
  const keyReady = hasKey(settings);
  const selectedCount = candidates.filter((c) => c.selected).length;

  const run = async (mode: 'ai' | 'offline') => {
    setError('');
    setStatus('');
    if (transcript.trim().length < 50) {
      setError('文字起こしが短すぎます（50文字以上を貼り付けてください）。');
      return;
    }
    setBusy(true);
    try {
      let drafts: Draft[];
      if (mode === 'ai') {
        setStatus('AIで生成中…');
        drafts = await generateWithAI(
          settings,
          transcript,
          target,
          (done, total) => {
            if (total > 1) setStatus(`AIで生成中… (${done}/${total})`);
          },
        );
      } else {
        drafts = generateOffline(transcript, target);
      }
      setCandidates(drafts.map((d) => ({ ...d, selected: true })));
      setStatus(
        drafts.length >= 10
          ? `${drafts.length}問できました。内容を確認して保存してください。`
          : `${drafts.length}問しか作れませんでした。文字起こしを増やすか、AI生成をお試しください。`,
      );
    } catch (e) {
      setError(
        e instanceof AIError ? e.message : `生成に失敗しました: ${String(e)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const picked = candidates.filter((c) => c.selected);
    if (picked.length === 0) return;
    const source = addSource(title, transcript);
    addQuestions(picked, source.id);
    setCandidates([]);
    setTranscript('');
    setTitle('');
    setStatus(`${picked.length}問を問題集に保存しました。`);
    router.push('/bank');
  };

  const patch = (i: number, next: Partial<Candidate>) =>
    setCandidates((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...next } : c)),
    );

  return (
    <Screen
      title="文字起こしから問題集を作る"
      subtitle="文字起こしを貼り付けて生成ボタンを押すと、1問1答の問題が作られます。"
    >
      <Card>
        <Field
          label="タイトル（任意）"
          value={title}
          onChangeText={setTitle}
          placeholder="例: 2026/09/07 マーケティング勉強会"
        />
        <Field
          label={`文字起こし（${transcript.length.toLocaleString()}文字）`}
          value={transcript}
          onChangeText={setTranscript}
          placeholder="ここに文字起こしを貼り付けてください…"
          multiline
          minHeight={220}
        />
        <Row wrap>
          <Button
            title={busy ? '生成中…' : `AIで${target}問作る`}
            onPress={() => run('ai')}
            disabled={busy || !keyReady}
          />
          <Button
            title="AIなしで作る（オフライン）"
            onPress={() => run('offline')}
            variant="ghost"
            disabled={busy}
          />
        </Row>
        <View style={{ marginTop: space.md }}>
          {keyReady ? (
            <Muted>
              AI生成: {provider.label} / {settings.models[settings.provider]}
            </Muted>
          ) : (
            <Muted>
              AI生成には無料のAPIキーが必要です（設定タブ → {provider.label}
              ）。キーなしでもオフライン生成は使えます。
            </Muted>
          )}
        </View>
        {status ? (
          <Text
            style={[
              styles.muted,
              { marginTop: space.md, color: colors.success },
            ]}
          >
            {status}
          </Text>
        ) : null}
        {error ? (
          <Text
            style={[
              styles.muted,
              { marginTop: space.md, color: colors.danger },
            ]}
          >
            {error}
          </Text>
        ) : null}
      </Card>

      {candidates.length > 0 ? (
        <>
          <Row wrap>
            <Text style={styles.qText}>
              生成結果 {selectedCount}/{candidates.length} 問を保存
            </Text>
            <Button
              title="保存する"
              onPress={save}
              small
              disabled={selectedCount === 0}
            />
            <Button
              title="破棄"
              onPress={() => setCandidates([])}
              variant="ghost"
              small
            />
          </Row>
          <View style={{ height: space.md }} />
          {candidates.map((c, i) => (
            <Card
              key={`${i}-${c.question}`}
              style={!c.selected ? { opacity: 0.45 } : undefined}
            >
              <Pressable onPress={() => patch(i, { selected: !c.selected })}>
                <Text style={styles.muted}>
                  {c.selected ? '☑ 保存する' : '☐ 除外中'}（タップで切替）
                </Text>
              </Pressable>
              <View style={{ height: space.sm }} />
              <Field
                label="問題"
                value={c.question}
                onChangeText={(v) => patch(i, { question: v })}
                multiline
                minHeight={60}
              />
              <Field
                label="答え"
                value={c.answer}
                onChangeText={(v) => patch(i, { answer: v })}
                multiline
                minHeight={60}
              />
              <Field
                label="タグ（スペース区切り）"
                value={(c.tags ?? []).join(' ')}
                onChangeText={(v) =>
                  patch(i, { tags: v.split(/\s+/).filter(Boolean) })
                }
              />
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
