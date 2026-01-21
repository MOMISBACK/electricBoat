// ============================================================================
// ElectricBoat v2.0 - Panneau d'analyse énergétique
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
import { 
  getTotalDailyConsumptionAh, 
  getNodeDailyWh,
  getTotalInstantPowerW,
} from '../../utils/calculations/power';
import {
  getRequiredBatteryCapacityAh,
  getTotalBatteryCapacityAh,
  getEstimatedAutonomyDays,
} from '../../utils/calculations/battery';
import {
  analyzeAllCables,
  getTotalPowerLoss,
  getOverloadedCables,
  getHighVoltageDropCables,
} from '../../utils/calculations/cables';
import { validateCircuit } from '../../utils/calculations/validation';
import { colors, spacing, borderRadius, typography } from '../../theme';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface AnalysisPanelProps {
  visible: boolean;
  onClose: () => void;
}

// ----------------------------------------------------------------------------
// Composant de statistique
// ----------------------------------------------------------------------------

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'ok' | 'warning' | 'error';
  icon?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, unit, status = 'ok', icon }) => {
  const statusColor = status === 'error' ? colors.error : 
                      status === 'warning' ? colors.warning : colors.success;
  
  return (
    <View style={styles.statItem}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statValueRow}>
          <Text style={[styles.statValue, { color: statusColor }]}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </Text>
          {unit && <Text style={styles.statUnit}>{unit}</Text>}
        </View>
      </View>
    </View>
  );
};

// ----------------------------------------------------------------------------
// Section de carte
// ----------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

// ----------------------------------------------------------------------------
// Jauge de progression
// ----------------------------------------------------------------------------

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  thresholds?: { warning: number; error: number };
}

const Gauge: React.FC<GaugeProps> = ({ value, max, label, unit, thresholds }) => {
  const percentage = Math.min((value / max) * 100, 100);
  let barColor: string = colors.success;
  
  if (thresholds) {
    if (percentage >= thresholds.error) {
      barColor = colors.error;
    } else if (percentage >= thresholds.warning) {
      barColor = colors.warning;
    }
  }
  
  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeHeader}>
        <Text style={styles.gaugeLabel}>{label}</Text>
        <Text style={styles.gaugeValue}>
          {value.toFixed(1)} / {max.toFixed(0)} {unit}
        </Text>
      </View>
      <View style={styles.gaugeTrack}>
        <View 
          style={[
            styles.gaugeBar, 
            { width: `${percentage}%`, backgroundColor: barColor }
          ]} 
        />
      </View>
      <Text style={styles.gaugePercent}>{percentage.toFixed(0)}%</Text>
    </View>
  );
};

// ----------------------------------------------------------------------------
// Liste d'alertes
// ----------------------------------------------------------------------------

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
}

interface AlertListProps {
  alerts: Alert[];
}

const AlertList: React.FC<AlertListProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <View style={styles.noAlerts}>
        <Text style={styles.noAlertsIcon}>✓</Text>
        <Text style={styles.noAlertsText}>Aucun problème détecté</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.alertList}>
      {alerts.map((alert) => (
        <View 
          key={alert.id} 
          style={[
            styles.alertItem,
            alert.type === 'error' && styles.alertError,
            alert.type === 'warning' && styles.alertWarning,
          ]}
        >
          <Text style={styles.alertIcon}>
            {alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
          </Text>
          <Text style={styles.alertMessage}>{alert.message}</Text>
        </View>
      ))}
    </View>
  );
};

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { project } = useProjectStore();
  const { nodes, connections, settings } = project;

  // Calculs de consommation
  const consumers = useMemo(() => 
    nodes.filter(n => n.type === 'consumer'),
    [nodes]
  );
  
  const dailyConsumptionAh = useMemo(() => 
    getTotalDailyConsumptionAh(consumers),
    [consumers]
  );
  
  const dailyConsumptionWh = useMemo(() => 
    consumers.reduce((sum, c) => sum + getNodeDailyWh(c), 0),
    [consumers]
  );
  
  const installedPowerW = useMemo(() => 
    getTotalInstantPowerW(consumers),
    [consumers]
  );

  // Calculs de batterie
  const batteries = useMemo(() => 
    nodes.filter(n => n.type === 'battery'),
    [nodes]
  );
  
  const totalBatteryAh = useMemo(() => 
    getTotalBatteryCapacityAh(batteries),
    [batteries]
  );
  
  const requiredBatteryAh = useMemo(() => 
    getRequiredBatteryCapacityAh(
      dailyConsumptionAh,
      settings.daysAutonomy,
      settings.defaultDodLead // Utilise DoD plomb par défaut
    ),
    [dailyConsumptionAh, settings]
  );
  
  const usableBatteryAh = useMemo(() => 
    totalBatteryAh * settings.defaultDodLead,
    [totalBatteryAh, settings]
  );
  
  const autonomyDays = useMemo(() => 
    getEstimatedAutonomyDays(usableBatteryAh, dailyConsumptionAh),
    [usableBatteryAh, dailyConsumptionAh]
  );

  // Calculs solaires
  const solarPanels = useMemo(() => 
    nodes.filter(n => n.type === 'solar'),
    [nodes]
  );
  
  const totalSolarW = useMemo(() => 
    solarPanels.reduce((sum, p) => sum + ((p as any).maxPowerW ?? 0), 0),
    [solarPanels]
  );
  
  const dailySolarWh = useMemo(() => 
    totalSolarW * settings.sunHoursPerDay * settings.defaultSolarEfficiency,
    [totalSolarW, settings]
  );

  // Analyse des câbles
  const cableAnalyses = useMemo(() => 
    analyzeAllCables(connections, nodes),
    [connections, nodes]
  );
  
  const totalPowerLoss = useMemo(() => 
    getTotalPowerLoss(cableAnalyses),
    [cableAnalyses]
  );
  
  const overloadedCables = useMemo(() => 
    getOverloadedCables(cableAnalyses),
    [cableAnalyses]
  );
  
  const highDropCables = useMemo(() => 
    getHighVoltageDropCables(cableAnalyses),
    [cableAnalyses]
  );

  // Validation du circuit
  const validation = useMemo(() => 
    validateCircuit(nodes, connections),
    [nodes, connections]
  );

  // Générer les alertes
  const alerts: Alert[] = useMemo(() => {
    const result: Alert[] = [];
    
    // Alertes de validation
    validation.errors.forEach((err, i) => {
      result.push({ id: `err-${i}`, type: 'error', message: err.message });
    });
    
    validation.warnings.forEach((warn, i) => {
      result.push({ id: `warn-${i}`, type: 'warning', message: warn.message });
    });
    
    // Alertes câbles
    overloadedCables.forEach((cable, i) => {
      result.push({
        id: `cable-over-${i}`,
        type: 'error',
        message: `Câble en surcharge: ${cable.currentA}A (chute: ${cable.voltageDropPercent.toFixed(1)}%)`,
      });
    });
    
    highDropCables.forEach((cable, i) => {
      if (cable.status !== 'overload') {
        result.push({
          id: `cable-drop-${i}`,
          type: 'warning',
          message: `Chute de tension excessive: ${cable.voltageDropPercent.toFixed(1)}%`,
        });
      }
    });
    
    // Alertes capacité
    if (totalBatteryAh < requiredBatteryAh) {
      result.push({
        id: 'battery-capacity',
        type: 'warning',
        message: `Capacité batterie insuffisante: ${totalBatteryAh}Ah < ${requiredBatteryAh.toFixed(0)}Ah requis`,
      });
    }
    
    // Alerte solaire
    if (dailySolarWh < dailyConsumptionWh * 0.5 && solarPanels.length > 0) {
      result.push({
        id: 'solar-low',
        type: 'info',
        message: `Production solaire faible: ${dailySolarWh.toFixed(0)}Wh/j vs ${dailyConsumptionWh.toFixed(0)}Wh/j consommés`,
      });
    }
    
    return result;
  }, [validation, overloadedCables, highDropCables, totalBatteryAh, requiredBatteryAh, dailySolarWh, dailyConsumptionWh, solarPanels]);

  // Bilan énergétique
  const energyBalance = dailySolarWh - dailyConsumptionWh;
  const balanceStatus = energyBalance >= 0 ? 'ok' : energyBalance > -dailyConsumptionWh * 0.2 ? 'warning' : 'error';

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
          <Text style={typography.h2}>Analyse énergétique</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Bilan global */}
          <SectionCard title="Bilan énergétique" icon="⚡">
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Production</Text>
                <Text style={[styles.balanceValue, { color: colors.success }]}>
                  +{dailySolarWh.toFixed(0)} Wh/j
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Consommation</Text>
                <Text style={[styles.balanceValue, { color: colors.warning }]}>
                  -{dailyConsumptionWh.toFixed(0)} Wh/j
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Bilan</Text>
                <Text style={[
                  styles.balanceValue, 
                  { color: balanceStatus === 'ok' ? colors.success : 
                           balanceStatus === 'warning' ? colors.warning : colors.error }
                ]}>
                  {energyBalance >= 0 ? '+' : ''}{energyBalance.toFixed(0)} Wh/j
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Alertes */}
          <SectionCard title="Alertes" icon="🔔">
            <AlertList alerts={alerts} />
          </SectionCard>

          {/* Consommation */}
          <SectionCard title="Consommation" icon="💡">
            <StatItem 
              icon="⚡" 
              label="Puissance installée" 
              value={installedPowerW} 
              unit="W" 
            />
            <StatItem 
              icon="📊" 
              label="Consommation journalière" 
              value={dailyConsumptionWh} 
              unit="Wh/j" 
            />
            <StatItem 
              icon="🔋" 
              label="Consommation en Ah" 
              value={dailyConsumptionAh} 
              unit="Ah/j" 
            />
            <StatItem 
              icon="📱" 
              label="Appareils" 
              value={consumers.length} 
            />
          </SectionCard>

          {/* Batteries */}
          <SectionCard title="Batteries" icon="🔋">
            <Gauge 
              value={totalBatteryAh}
              max={requiredBatteryAh}
              label="Capacité vs besoin"
              unit="Ah"
              thresholds={{ warning: 70, error: 50 }}
            />
            <StatItem 
              icon="🔋" 
              label="Capacité totale" 
              value={totalBatteryAh} 
              unit="Ah" 
            />
            <StatItem 
              icon="📅" 
              label="Autonomie estimée" 
              value={autonomyDays} 
              unit="jours"
              status={autonomyDays >= settings.daysAutonomy ? 'ok' : 'warning'}
            />
            <StatItem 
              icon="🎯" 
              label="Capacité recommandée" 
              value={requiredBatteryAh} 
              unit="Ah" 
            />
          </SectionCard>

          {/* Solaire */}
          <SectionCard title="Production solaire" icon="☀️">
            <Gauge 
              value={dailySolarWh}
              max={dailyConsumptionWh}
              label="Production vs conso"
              unit="Wh/j"
            />
            <StatItem 
              icon="☀️" 
              label="Puissance crête" 
              value={totalSolarW} 
              unit="Wc" 
            />
            <StatItem 
              icon="⚡" 
              label="Production estimée" 
              value={dailySolarWh} 
              unit="Wh/j" 
            />
            <StatItem 
              icon="🔢" 
              label="Panneaux" 
              value={solarPanels.length} 
            />
          </SectionCard>

          {/* Câblage */}
          <SectionCard title="Câblage" icon="🔌">
            <StatItem 
              icon="🔌" 
              label="Connexions" 
              value={connections.length} 
            />
            <StatItem 
              icon="🔥" 
              label="Pertes totales" 
              value={totalPowerLoss} 
              unit="W"
              status={totalPowerLoss > 10 ? 'warning' : 'ok'}
            />
            <StatItem 
              icon="⚠️" 
              label="Câbles en alerte" 
              value={overloadedCables.length + highDropCables.length}
              status={overloadedCables.length > 0 ? 'error' : 
                      highDropCables.length > 0 ? 'warning' : 'ok'}
            />
          </SectionCard>

          {/* Résumé du circuit */}
          <SectionCard title="Circuit" icon="🔧">
            <StatItem 
              icon="📊" 
              label="Équipements" 
              value={nodes.length} 
            />
            <StatItem 
              icon="✓" 
              label="Statut" 
              value={validation.isValid ? 'Valide' : 'Erreurs'}
              status={validation.isValid ? 'ok' : 'error'}
            />
          </SectionCard>
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
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  statIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  statContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textMuted,
  },
  gauge: {
    marginBottom: spacing.sm,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  gaugeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gaugeValue: {
    fontSize: 12,
    color: colors.textMuted,
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeBar: {
    height: '100%',
    borderRadius: 4,
  },
  gaugePercent: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertList: {
    gap: spacing.xs,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceHighlight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  alertError: {
    backgroundColor: colors.error + '20',
  },
  alertWarning: {
    backgroundColor: colors.warning + '20',
  },
  alertIcon: {
    fontSize: 14,
  },
  alertMessage: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  noAlerts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  noAlertsIcon: {
    fontSize: 20,
    color: colors.success,
  },
  noAlertsText: {
    fontSize: 14,
    color: colors.success,
  },
});

export default AnalysisPanel;
