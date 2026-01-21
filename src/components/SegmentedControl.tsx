import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface SegmentedControlProps {
  segments: Array<{ key: string; label: string; icon?: string }>;
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function SegmentedControl({
  segments,
  selectedKey,
  onSelect,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isSelected = segment.key === selectedKey;
        return (
          <Pressable
            key={segment.key}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onSelect(segment.key)}
          >
            {segment.icon && (
              <Text style={[styles.icon, isSelected && styles.iconSelected]}>
                {segment.icon}
              </Text>
            )}
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  icon: {
    fontSize: 14,
  },
  iconSelected: {
    opacity: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
});
