import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  PageTitle,
  Row,
  Screen,
} from '@/components/ui';
import {
  formatMonthLabel,
  minutesToHours,
  monthOf,
  shiftMonth,
  todayISO,
  workMinutes,
} from '@/lib/date';
import { useData } from '@/lib/store';
import { colors, radius, spacing } from '@/theme';

export default function SummaryScreen() {
  const { staff, shifts } = useData();
  const [month, setMonth] = useState(monthOf(todayISO()));

  const rows = useMemo(() => {
    const monthShifts = shifts.filter((s) => monthOf(s.date) === month);
    return staff
      .map((s) => {
        const own = monthShifts.filter((sh) => sh.staffId === s.id);
        const minutes = own.reduce(
          (sum, sh) => sum + workMinutes(sh.start, sh.end, sh.breakMinutes),
          0,
        );
        const hours = minutesToHours(minutes);
        const cost = Math.round((minutes / 60) * s.hourlyWage);
        return { staff: s, count: own.length, hours, cost };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [staff, shifts, month]);

  const totalHours = minutesToHours(
    rows.reduce((sum, r) => sum + r.hours * 60, 0),
  );
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalShifts = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <Screen>
      <PageTitle
        title="勤怠集計"
        subtitle="確定シフトから月ごとの勤務時間・人件費を集計します"
      />

      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Row>
            <Button
              label="← 前月"
              variant="secondary"
              onPress={() => setMonth(shiftMonth(month, -1))}
            />
            <Button
              label="今月"
              variant="secondary"
              onPress={() => setMonth(monthOf(todayISO()))}
            />
            <Button
              label="翌月 →"
              variant="secondary"
              onPress={() => setMonth(shiftMonth(month, 1))}
            />
          </Row>
          <Text style={styles.monthLabel}>{formatMonthLabel(month)}</Text>
        </Row>
      </Card>

      <View style={styles.totalGrid}>
        <Total label="合計勤務時間" value={`${totalHours} h`} />
        <Total label="合計シフト数" value={`${totalShifts} 件`} />
        <Total
          label="人件費（概算）"
          value={`¥${totalCost.toLocaleString()}`}
        />
      </View>

      <Card style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <View style={{ padding: spacing.lg }}>
            <EmptyState message="この月の確定シフトはまだありません。" />
          </View>
        ) : (
          <View>
            <View style={[styles.tRow, styles.tHead]}>
              <Text style={[styles.th, styles.colName]}>スタッフ</Text>
              <Text style={[styles.th, styles.colNum]}>回数</Text>
              <Text style={[styles.th, styles.colNum]}>時間</Text>
              <Text style={[styles.th, styles.colNum]}>時給</Text>
              <Text style={[styles.th, styles.colMoney]}>人件費</Text>
            </View>
            {rows.map((r) => (
              <View key={r.staff.id} style={styles.tRow}>
                <View style={[styles.colName, styles.nameCell]}>
                  <View
                    style={[styles.dot, { backgroundColor: r.staff.color }]}
                  />
                  <Text style={styles.td} numberOfLines={1}>
                    {r.staff.name}
                  </Text>
                </View>
                <Text style={[styles.td, styles.colNum]}>{r.count}</Text>
                <Text style={[styles.td, styles.colNum]}>{r.hours}h</Text>
                <Text style={[styles.td, styles.colNum]}>
                  ¥{r.staff.hourlyWage}
                </Text>
                <Text style={[styles.td, styles.colMoney, styles.money]}>
                  ¥{r.cost.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
      <Text style={styles.note}>
        ※ 人件費は「勤務時間 × 時給」の概算です。深夜・残業割増は含みません。
      </Text>
    </Screen>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  total: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tHead: {
    backgroundColor: colors.surfaceAlt,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  td: {
    fontSize: 14,
    color: colors.text,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  colName: { flex: 1, minWidth: 120 },
  colNum: { width: 64, textAlign: 'right' },
  colMoney: { width: 96, textAlign: 'right' },
  money: {
    fontWeight: '700',
    color: colors.text,
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
