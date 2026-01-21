// ============================================================================
// ElectricBoat v2.0 - Barre d'outils de l'éditeur
// ============================================================================

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { EditorMode } from '../../models/types';
import { colors, spacing, borderRadius } from '../../theme';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ToolbarProps {
  onBack?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAnalysis?: () => void;
}

interface ToolButtonProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

// ----------------------------------------------------------------------------
// Bouton d'outil
// ----------------------------------------------------------------------------

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  isActive = false,
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[
      styles.toolButton,
      isActive && styles.toolButtonActive,
      disabled && styles.toolButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text style={styles.toolIcon}>{icon}</Text>
    <Text style={[
      styles.toolLabel,
      isActive && styles.toolLabelActive,
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ----------------------------------------------------------------------------
// Mode selector
// ----------------------------------------------------------------------------

const modeConfig: Array<{ mode: EditorMode; icon: string; label: string }> = [
  { mode: 'view', icon: '👁️', label: 'Vue' },
  { mode: 'placement', icon: '📍', label: 'Placer' },
  { mode: 'cabling', icon: '🔌', label: 'Câbler' },
  { mode: 'analysis', icon: '📊', label: 'Analyse' },
];

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const Toolbar: React.FC<ToolbarProps> = ({
  onBack,
  onSave,
  onUndo,
  onRedo,
  onAnalysis,
}) => {
  const insets = useSafeAreaInsets();
  const {
    mode,
    setMode,
    showGrid,
    toggleGrid,
    toggleLibrary,
    resetTransform,
  } = useEditorStore();
  const { isDirty } = useProjectStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      {/* Ligne du haut: Actions */}
      <View style={styles.row}>
        {/* Bouton retour */}
        <TouchableOpacity style={styles.actionButton} onPress={onBack}>
          <Text style={styles.actionIcon}>←</Text>
        </TouchableOpacity>

        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Éditeur</Text>
          {isDirty && <View style={styles.dirtyIndicator} />}
        </View>

        {/* Actions droite */}
        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onUndo}
          >
            <Text style={styles.actionIcon}>↩️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRedo}
          >
            <Text style={styles.actionIcon}>↪️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isDirty && styles.saveButtonActive]}
            onPress={onSave}
          >
            <Text style={styles.actionIcon}>💾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ligne du bas: Modes */}
      <View style={styles.modesRow}>
        {/* Modes d'édition */}
        <View style={styles.modeSelector}>
          {modeConfig.map((item) => (
            <TouchableOpacity
              key={item.mode}
              style={[
                styles.modeButton,
                mode === item.mode && styles.modeButtonActive,
              ]}
              onPress={() => {
                setMode(item.mode);
                // Ouvrir le panneau d'analyse si mode analysis
                if (item.mode === 'analysis' && onAnalysis) {
                  onAnalysis();
                }
              }}
            >
              <Text style={styles.modeIcon}>{item.icon}</Text>
              <Text style={[
                styles.modeLabel,
                mode === item.mode && styles.modeLabelActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Séparateur */}
        <View style={styles.separator} />

        {/* Options */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.optionButton, showGrid && styles.optionButtonActive]}
            onPress={toggleGrid}
          >
            <Text style={styles.optionIcon}>⊞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={resetTransform}
          >
            <Text style={styles.optionIcon}>⌖</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={toggleLibrary}
          >
            <Text style={styles.optionIcon}>📚</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ----------------------------------------------------------------------------
// Styles
// ----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dirtyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  actionsRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  modesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeIcon: {
    fontSize: 16,
  },
  modeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modeLabelActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  optionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  optionIcon: {
    fontSize: 18,
  },
  toolButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
  },
  toolButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  toolLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  toolLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default Toolbar;
