// ============================================================================
// ElectricBoat v2.0 - Panneau de bibliothèque d'équipements
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { nodeLibrary, type NodeCategory } from '../../data/nodeLibrary';
import type { NodeTemplate, Point } from '../../models/types';
import { colors, spacing, borderRadius, typography } from '../../theme';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface NodeLibraryPanelProps {
  visible: boolean;
  onClose: () => void;
  onSelectNode?: (template: NodeTemplate, position: Point) => void;
}

// ----------------------------------------------------------------------------
// Composant carte de node
// ----------------------------------------------------------------------------

interface NodeCardProps {
  template: NodeTemplate;
  onPress: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ template, onPress }) => {
  // Infos supplémentaires selon le type
  const getSubtitle = () => {
    const parts: string[] = [];
    if (template.voltage) parts.push(`${template.voltage}V`);
    if (template.powerW) parts.push(`${template.powerW}W`);
    if (template.capacityAh) parts.push(`${template.capacityAh}Ah`);
    if (template.maxPowerW) parts.push(`${template.maxPowerW}W max`);
    return parts.join(' · ') || template.type;
  };

  return (
    <TouchableOpacity
      style={styles.nodeCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.nodeIcon}>{template.icon}</Text>
      <View style={styles.nodeInfo}>
        <Text style={styles.nodeName} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={styles.nodeSubtitle} numberOfLines={1}>
          {getSubtitle()}
        </Text>
      </View>
      <Text style={styles.addIcon}>+</Text>
    </TouchableOpacity>
  );
};

// ----------------------------------------------------------------------------
// Composant catégorie
// ----------------------------------------------------------------------------

interface CategorySectionProps {
  category: NodeCategory;
  onSelectTemplate: (template: NodeTemplate) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onSelectTemplate,
  isExpanded,
  onToggle,
}) => (
  <View style={styles.categorySection}>
    <TouchableOpacity
      style={styles.categoryHeader}
      onPress={onToggle}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryCount}>{category.templates.length}</Text>
      <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
    </TouchableOpacity>

    {isExpanded && (
      <View style={styles.templatesList}>
        {category.templates.map((template) => (
          <NodeCard
            key={template.id}
            template={template}
            onPress={() => onSelectTemplate(template)}
          />
        ))}
      </View>
    )}
  </View>
);

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const NodeLibraryPanel: React.FC<NodeLibraryPanelProps> = ({
  visible,
  onClose,
  onSelectNode,
}) => {
  const insets = useSafeAreaInsets();
  const { addNode } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['batteries', 'consumers'])
  );

  // Filtrer par recherche
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return nodeLibrary;

    const query = searchQuery.toLowerCase();
    return nodeLibrary
      .map((category) => ({
        ...category,
        templates: category.templates.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.type.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.templates.length > 0);
  }, [searchQuery]);

  // Toggle catégorie
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Sélectionner un template
  const handleSelectTemplate = useCallback((template: NodeTemplate) => {
    // Position par défaut au centre du bateau (coordonnées viewBox sailboat-30: 200x500)
    // Le centre du bateau est environ à x=100, y=250
    const position: Point = {
      x: 100 + Math.random() * 40 - 20, // 80-120 (centré avec léger décalage aléatoire)
      y: 200 + Math.random() * 100,     // 200-300 (zone cabine/cockpit)
    };

    // Créer le node à partir du template
    const nodeInput = {
      type: template.type,
      name: template.name,
      icon: template.icon,
      position,
      voltage: template.voltage,
      rotation: template.rotation ?? 0,
      locked: false,
      // Propriétés spécifiques selon le type
      ...(template.type === 'consumer' && {
        powerW: template.powerW ?? 0,
        currentA: template.currentA,
        dailyHours: template.dailyHours ?? 1,
        dutyCycle: template.dutyCycle ?? 1,
      }),
      ...(template.type === 'battery' && {
        capacityAh: template.capacityAh ?? 100,
        chemistry: template.chemistry ?? 'agm',
      }),
      ...(template.type === 'solar' && {
        maxPowerW: template.maxPowerW ?? 100,
        efficiency: template.efficiency ?? 0.7,
      }),
      ...(template.type === 'alternator' && {
        maxPowerW: template.maxPowerW ?? 50,
        efficiency: template.efficiency ?? 0.85,
      }),
      ...(template.type === 'charger' && {
        maxPowerW: template.maxPowerW ?? 500,
        inputVoltage: template.inputVoltage ?? 220,
      }),
      ...(template.type === 'inverter' && {
        maxPowerW: template.maxPowerW ?? 1000,
        outputVoltage: template.outputVoltage ?? 220,
        efficiency: template.efficiency ?? 0.9,
      }),
      ...(template.type === 'bus' && {
        maxCurrentA: template.maxCurrentA ?? 100,
        portCount: template.portCount ?? 6,
      }),
      ...(template.type === 'fuse' && {
        ratingA: template.ratingA ?? 15,
        fuseType: template.fuseType ?? 'blade',
      }),
      ...(template.type === 'switch' && {
        maxCurrentA: template.maxCurrentA ?? 30,
        isOn: true,
      }),
    };

    // Ajouter le node au projet  
    addNode(nodeInput as any);

    // Callback optionnel
    if (onSelectNode) {
      onSelectNode(template, position);
    }

    // Fermer le panneau
    onClose();
  }, [addNode, onSelectNode, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.h2}>Bibliothèque</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Recherche */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un équipement..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Liste des catégories */}
        <FlatList
          data={filteredLibrary}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CategorySection
              category={item}
              onSelectTemplate={handleSelectTemplate}
              isExpanded={expandedCategories.has(item.id)}
              onToggle={() => toggleCategory(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                Aucun équipement trouvé pour "{searchQuery}"
              </Text>
            </View>
          }
        />

        {/* Footer info */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={styles.footerText}>
            Tapez sur un équipement pour l'ajouter au schéma
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// ----------------------------------------------------------------------------
// Styles
// ----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  templatesList: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginLeft: spacing.lg,
    gap: spacing.sm,
  },
  nodeIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  nodeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default NodeLibraryPanel;
