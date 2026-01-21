import React, { useState } from 'react';
import {
  Dimensions,
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
import { deviceLibrary, type DeviceCategory } from '../data/deviceLibrary';
import { useStore } from '../store/useStore';
import type { Device } from '../models/types';
import { deviceCurrent, deviceDailyAh } from '../utils/calculations';
import { Card, Toast, type ToastType } from '../components';
import { colors, borderRadius, spacing, typography } from '../theme';

export function DeviceLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const addDevice = useStore((state) => state.addDevice);
  const [selectedCategory, setSelectedCategory] = useState<string>(deviceLibrary[0].name);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const currentCategory = deviceLibrary.find((c) => c.name === selectedCategory);

  const handleAdd = (item: Omit<Device, 'id' | 'position'>) => {
    const { width, height } = Dimensions.get('window');
    const device: Device = {
      id: Date.now().toString(),
      position: { x: width / 2 - 50 + Math.random() * 100, y: height / 4 + Math.random() * 100 },
      ...item,
    };
    addDevice(device);
    setToast({ message: `${item.name} ajouté`, type: 'success' });
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
        {deviceLibrary.map((category) => (
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

      {/* Devices Grid */}
      <FlatList
        data={currentCategory?.devices ?? []}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const current = deviceCurrent(item as Device & { position: { x: number; y: number } });
          const dailyAh = deviceDailyAh(item as Device & { position: { x: number; y: number } });
          
          return (
            <Pressable
              style={({ pressed }) => [
                styles.deviceCard,
                pressed && styles.deviceCardPressed,
              ]}
              onPress={() => handleAdd(item)}
            >
              <View style={styles.deviceHeader}>
                <View style={styles.voltageBadge}>
                  <Text style={styles.voltageText}>{item.voltage}V</Text>
                </View>
                <Text style={styles.addIcon}>+</Text>
              </View>
              <Text style={styles.deviceName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.deviceSpecs}>
                <Text style={styles.specText}>
                  {item.powerW ? `${item.powerW}W` : `${item.currentA}A`}
                </Text>
                <Text style={styles.specDot}>•</Text>
                <Text style={styles.specText}>{dailyAh.toFixed(1)} Ah/j</Text>
              </View>
              <Text style={styles.deviceMeta}>
                {item.dailyHours}h/j · {Math.round(item.dutyCycle * 100)}%
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun appareil dans cette catégorie</Text>
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
  grid: {
    padding: spacing.md,
    gap: spacing.md,
  },
  gridRow: {
    gap: spacing.md,
  },
  deviceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 140,
  },
  deviceCardPressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.98 }],
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  voltageBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  voltageText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  deviceSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  specText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  specDot: {
    color: colors.textMuted,
  },
  deviceMeta: {
    fontSize: 11,
    color: colors.textMuted,
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
