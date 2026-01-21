// ============================================================================
// ElectricBoat v2.0 - Panneau de recommandation de fusibles
// ============================================================================

import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProjectStore } from '../../store/useProjectStore';
import type { Connection, ElectricalNode, CableAnalysis } from '../../models/types';
import { 
  CABLE_STANDARDS, 
  getRecommendedFuse, 
  getCableSpecBySection 
} from '../../data/cableStandards';
import { analyzeAllCables } from '../../utils/calculations/cables';
import { colors, spacing, borderRadius, typography } from '../../theme';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface FuseRecommendationPanelProps {
  visible: boolean;
  onClose: () => void;
}

interface ConnectionFuseInfo {
  connection: Connection;
  fromNode: ElectricalNode | undefined;
  toNode: ElectricalNode | undefined;
  analysis: CableAnalysis | undefined;
  recommendedFuse: number;
  maxCableCapacity: number;
  status: 'ok' | 'warning' | 'oversized';
}

// ----------------------------------------------------------------------------
// Carte de fusible
// ----------------------------------------------------------------------------

interface FuseCardProps {
  info: ConnectionFuseInfo;
}

const FuseCard: React.FC<FuseCardProps> = ({ info }) => {
  const { connection, fromNode, toNode, analysis, recommendedFuse, maxCableCapacity, status } = info;
  
  const statusColor = status === 'ok' ? colors.success : 
                      status === 'warning' ? colors.warning : colors.info;
  const statusIcon = status === 'ok' ? '✓' : status === 'warning' ? '⚠️' : 'ℹ️';
  const statusText = status === 'ok' ? 'Optimal' : 
                     status === 'warning' ? 'Attention' : 'Surdimensionné';
  
  const fromName = fromNode?.name ?? 'Inconnu';
  const toName = toNode?.name ?? 'Inconnu';
  
  return (
    <View style={[styles.fuseCard, { borderLeftColor: statusColor }]}>
      {/* Header */}
      <View style={styles.fuseHeader}>
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionLabel}>Liaison</Text>
          <Text style={styles.connectionNames} numberOfLines={1}>
            {fromName} → {toName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
      
      {/* Détails */}
      <View style={styles.fuseDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Section câble</Text>
          <Text style={styles.detailValue}>{connection.sectionMm2} mm²</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Capacité max câble</Text>
          <Text style={styles.detailValue}>{maxCableCapacity} A</Text>
        </View>
        
        {analysis && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Courant estimé</Text>
            <Text style={styles.detailValue}>{analysis.currentA.toFixed(1)} A</Text>
          </View>
        )}
        
        <View style={[styles.detailRow, styles.fuseRow]}>
          <Text style={styles.detailLabel}>Fusible recommandé</Text>
          <View style={styles.fuseRecommendation}>
            <Text style={styles.fuseValue}>{recommendedFuse} A</Text>
          </View>
        </View>
      </View>
      
      {/* Notes */}
      {status === 'warning' && analysis && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ⚠️ Le courant estimé ({analysis.currentA.toFixed(1)}A) approche la limite du câble.
            Envisagez une section plus grande.
          </Text>
        </View>
      )}
      
      {status === 'oversized' && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ℹ️ Le câble est surdimensionné pour cette application. 
            Une section plus petite pourrait convenir.
          </Text>
        </View>
      )}
    </View>
  );
};

// ----------------------------------------------------------------------------
// Liste des fusibles standards
// ----------------------------------------------------------------------------

const STANDARD_FUSES = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 200];

const StandardFusesList: React.FC = () => (
  <View style={styles.standardFuses}>
    <Text style={styles.sectionTitle}>Calibres de fusibles standards</Text>
    <View style={styles.fuseChips}>
      {STANDARD_FUSES.map((fuse) => (
        <View key={fuse} style={styles.fuseChip}>
          <Text style={styles.fuseChipText}>{fuse}A</Text>
        </View>
      ))}
    </View>
  </View>
);

// ----------------------------------------------------------------------------
// Tableau des sections de câbles
// ----------------------------------------------------------------------------

const CableSectionsTable: React.FC = () => (
  <View style={styles.tableContainer}>
    <Text style={styles.sectionTitle}>Capacités des câbles (cuivre)</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, styles.headerCell]}>Section</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Max (A)</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Fusible</Text>
      </View>
      {CABLE_STANDARDS.map((spec) => (
        <View key={spec.sectionMm2} style={styles.tableRow}>
          <Text style={styles.tableCell}>{spec.sectionMm2} mm²</Text>
          <Text style={styles.tableCell}>{spec.maxCurrentA} A</Text>
          <Text style={styles.tableCell}>{spec.recommendedFuseA} A</Text>
        </View>
      ))}
    </View>
  </View>
);

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const FuseRecommendationPanel: React.FC<FuseRecommendationPanelProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { project } = useProjectStore();
  const { nodes, connections } = project;
  
  // Analyses des câbles
  const cableAnalyses = useMemo(() => 
    analyzeAllCables(connections, nodes),
    [connections, nodes]
  );
  
  // Map des analyses par ID
  const analysisMap = useMemo(() => {
    const map = new Map<string, CableAnalysis>();
    cableAnalyses.forEach(a => map.set(a.connectionId, a));
    return map;
  }, [cableAnalyses]);
  
  // Map des nodes par ID
  const nodeMap = useMemo(() => {
    const map = new Map<string, ElectricalNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);
  
  // Générer les infos de fusibles pour chaque connexion
  const fuseInfos: ConnectionFuseInfo[] = useMemo(() => {
    return connections.map(conn => {
      const analysis = analysisMap.get(conn.id);
      const fromNode = nodeMap.get(conn.fromNodeId);
      const toNode = nodeMap.get(conn.toNodeId);
      
      const cableSpec = getCableSpecBySection(conn.sectionMm2);
      const maxCableCapacity = cableSpec?.maxCurrentA ?? 0;
      
      // Courant pour calcul du fusible
      const current = analysis?.currentA ?? 0;
      const recommendedFuse = getRecommendedFuse(current);
      
      // Déterminer le statut
      let status: 'ok' | 'warning' | 'oversized' = 'ok';
      if (current > maxCableCapacity * 0.8) {
        status = 'warning';
      } else if (current < maxCableCapacity * 0.3 && conn.sectionMm2 > 1.5) {
        status = 'oversized';
      }
      
      return {
        connection: conn,
        fromNode,
        toNode,
        analysis,
        recommendedFuse,
        maxCableCapacity,
        status,
      };
    });
  }, [connections, analysisMap, nodeMap]);

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
          <Text style={typography.h2}>Recommandation fusibles</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Liste des connexions */}
          {fuseInfos.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Analyse des {fuseInfos.length} connexion{fuseInfos.length > 1 ? 's' : ''}
              </Text>
              {fuseInfos.map((info) => (
                <FuseCard key={info.connection.id} info={info} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔌</Text>
              <Text style={styles.emptyText}>Aucune connexion dans le circuit</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des câbles entre vos équipements pour voir les recommandations
              </Text>
            </View>
          )}
          
          {/* Référence: Fusibles standards */}
          <StandardFusesList />
          
          {/* Référence: Sections de câbles */}
          <CableSectionsTable />
        </ScrollView>
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
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fuseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  fuseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  connectionNames: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  statusIcon: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.surface,
  },
  fuseDetails: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  fuseRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fuseRecommendation: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  fuseValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  noteContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceHighlight,
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  standardFuses: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  fuseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  fuseChip: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  fuseChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  tableContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default FuseRecommendationPanel;
