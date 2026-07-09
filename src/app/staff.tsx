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
import {
  addStaff,
  removeStaff,
  staffColorPalette,
  updateStaff,
  useData,
} from '@/lib/store';
import { colors, radius, spacing } from '@/theme';

export default function StaffScreen() {
  const { staff } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [wage, setWage] = useState('');
  const [color, setColor] = useState(staffColorPalette[0]);
  const [error, setError] = useState('');

  function reset() {
    setEditingId(null);
    setName('');
    setRole('');
    setWage('');
    setColor(staffColorPalette[0]);
    setError('');
  }

  function startEdit(id: string) {
    const s = staff.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    setName(s.name);
    setRole(s.role);
    setWage(String(s.hourlyWage));
    setColor(s.color);
    setError('');
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('名前を入力してください');
      return;
    }
    const wageNum = parseInt(wage, 10);
    const payload = {
      name: trimmed,
      role: role.trim() || '未設定',
      hourlyWage: Number.isFinite(wageNum) && wageNum > 0 ? wageNum : 0,
      color,
    };
    if (editingId) {
      updateStaff(editingId, payload);
    } else {
      addStaff(payload);
    }
    reset();
  }

  return (
    <Screen>
      <PageTitle title="スタッフ" subtitle="名前・役職・時給を登録します" />

      <Card>
        <Text style={styles.formTitle}>
          {editingId ? 'スタッフを編集' : 'スタッフを追加'}
        </Text>
        <Field
          label="名前"
          value={name}
          onChangeText={setName}
          placeholder="例: 山田 太郎"
        />
        <Field
          label="役職・区分"
          value={role}
          onChangeText={setRole}
          placeholder="例: ホール / キッチン / 店長"
        />
        <Field
          label="時給（円）"
          value={wage}
          onChangeText={setWage}
          placeholder="例: 1100"
          keyboardType="numeric"
        />
        <Text style={styles.fieldLabel}>色</Text>
        <Row style={{ flexWrap: 'wrap', marginBottom: spacing.md }}>
          {staffColorPalette.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && styles.swatchActive,
              ]}
            />
          ))}
        </Row>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Row style={{ flexWrap: 'wrap' }}>
          <Button
            label={editingId ? '更新する' : '追加する'}
            onPress={submit}
          />
          {editingId ? (
            <Button label="キャンセル" variant="secondary" onPress={reset} />
          ) : null}
        </Row>
      </Card>

      <Card>
        <Text style={styles.formTitle}>登録済み（{staff.length}名）</Text>
        {staff.length === 0 ? (
          <EmptyState message="まだスタッフがいません。上のフォームから追加してください。" />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {staff.map((s) => (
              <View key={s.id} style={styles.staffRow}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{s.name}</Text>
                  <Row style={{ marginTop: 2 }}>
                    <Badge label={s.role} color={colors.textMuted} />
                    <Text style={styles.wage}>時給 {s.hourlyWage}円</Text>
                  </Row>
                </View>
                <Button
                  label="編集"
                  variant="secondary"
                  onPress={() => startEdit(s.id)}
                />
                <Button
                  label="削除"
                  variant="ghost"
                  onPress={() => removeStaff(s.id)}
                />
              </View>
            ))}
          </View>
        )}
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
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.text,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  staffRow: {
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
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  wage: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
