import { useMemo, useState } from 'react';
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
import { downloadText } from '@/lib/download';
import {
  addQuestions,
  deleteQuestions,
  deleteSource,
  exportCSV,
  exportJSON,
  importJSON,
  updateQuestion,
  useDB,
} from '@/lib/storage';
import { colors, space } from '@/lib/theme';
import { Question } from '@/lib/types';

const stamp = () => new Date().toISOString().slice(0, 10);

export default function BankScreen() {
  const { questions, sources } = useDB();
  const [keyword, setKeyword] = useState('');
  const [sourceId, setSourceId] = useState<string | 'all'>('all');
  const [tag, setTag] = useState<string | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Question>>({});
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState({ question: '', answer: '', tags: '' });
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

  const tags = useMemo(
    () => Array.from(new Set(questions.flatMap((q) => q.tags))).sort(),
    [questions],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return questions.filter((q) => {
      if (sourceId !== 'all' && q.sourceId !== sourceId) return false;
      if (tag !== 'all' && !q.tags.includes(tag)) return false;
      if (!kw) return true;
      return (
        q.question.toLowerCase().includes(kw) ||
        q.answer.toLowerCase().includes(kw) ||
        q.note.toLowerCase().includes(kw)
      );
    });
  }, [questions, keyword, sourceId, tag]);

  const answered = questions.reduce(
    (n, q) => n + q.correctCount + q.wrongCount,
    0,
  );
  const correct = questions.reduce((n, q) => n + q.correctCount, 0);

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setDraft({
      question: q.question,
      answer: q.answer,
      note: q.note,
      tags: q.tags,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateQuestion(editingId, draft);
    setEditingId(null);
    setDraft({});
  };

  const remove = (q: Question) => {
    if (!confirmAction(`「${q.question.slice(0, 30)}…」を削除しますか？`))
      return;
    deleteQuestions([q.id]);
  };

  const addManual = () => {
    if (!newQ.question.trim() || !newQ.answer.trim()) return;
    addQuestions(
      [
        {
          question: newQ.question,
          answer: newQ.answer,
          tags: newQ.tags.split(/\s+/).filter(Boolean),
        },
      ],
      sourceId === 'all' ? null : sourceId,
    );
    setNewQ({ question: '', answer: '', tags: '' });
    setAdding(false);
  };

  const doExport = (kind: 'json' | 'csv') => {
    const text = kind === 'json' ? exportJSON() : exportCSV(filtered);
    const ok = downloadText(
      `quizbank-${stamp()}.${kind}`,
      text,
      kind === 'json' ? 'application/json' : 'text/csv',
    );
    setMessage(
      ok ? 'ファイルを書き出しました。' : 'この環境では書き出せません。',
    );
  };

  const doImport = () => {
    try {
      const r = importJSON(importText);
      setImportText('');
      setMessage(
        `取り込み完了: 問題${r.questions}件 / 文字起こし${r.sources}件`,
      );
    } catch {
      setMessage('JSONの形式が正しくありません。');
    }
  };

  return (
    <Screen
      title="問題集（マスターデータ）"
      subtitle={`全${questions.length}問 / 文字起こし${sources.length}件 / 解答${answered}回・正答率${answered ? Math.round((correct / answered) * 100) : 0}%`}
    >
      <Card>
        <Field
          label="検索"
          value={keyword}
          onChangeText={setKeyword}
          placeholder="問題文・答え・メモを検索"
        />
        <Text style={styles.label}>文字起こしで絞り込み</Text>
        <Row wrap>
          <Chip
            label="すべて"
            active={sourceId === 'all'}
            onPress={() => setSourceId('all')}
          />
          {sources.map((s) => (
            <Chip
              key={s.id}
              label={s.title}
              active={sourceId === s.id}
              onPress={() => setSourceId(s.id)}
            />
          ))}
        </Row>
        {tags.length > 0 ? (
          <>
            <View style={{ height: space.md }} />
            <Text style={styles.label}>タグで絞り込み</Text>
            <Row wrap>
              <Chip
                label="すべて"
                active={tag === 'all'}
                onPress={() => setTag('all')}
              />
              {tags.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={tag === t}
                  onPress={() => setTag(t)}
                />
              ))}
            </Row>
          </>
        ) : null}
        <View style={{ height: space.md }} />
        <Row wrap>
          <Button
            title="1問追加"
            onPress={() => setAdding((v) => !v)}
            variant="ghost"
            small
          />
          <Button
            title="JSON書き出し"
            onPress={() => doExport('json')}
            variant="ghost"
            small
          />
          <Button
            title="CSV書き出し（表示中）"
            onPress={() => doExport('csv')}
            variant="ghost"
            small
          />
          {sourceId !== 'all' ? (
            <Button
              title="この文字起こしごと削除"
              variant="danger"
              small
              onPress={() => {
                if (
                  !confirmAction(
                    '紐づく問題もまとめて削除します。よろしいですか？',
                  )
                )
                  return;
                deleteSource(sourceId);
                setSourceId('all');
              }}
            />
          ) : null}
        </Row>
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

      {adding ? (
        <Card>
          <Field
            label="問題"
            value={newQ.question}
            onChangeText={(v) => setNewQ({ ...newQ, question: v })}
            multiline
            minHeight={60}
          />
          <Field
            label="答え"
            value={newQ.answer}
            onChangeText={(v) => setNewQ({ ...newQ, answer: v })}
            multiline
            minHeight={60}
          />
          <Field
            label="タグ（スペース区切り）"
            value={newQ.tags}
            onChangeText={(v) => setNewQ({ ...newQ, tags: v })}
          />
          <Row>
            <Button title="追加" onPress={addManual} small />
            <Button
              title="キャンセル"
              onPress={() => setAdding(false)}
              variant="ghost"
              small
            />
          </Row>
        </Card>
      ) : null}

      <Text style={[styles.label, { marginBottom: space.sm }]}>
        表示中 {filtered.length} 問
      </Text>

      {filtered.map((q) =>
        editingId === q.id ? (
          <Card key={q.id}>
            <Field
              label="問題"
              value={draft.question ?? ''}
              onChangeText={(v) => setDraft({ ...draft, question: v })}
              multiline
              minHeight={60}
            />
            <Field
              label="答え"
              value={draft.answer ?? ''}
              onChangeText={(v) => setDraft({ ...draft, answer: v })}
              multiline
              minHeight={60}
            />
            <Field
              label="メモ"
              value={draft.note ?? ''}
              onChangeText={(v) => setDraft({ ...draft, note: v })}
            />
            <Field
              label="タグ（スペース区切り）"
              value={(draft.tags ?? []).join(' ')}
              onChangeText={(v) =>
                setDraft({ ...draft, tags: v.split(/\s+/).filter(Boolean) })
              }
            />
            <Row>
              <Button title="保存" onPress={saveEdit} small />
              <Button
                title="キャンセル"
                onPress={() => setEditingId(null)}
                variant="ghost"
                small
              />
            </Row>
          </Card>
        ) : (
          <Card key={q.id}>
            <Text style={styles.qText}>{q.question}</Text>
            <Text style={styles.aText}>{q.answer}</Text>
            {q.note ? <Muted>{q.note}</Muted> : null}
            <View style={{ height: space.sm }} />
            <Row wrap>
              {q.tags.map((t) => (
                <Chip key={t} label={t} onPress={() => setTag(t)} />
              ))}
              <Muted>
                ○{q.correctCount} ／ ×{q.wrongCount}
              </Muted>
            </Row>
            <View style={{ height: space.sm }} />
            <Row>
              <Button
                title="編集"
                onPress={() => startEdit(q)}
                variant="ghost"
                small
              />
              <Button
                title="削除"
                onPress={() => remove(q)}
                variant="danger"
                small
              />
            </Row>
          </Card>
        ),
      )}

      <Card>
        <Text style={styles.label}>JSONから取り込み</Text>
        <Field
          value={importText}
          onChangeText={setImportText}
          placeholder="書き出したJSONを貼り付け"
          multiline
          minHeight={100}
        />
        <Button title="取り込む" onPress={doImport} variant="ghost" small />
      </Card>
    </Screen>
  );
}
