// ============================================================================
// ElectricBoat v2.0 - Panneau de propriétés d'un node/connection
// ============================================================================

import React, { useCallback, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';
import type { ElectricalNode, Connection } from '../../models/types';
import { colors, spacing, borderRadius, typography } from '../../theme';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface PropertiesPanelProps {
  visible: boolean;
  onClose: () => void;
}

// ----------------------------------------------------------------------------
// Composant champ de propriété
// ----------------------------------------------------------------------------

interface PropertyFieldProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'numeric';
  onChangeText?: (text: string) => void;
}

const PropertyField: React.FC<PropertyFieldProps> = ({
  label,
  value,
  unit,
  editable = true,
  keyboardType = 'default',
  onChangeText,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldInputContainer}>
      {editable ? (
        <TextInput
          style={styles.fieldInput}
          value={String(value ?? '')}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder="—"
          placeholderTextColor={colors.textSecondary}
        />
      ) : (
        <Text style={styles.fieldValue}>{value ?? '—'}</Text>
      )}
      {unit && <Text style={styles.fieldUnit}>{unit}</Text>}
    </View>
  </View>
);

// ----------------------------------------------------------------------------
// Panel pour un Node
// ----------------------------------------------------------------------------

interface NodePropertiesProps {
  node: ElectricalNode;
  onUpdate: (updates: Partial<ElectricalNode>) => void;
  onDelete: () => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({
  node,
  onUpdate,
  onDelete,
}) => {
  const handleNameChange = (name: string) => {
    onUpdate({ name });
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Icône et type */}
      <View style={styles.headerSection}>
        <Text style={styles.nodeIcon}>{node.icon}</Text>
        <View>
          <Text style={styles.nodeType}>{node.type.toUpperCase()}</Text>
          <Text style={styles.nodeId}>ID: {node.id.substring(0, 8)}</Text>
        </View>
      </View>

      {/* Nom */}
      <PropertyField
        label="Nom"
        value={node.name}
        onChangeText={handleNameChange}
      />

      {/* Voltage */}
      <PropertyField
        label="Tension"
        value={node.voltage}
        unit="V"
        editable={false}
      />

      {/* Propriétés spécifiques selon le type */}
      {node.type === 'consumer' && (
        <>
          <PropertyField
            label="Puissance"
            value={node.powerW}
            unit="W"
            keyboardType="numeric"
            onChangeText={(v) => onUpdate({ powerW: Number(v) || 0 })}
          />
          <PropertyField
            label="Courant"
            value={node.currentA?.toFixed(1)}
            unit="A"
            editable={false}
          />
          <PropertyField
            label="Utilisation quotidienne"
            value={node.dailyHours}
            unit="h/jour"
            keyboardType="numeric"
            onChangeText={(v) => onUpdate({ dailyHours: Number(v) || 0 })}
          />
        </>
      )}

      {node.type === 'battery' && (
        <>
          <PropertyField
            label="Capacité"
            value={node.capacityAh}
            unit="Ah"
            keyboardType="numeric"
            onChangeText={(v) => onUpdate({ capacityAh: Number(v) || 0 })}
          />
          <PropertyField
            label="Chimie"
            value={node.chemistry}
            editable={false}
          />
          <PropertyField
            label="DoD (Profondeur de décharge)"
            value={node.dod ? `${(node.dod * 100).toFixed(0)}%` : undefined}
            editable={false}
          />
        </>
      )}

      {node.type === 'solar' && (
        <>
          <PropertyField
            label="Puissance crête"
            value={node.maxPowerW}
            unit="Wc"
            keyboardType="numeric"
            onChangeText={(v) => onUpdate({ maxPowerW: Number(v) || 0 })}
          />
          <PropertyField
            label="Efficacité"
            value={node.efficiency ? `${(node.efficiency * 100).toFixed(0)}%` : undefined}
            editable={false}
          />
        </>
      )}

      {node.type === 'alternator' && (
        <>
          <PropertyField
            label="Puissance max"
            value={node.maxPowerW}
            unit="W"
            keyboardType="numeric"
            onChangeText={(v) => onUpdate({ maxPowerW: Number(v) || 0 })}
          />
          <PropertyField
            label="Courant de charge"
            value={node.chargeCurrentA}
            unit="A"
            keyboardType="numeric"
            onChangeText={(v) => onUpdate({ chargeCurrentA: Number(v) || 0 })}
          />
        </>
      )}

      {/* Position */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Position</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <PropertyField
            label="X"
            value={Math.round(node.position.x)}
            keyboardType="numeric"
            onChangeText={(v) => 
              onUpdate({ position: { ...node.position, x: Number(v) || 0 } })
            }
          />
        </View>
        <View style={styles.halfField}>
          <PropertyField
            label="Y"
            value={Math.round(node.position.y)}
            keyboardType="numeric"
            onChangeText={(v) => 
              onUpdate({ position: { ...node.position, y: Number(v) || 0 } })
            }
          />
        </View>
      </View>

      {/* Options */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Options</Text>
      </View>
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => onUpdate({ locked: !node.locked })}
      >
        <Text style={styles.toggleLabel}>Verrouiller la position</Text>
        <Text style={styles.toggleValue}>{node.locked ? '🔒' : '🔓'}</Text>
      </TouchableOpacity>

      {/* Supprimer */}
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>🗑️ Supprimer cet équipement</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ----------------------------------------------------------------------------
// Panel pour une Connection
// ----------------------------------------------------------------------------

interface ConnectionPropertiesProps {
  connection: Connection;
  fromNode?: ElectricalNode;
  toNode?: ElectricalNode;
  onUpdate: (updates: Partial<Connection>) => void;
  onDelete: () => void;
}

const ConnectionProperties: React.FC<ConnectionPropertiesProps> = ({
  connection,
  fromNode,
  toNode,
  onUpdate,
  onDelete,
}) => (
  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
    {/* Connexion */}
    <View style={styles.connectionHeader}>
      <View style={styles.connectionNode}>
        <Text style={styles.connectionIcon}>{fromNode?.icon || '?'}</Text>
        <Text style={styles.connectionName} numberOfLines={1}>
          {fromNode?.name || 'Inconnu'}
        </Text>
      </View>
      <Text style={styles.connectionArrow}>→</Text>
      <View style={styles.connectionNode}>
        <Text style={styles.connectionIcon}>{toNode?.icon || '?'}</Text>
        <Text style={styles.connectionName} numberOfLines={1}>
          {toNode?.name || 'Inconnu'}
        </Text>
      </View>
    </View>

    {/* Propriétés du câble */}
    <PropertyField
      label="Section du câble"
      value={connection.sectionMm2}
      unit="mm²"
      keyboardType="numeric"
      onChangeText={(v) => onUpdate({ sectionMm2: Number(v) || 1 })}
    />

    <PropertyField
      label="Longueur"
      value={connection.lengthM.toFixed(1)}
      unit="m"
      editable={false}
    />

    {/* Calculs */}
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Analyse</Text>
    </View>

    <PropertyField
      label="Chute de tension"
      value={connection.voltageDrop?.toFixed(2)}
      unit="%"
      editable={false}
    />

    {connection.voltageDrop && connection.voltageDrop > 3 && (
      <View style={styles.warningBox}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Chute de tension trop importante ({connection.voltageDrop.toFixed(1)}%).
          Augmentez la section du câble.
        </Text>
      </View>
    )}

    <PropertyField
      label="Fusible recommandé"
      value={connection.fuseRating}
      unit="A"
      editable={false}
    />

    {/* Type de câble */}
    <PropertyField
      label="Type de câble"
      value={connection.cableType || 'standard'}
      editable={false}
    />

    {/* Supprimer */}
    <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
      <Text style={styles.deleteButtonText}>🗑️ Supprimer ce câble</Text>
    </TouchableOpacity>
  </ScrollView>
);

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { selection, clearSelection } = useEditorStore();
  const { project, updateNode, removeNode, updateConnection, removeConnection } = useProjectStore();

  // Récupérer l'élément sélectionné
  const selectedNode = useMemo(() => {
    if (!selection || selection.type !== 'node') return undefined;
    return project.nodes.find((n) => n.id === selection.id);
  }, [selection, project.nodes]);

  const selectedConnection = useMemo(() => {
    if (!selection || selection.type !== 'connection') return undefined;
    return project.connections.find((c) => c.id === selection.id);
  }, [selection, project.connections]);

  const fromNode = useMemo(() => {
    if (!selectedConnection) return undefined;
    return project.nodes.find((n) => n.id === selectedConnection.fromNodeId);
  }, [selectedConnection, project.nodes]);

  const toNode = useMemo(() => {
    if (!selectedConnection) return undefined;
    return project.nodes.find((n) => n.id === selectedConnection.toNodeId);
  }, [selectedConnection, project.nodes]);

  // Handlers
  const handleUpdateNode = useCallback((updates: Partial<ElectricalNode>) => {
    if (selectedNode) {
      updateNode(selectedNode.id, updates);
    }
  }, [selectedNode, updateNode]);

  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      removeNode(selectedNode.id);
      clearSelection();
      onClose();
    }
  }, [selectedNode, removeNode, clearSelection, onClose]);

  const handleUpdateConnection = useCallback((updates: Partial<Connection>) => {
    if (selectedConnection) {
      updateConnection(selectedConnection.id, updates);
    }
  }, [selectedConnection, updateConnection]);

  const handleDeleteConnection = useCallback(() => {
    if (selectedConnection) {
      removeConnection(selectedConnection.id);
      clearSelection();
      onClose();
    }
  }, [selectedConnection, removeConnection, clearSelection, onClose]);

  // Titre
  const title = selectedNode
    ? 'Propriétés'
    : selectedConnection
    ? 'Câble'
    : 'Propriétés';

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
          <Text style={typography.h2}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        {selectedNode ? (
          <NodeProperties
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
          />
        ) : selectedConnection ? (
          <ConnectionProperties
            connection={selectedConnection}
            fromNode={fromNode}
            toNode={toNode}
            onUpdate={handleUpdateConnection}
            onDelete={handleDeleteConnection}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              Sélectionnez un équipement ou un câble pour voir ses propriétés
            </Text>
          </View>
        )}
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  nodeIcon: {
    fontSize: 40,
  },
  nodeType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  nodeId: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  fieldValue: {
    flex: 1,
    height: 44,
    lineHeight: 44,
    fontSize: 16,
    color: colors.text,
  },
  fieldUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.text,
  },
  toggleValue: {
    fontSize: 20,
  },
  deleteButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  connectionNode: {
    alignItems: 'center',
    flex: 1,
  },
  connectionIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  connectionName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  connectionArrow: {
    fontSize: 24,
    color: colors.primary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
    lineHeight: 18,
  },
});

export default PropertiesPanel;
