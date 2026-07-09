import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, PageTitle, Row, Screen } from '@/components/ui';
import { formatShort, todayISO } from '@/lib/date';
import { loadSampleData, resetAll, useData } from '@/lib/store';
import { colors, radius, spacing } from '@/theme';

export default function HomeScreen() {
  const data = useData();
  const today = todayISO();
  const todayShifts = data.shifts.filter((s) => s.date === today);
  const pendingRequests = data.requests.filter((r) => r.status === 'pending');

  const stats = [
    { label: 'スタッフ', value: data.staff.length, href: '/staff' as const },
    {
      label: '本日のシフト',
      value: todayShifts.length,
      href: '/schedule' as const,
    },
    {
      label: '未処理の希望',
      value: pendingRequests.length,
      href: '/requests' as const,
    },
  ];

  const isEmpty = data.staff.length === 0 && data.shifts.length === 0;

  return (
    <Screen>
      <PageTitle
        title="ShiftKit"
        subtitle={`シフト管理サイト ・ ${formatShort(today)}`}
      />

      <View style={styles.statGrid}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={styles.statLink}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </Link>
        ))}
      </View>

      <Card>
        <Text style={styles.cardTitle}>できること</Text>
        <View style={styles.featureList}>
          <Feature
            emoji="📅"
            title="シフト表を作成"
            desc="週ごとにスタッフの勤務を割り当て・編集"
            href="/schedule"
          />
          <Feature
            emoji="✋"
            title="希望シフトを提出"
            desc="スタッフが勤務可能な日時を申請、管理者が承認"
            href="/requests"
          />
          <Feature
            emoji="👥"
            title="スタッフを管理"
            desc="名前・役職・時給を登録"
            href="/staff"
          />
          <Feature
            emoji="📊"
            title="勤怠を集計"
            desc="月ごとの勤務時間と人件費を自動計算"
            href="/summary"
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>データ</Text>
        <Text style={styles.note}>
          データはこのブラウザ内（localStorage）に保存されます。
        </Text>
        <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }}>
          {isEmpty ? (
            <Button label="サンプルデータを入れる" onPress={loadSampleData} />
          ) : (
            <Button
              label="全データをリセット"
              variant="danger"
              onPress={resetAll}
            />
          )}
        </Row>
      </Card>
    </Screen>
  );
}

function Feature({
  emoji,
  title,
  desc,
  href,
}: {
  emoji: string;
  title: string;
  desc: string;
  href: '/schedule' | '/requests' | '/staff' | '/summary';
}) {
  return (
    <Link href={href} style={styles.feature}>
      <View style={styles.featureInner}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDesc}>{desc}</Text>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statLink: {
    flexGrow: 1,
    flexBasis: 160,
  },
  stat: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureList: {
    gap: spacing.sm,
  },
  feature: {
    borderRadius: radius.md,
  },
  featureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  note: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
