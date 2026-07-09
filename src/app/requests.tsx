import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageTitle,
  Row,
  Screen,
} from '@/components/ui';
import { formatShort, timeToMinutes, todayISO } from '@/lib/date';
import {
  addRequest,
  removeRequest,
  setRequestStatus,
  useData,
} from '@/lib/store';
import { RequestStatus } from '@/lib/types';
import { colors, radius, spacing } from '@/theme';

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: '未処理',
  approved: '承認済み',
  rejected: '却下',
};
const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.textMuted,
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function RequestsScreen() {
  const { staff, requests } = useData();
  const [formStaff, setFormStaff] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('18:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!formStaff) {
      setError('スタッフを選んでください');
      return;
    }
    if (!ISO_RE.test(date.trim())) {
      setError('日付は YYYY-MM-DD 形式で入力してください（例 2026-07-09）');
      return;
    }
    if (timeToMinutes(start) == null || timeToMinutes(end) == null) {
      setError('時刻は HH:MM 形式で入力してください');
      return;
    }
    addRequest({
      staffId: formStaff,
      date: date.trim(),
      start,
      end,
      note: note.trim() || undefined,
    });
    setNote('');
    setError('');
  }

  const nameOf = (id: string) =>
    staff.find((s) => s.id === id)?.name ?? '（削除済み）';
  const colorOf = (id: string) =>
    staff.find((s) => s.id === id)?.color ?? colors.textMuted;

  const sorted = [...requests].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Screen>
      <PageTitle
        title="希望シフト"
        subtitle="スタッフが勤務希望を提出し、管理者が承認します"
      />

      {staff.length === 0 ? (
        <Card>
          <EmptyState message="先に「スタッフ」画面でスタッフを登録してください。" />
        </Card>
      ) : (
        <Card>
          <Text style={styles.formTitle}>希望を提出</Text>
          <Text style={styles.fieldLabel}>スタッフ</Text>
          <Row style={{ flexWrap: 'wrap', marginBottom: spacing.md }}>
            {staff.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setFormStaff(s.id)}
                style={[
                  styles.selChip,
                  formStaff === s.id && {
                    backgroundColor: s.color,
                    borderColor: s.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selChipText,
                    formStaff === s.id && { color: '#fff' },
                  ]}
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </Row>

          <Field
            label="日付 (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder="2026-07-09"
          />
          <Row style={{ flexWrap: 'wrap', gap: spacing.md }}>
            <View style={styles.timeField}>
              <Field
                label="開始"
                value={start}
                onChangeText={setStart}
                placeholder="10:00"
              />
            </View>
            <View style={styles.timeField}>
              <Field
                label="終了"
                value={end}
                onChangeText={setEnd}
                placeholder="18:00"
              />
            </View>
          </Row>
          <Field
            label="メモ（任意）"
            value={note}
            onChangeText={setNote}
            placeholder="例: 18時以降が希望"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="希望を提出する" onPress={submit} />
        </Card>
      )}

      <Card>
        <Text style={styles.formTitle}>
          提出された希望（{requests.length}件）
        </Text>
        {sorted.length === 0 ? (
          <EmptyState message="まだ希望シフトはありません。" />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {sorted.map((r) => (
              <View key={r.id} style={styles.reqRow}>
                <View
                  style={[styles.dot, { backgroundColor: colorOf(r.staffId) }]}
                />
                <View style={{ flex: 1, minWidth: 140 }}>
                  <Text style={styles.reqName}>{nameOf(r.staffId)}</Text>
                  <Text style={styles.reqMeta}>
                    {formatShort(r.date)} ・ {r.start}–{r.end}
                  </Text>
                  {r.note ? (
                    <Text style={styles.reqNote}>💬 {r.note}</Text>
                  ) : null}
                </View>
                <Badge
                  label={STATUS_LABEL[r.status]}
                  color={STATUS_COLOR[r.status]}
                />
                <Row style={{ flexWrap: 'wrap' }}>
                  {r.status !== 'approved' ? (
                    <Button
                      label="承認"
                      onPress={() => setRequestStatus(r.id, 'approved')}
                    />
                  ) : null}
                  {r.status !== 'rejected' ? (
                    <Button
                      label="却下"
                      variant="secondary"
                      onPress={() => setRequestStatus(r.id, 'rejected')}
                    />
                  ) : null}
                  <Button
                    label="削除"
                    variant="ghost"
                    onPress={() => removeRequest(r.id)}
                  />
                </Row>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.hint}>
          ※ 「承認」するとシフト表に自動で反映されます
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  selChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  timeField: {
    minWidth: 100,
    flexGrow: 1,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    flexWrap: 'wrap',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  reqName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  reqMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  reqNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
