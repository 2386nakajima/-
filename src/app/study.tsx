import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Muted,
  Row,
  Screen,
  styles,
} from '@/components/ui';
import { recordAnswer, useDB } from '@/lib/storage';
import { colors, space } from '@/lib/theme';
import { Question } from '@/lib/types';

const shuffle = <T,>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function StudyScreen() {
  const { questions, sources } = useDB();
  const [sourceId, setSourceId] = useState<string | 'all'>('all');
  const [tag, setTag] = useState<string | 'all'>('all');
  const [weakOnly, setWeakOnly] = useState(false);
  const [queue, setQueue] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const tags = useMemo(
    () => Array.from(new Set(questions.flatMap((q) => q.tags))).sort(),
    [questions],
  );

  const pool = useMemo(
    () =>
      questions.filter((q) => {
        if (sourceId !== 'all' && q.sourceId !== sourceId) return false;
        if (tag !== 'all' && !q.tags.includes(tag)) return false;
        // 苦手＝未解答、または不正解が正解以上
        if (weakOnly && q.correctCount > q.wrongCount) return false;
        return true;
      }),
    [questions, sourceId, tag, weakOnly],
  );

  const start = () => {
    setQueue(shuffle(pool));
    setIdx(0);
    setRevealed(false);
    setScore({ correct: 0, wrong: 0 });
  };

  const answer = (correct: boolean) => {
    if (!queue) return;
    recordAnswer(queue[idx].id, correct);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
    }));
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  if (queue && idx >= queue.length) {
    const total = score.correct + score.wrong;
    return (
      <Screen title="演習終了" subtitle={`${total}問を解きました。`}>
        <Card>
          <Text style={styles.h1}>
            正答率 {total ? Math.round((score.correct / total) * 100) : 0}%
          </Text>
          <Muted>
            正解 {score.correct} / 不正解 {score.wrong}
          </Muted>
          <View style={{ height: space.lg }} />
          <Row>
            <Button title="もう一度" onPress={start} />
            <Button
              title="条件を変える"
              onPress={() => setQueue(null)}
              variant="ghost"
            />
          </Row>
        </Card>
      </Screen>
    );
  }

  if (queue) {
    const q = queue[idx];
    return (
      <Screen
        title={`${idx + 1} / ${queue.length}`}
        subtitle={`正解 ${score.correct} ／ 不正解 ${score.wrong}`}
      >
        <Card>
          <Text style={[styles.qText, { fontSize: 20, lineHeight: 30 }]}>
            {q.question}
          </Text>
          <View style={{ height: space.lg }} />
          {revealed ? (
            <>
              <Text
                style={[styles.aText, { fontSize: 17, color: colors.text }]}
              >
                {q.answer}
              </Text>
              {q.note ? <Muted>{q.note}</Muted> : null}
              <View style={{ height: space.lg }} />
              <Row>
                <Button
                  title="○ 正解"
                  onPress={() => answer(true)}
                  variant="success"
                />
                <Button
                  title="× 不正解"
                  onPress={() => answer(false)}
                  variant="danger"
                />
              </Row>
            </>
          ) : (
            <Button title="答えを見る" onPress={() => setRevealed(true)} />
          )}
        </Card>
        <Button
          title="中断する"
          onPress={() => setQueue(null)}
          variant="ghost"
        />
      </Screen>
    );
  }

  return (
    <Screen title="演習" subtitle="出題する範囲を選んで開始します。">
      <Card>
        <Text style={styles.label}>文字起こし</Text>
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
            <Text style={styles.label}>タグ</Text>
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
        <Row>
          <Chip
            label="苦手・未解答のみ"
            active={weakOnly}
            onPress={() => setWeakOnly((v) => !v)}
          />
        </Row>
        <View style={{ height: space.lg }} />
        <Button
          title={`${pool.length}問で開始`}
          onPress={start}
          disabled={pool.length === 0}
        />
      </Card>
    </Screen>
  );
}
