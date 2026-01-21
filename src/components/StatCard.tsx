import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const variantColors = {
  default: colors.primary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export function StatCard({
  label,
  value,
  unit,
  icon,
  variant = 'default',
  size = 'md',
}: StatCardProps) {
  return (
    <View style={[styles.container, styles[`size_${size}`]]}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: variantColors[variant] }]}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'muted';
}

export function StatRow({ label, value, unit, variant = 'default' }: StatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, variant === 'muted' && styles.rowMuted]}>
        {label}
      </Text>
      <View style={styles.rowValueContainer}>
        <Text style={[styles.rowValue, variant === 'muted' && styles.rowMuted]}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Text>
        {unit && (
          <Text style={[styles.rowUnit, variant === 'muted' && styles.rowMuted]}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  size_sm: {
    padding: spacing.md,
  },
  size_md: {
    padding: spacing.lg,
  },
  size_lg: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },

  // Row styles
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  rowMuted: {
    color: colors.textMuted,
  },
});
