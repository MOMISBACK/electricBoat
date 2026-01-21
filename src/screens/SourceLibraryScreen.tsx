import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { sourceLibrary, getSourceDisplayName } from '../data/sourceLibrary';
import { useStore } from '../store/useStore';
import type { PowerSource } from '../models/types';
import { Toast, type ToastType } from '../components';
import { colors, borderRadius, spacing, typography } from '../theme';

export function SourceLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const addSource = useStore((state) => state.addSource);
  const [selectedCategory, setSelectedCategory] = useState<string>(sourceLibrary[0].name);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const currentCategory = sourceLibrary.find((c) => c.name === selectedCategory);

  const handleAdd = (item: Omit<PowerSource, 'id'>) => {
    const source: PowerSource = {
      id: Date.now().toString(),
      ...item,
    };
    addSource(source);
    setToast({ message: `${getSourceDisplayName(source)} ajouté`, type: 'success' });
  };

  const getSourceIcon = (type: PowerSource['type']) => {
    switch (type) {
      case 'battery': return '🔋';
      case 'solar': return '☀️';
      case 'alternator': return '⚙️';
      case 'wind': return '🌀';
    }
  };

  const getSourceColor = (type: PowerSource['type']) => {
    switch (type) {
      case 'battery': return colors.deviceBattery;
      case 'solar': return colors.deviceSolar;
      case 'alternator': return colors.deviceAlternator;
      case 'wind': return colors.deviceWind;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {sourceLibrary.map((category) => (
          <Pressable
            key={category.name}
            style={[
              styles.categoryTab,
              selectedCategory === category.name && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(category.name)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.name && styles.categoryLabelActive,
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sources List */}
      <FlatList
        data={currentCategory?.sources ?? []}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const color = getSourceColor(item.type);
          const icon = getSourceIcon(item.type);
          
          return (
            <Pressable
              style={({ pressed }) => [
                styles.sourceCard,
                pressed && styles.sourceCardPressed,
              ]}
              onPress={() => handleAdd(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Text style={styles.sourceIcon}>{icon}</Text>
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>
                  {item.type === 'battery'
                    ? `Batterie ${item.capacityAh} Ah`
                    : item.type === 'solar'
                    ? `Panneau ${item.powerW} W`
                    : item.type === 'alternator'
                    ? `Alternateur ${item.powerW} W`
                    : `Éolienne ${item.powerW} W`}
                </Text>
                <View style={styles.sourceSpecs}>
                  <View style={styles.specBadge}>
                    <Text style={styles.specBadgeText}>{item.voltage}V</Text>
                  </View>
                  {item.efficiency && (
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>
                        {Math.round(item.efficiency * 100)}% eff.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.addButton, { color }]}>+</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune source dans cette catégorie</Text>
          </View>
        }
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={true}
          onHide={() => setToast(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoryScroll: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.textPrimary,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  sourceCardPressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIcon: {
    fontSize: 24,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sourceSpecs: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  specBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  specBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  addButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
