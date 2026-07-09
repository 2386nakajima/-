// サイト共通のトップナビゲーション。
import { Link, usePathname } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, maxWidth, radius, spacing } from '@/theme';

type NavItem = {
  href: '/' | '/schedule' | '/requests' | '/staff' | '/summary';
  label: string;
};

const ITEMS: NavItem[] = [
  { href: '/', label: 'ホーム' },
  { href: '/schedule', label: 'シフト表' },
  { href: '/requests', label: '希望シフト' },
  { href: '/staff', label: 'スタッフ' },
  { href: '/summary', label: '勤怠集計' },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <Link href="/" style={styles.brand}>
          <Text style={styles.brandText}>🗓 ShiftKit</Text>
        </Link>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.links}
        >
          {ITEMS.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={[styles.link, active && styles.linkActive]}
              >
                <Text
                  style={[styles.linkText, active && styles.linkTextActive]}
                >
                  {item.label}
                </Text>
              </Link>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inner: {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  brand: { marginRight: spacing.md },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  links: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  link: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  linkActive: {
    backgroundColor: colors.surfaceAlt,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  linkTextActive: {
    color: colors.primary,
  },
});
