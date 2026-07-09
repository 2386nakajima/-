import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  PageTitle,
  Row,
  Screen,
} from '@/components/ui';
import {
  addDaysISO,
  formatShort,
  minutesToHours,
  timeToMinutes,
  todayISO,
  weekDates,
  weekdayIndex,
  workMinutes,
} from '@/lib/date';
import { addShift, removeShift, useData } from '@/lib/store';
import { colors, radius, spacing } from '@/theme';

const DAY_WIDTH = 132;

export default function ScheduleScreen() {
  const { staff, shifts } = useData();
  const [anchor, setAnchor] = useState(todayISO());
  const days = useMemo(() => weekDates(anchor), [anchor]);

  const [formStaff, setFormStaff] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(days[0]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [breakMin, setBreakMin] = useState('0');
  const [error, setError] = useState('');

  // 週が変わったときにフォームの日付が範囲外なら補正
  if (!days.includes(formDate)) {
    setFormDate(days[0]);
  }

  const shiftsByCell = useMemo(() => {
    const map = new Map<string, typeof shifts>();
    for (const s of shifts) {
      const key = `${s.staffId}|${s.date}`;
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return map;
  }, [shifts]);

  function submit() {
    if (!formStaff) {
      setError('スタッフを選んでください');
      return;
    }
    if (timeToMinutes(start) == null || timeToMinutes(end) == null) {
      setError('時刻は HH:MM 形式で入力してください（例 09:00）');
      return;
    }
    const brk = parseInt(breakMin, 10);
    addShift({
      staffId: formStaff,
      date: formDate,
      start,
      end,
      breakMinutes: Number.isFinite(brk) && brk > 0 ? brk : 0,
    });
    setError('');
  }

  return (
    <Screen>
      <PageTitle
        title="シフト表"
        subtitle="週ごとにスタッフの勤務を割り当てます"
      />

      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Row>
            <Button
              label="← 前の週"
              variant="secondary"
              onPress={() => setAnchor(addDaysISO(anchor, -7))}
            />
            <Button
              label="今週"
              variant="secondary"
              onPress={() => setAnchor(todayISO())}
            />
            <Button
              label="次の週 →"
              variant="secondary"
              onPress={() => setAnchor(addDaysISO(anchor, 7))}
            />
          </Row>
          <Text style={styles.weekLabel}>
            {formatShort(days[0])} 〜 {formatShort(days[6])}
          </Text>
        </Row>
      </Card>

      {staff.length === 0 ? (
        <Card>
          <EmptyState message="先に「スタッフ」画面でスタッフを登録してください。" />
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* ヘッダー行 */}
              <View style={styles.headerRow}>
                <View style={styles.nameCol}>
                  <Text style={styles.headerName}>スタッフ</Text>
                </View>
                {days.map((d) => (
                  <View key={d} style={styles.dayCol}>
                    <Text
                      style={[
                        styles.dayHeader,
                        weekdayIndex(d) === 0 && { color: colors.sunday },
                        weekdayIndex(d) === 6 && { color: colors.saturday },
                        d === todayISO() && styles.todayHeader,
                      ]}
                    >
                      {formatShort(d)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* スタッフごとの行 */}
              {staff.map((s) => (
                <View key={s.id} style={styles.bodyRow}>
                  <View style={styles.nameCol}>
                    <View style={[styles.dot, { backgroundColor: s.color }]} />
                    <Text style={styles.bodyName} numberOfLines={1}>
                      {s.name}
                    </Text>
                  </View>
                  {days.map((d) => {
                    const cell = shiftsByCell.get(`${s.id}|${d}`) ?? [];
                    return (
                      <View key={d} style={styles.dayCol}>
                        {cell.map((sh) => {
                          const h = minutesToHours(
                            workMinutes(sh.start, sh.end, sh.breakMinutes),
                          );
                          return (
                            <Pressable
                              key={sh.id}
                              onPress={() => removeShift(sh.id)}
                              style={[
                                styles.chip,
                                { backgroundColor: s.color },
                              ]}
                            >
                              <Text style={styles.chipTime}>
                                {sh.start}–{sh.end}
                              </Text>
                              <Text style={styles.chipMeta}>
                                {h}h
                                {sh.breakMinutes
                                  ? ` (休${sh.breakMinutes})`
                                  : ''}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.hint}>※ シフトをタップすると削除できます</Text>
        </Card>
      )}

      {staff.length > 0 ? (
        <Card>
          <Text style={styles.formTitle}>シフトを追加</Text>
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

          <Text style={styles.fieldLabel}>日付</Text>
          <Row style={{ flexWrap: 'wrap', marginBottom: spacing.md }}>
            {days.map((d) => (
              <Pressable
                key={d}
                onPress={() => setFormDate(d)}
                style={[styles.selChip, formDate === d && styles.selChipActive]}
              >
                <Text
                  style={[
                    styles.selChipText,
                    formDate === d && { color: '#fff' },
                  ]}
                >
                  {formatShort(d)}
                </Text>
              </Pressable>
            ))}
          </Row>

          <Row style={{ flexWrap: 'wrap', gap: spacing.md }}>
            <View style={styles.timeField}>
              <Field
                label="開始"
                value={start}
                onChangeText={setStart}
                placeholder="09:00"
              />
            </View>
            <View style={styles.timeField}>
              <Field
                label="終了"
                value={end}
                onChangeText={setEnd}
                placeholder="17:00"
              />
            </View>
            <View style={styles.timeField}>
              <Field
                label="休憩(分)"
                value={breakMin}
                onChangeText={setBreakMin}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </Row>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="このシフトを追加" onPress={submit} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  bodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'stretch',
  },
  nameCol: {
    width: 120,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dayCol: {
    width: DAY_WIDTH,
    padding: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: spacing.xs,
    minHeight: 48,
  },
  headerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  todayHeader: {
    textDecorationLine: 'underline',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  bodyName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  chip: {
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  chipTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chipMeta: {
    color: '#ffffffcc',
    fontSize: 11,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    padding: spacing.sm,
  },
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
  selChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
});
