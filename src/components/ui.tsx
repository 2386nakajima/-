import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, usePathname } from 'expo-router';

import { colors, maxWidth, radius, space } from '@/lib/theme';

const TABS = [
  { href: '/', label: '作成' },
  { href: '/bank', label: '問題集' },
  { href: '/study', label: '演習' },
  { href: '/settings', label: '設定' },
] as const;

export function NavBar() {
  const pathname = usePathname();
  return (
    <View style={styles.nav}>
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} asChild>
            {/* Linkの子には配列styleを渡せないため flatten する */}
            <Pressable
              style={StyleSheet.flatten([
                styles.navItem,
                active && styles.navItemActive,
              ])}
            >
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
    >
      <View style={styles.inner}>
        <NavBar />
        <Text style={styles.h1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </ScrollView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'success' && { backgroundColor: colors.success },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'ghost' && styles.btnGhost,
        (disabled || pressed) && { opacity: disabled ? 0.4 : 0.7 },
      ]}
    >
      <Text
        style={[
          styles.btnText,
          small && { fontSize: 13 },
          variant === 'ghost' && { color: colors.text },
          variant === 'success' && { color: '#04220F' },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
  secure,
  keyboardType,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
  secure?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          multiline && {
            minHeight: minHeight ?? 160,
            textAlignVertical: 'top',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.accent }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({
  children,
  wrap,
}: {
  children: ReactNode;
  wrap?: boolean;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
        wrap && { flexWrap: 'wrap' },
      ]}
    >
      {children}
    </View>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

/** Web/ネイティブ両対応の簡易確認ダイアログ */
export function confirmAction(message: string): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.confirm(message);
  }
  return true;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, paddingBottom: 64 },
  inner: { width: '100%', maxWidth, alignSelf: 'center' },
  nav: { flexDirection: 'row', gap: space.sm, marginBottom: space.xl },
  navItem: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  navText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  navTextActive: { color: '#fff' },
  h1: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: space.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: space.md,
    fontSize: 15,
  },
  btn: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius,
    alignItems: 'center',
  },
  btnSmall: { paddingVertical: space.sm, paddingHorizontal: space.md },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  chipText: { color: colors.textMuted, fontSize: 13 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  qText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  aText: { color: colors.textMuted, fontSize: 15, marginTop: space.xs },
});
