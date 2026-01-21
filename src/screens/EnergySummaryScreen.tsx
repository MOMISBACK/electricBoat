import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import {
  cableOverCurrentAlerts,
  DEFAULT_DOD_LEAD,
  DEFAULT_DOD_LIFEPO4,
  DEFAULT_SOLAR_EFFICIENCY,
  DEFAULT_SUN_HOURS,
  deviceCurrent,
  deviceDailyAh,
  requiredBatteryCapacity,
  totalBatteryCapacityAh,
  totalDailyAh,
  totalInstantPowerW,
  totalSolarDailyAh,
} from '../utils/calculations';
import { Card, StatCard, StatRow, SegmentedControl } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

const TABS = [
  { key: 'overview', label: 'Vue générale', icon: '📊' },
  { key: 'devices', label: 'Appareils', icon: '⚡' },
  { key: 'alerts', label: 'Alertes', icon: '⚠️' },
];

export function EnergySummaryScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const project = useStore((state) => state.project);
  
  const dailyAh = totalDailyAh(project.devices);
  const instantPower = totalInstantPowerW(project.devices);
  const solarAh = totalSolarDailyAh(project.sources, DEFAULT_SUN_HOURS);
  const batteryInstalledAh = totalBatteryCapacityAh(project.sources);

  const daysAutonomy = 2;
  const requiredLead = requiredBatteryCapacity(dailyAh, daysAutonomy, DEFAULT_DOD_LEAD);
  const requiredLife = requiredBatteryCapacity(dailyAh, daysAutonomy, DEFAULT_DOD_LIFEPO4);

  const cableAlerts = cableOverCurrentAlerts(project.cables, project.devices);
  const batteryAlert = batteryInstalledAh > 0 && batteryInstalledAh < requiredLead;
  const solarAlert = solarAh > 0 && solarAh < dailyAh;
  const productionDeficit = dailyAh - solarAh;

  const alertCount = (batteryAlert ? 1 : 0) + (solarAlert ? 1 : 0) + cableAlerts.length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabContainer}>
        <SegmentedControl
          segments={TABS}
          selectedKey={activeTab}
          onSelect={setActiveTab}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <>
            {/* Main Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                label="Consommation"
                value={dailyAh}
                unit="Ah/j"
                icon="⚡"
                variant={dailyAh > 200 ? 'warning' : 'default'}
              />
              <StatCard
                label="Puissance max"
                value={instantPower}
                unit="W"
                icon="🔌"
              />
            </View>

            {/* Battery Requirements */}
            <Card title="Batteries requises" icon="🔋" style={styles.card}>
              <View style={styles.batteryComparison}>
                <View style={styles.batteryOption}>
                  <Text style={styles.batteryType}>Plomb</Text>
                  <Text style={styles.batteryValue}>{requiredLead.toFixed(0)}</Text>
                  <Text style={styles.batteryUnit}>Ah</Text>
                  <Text style={styles.batteryDoD}>DoD {DEFAULT_DOD_LEAD * 100}%</Text>
                </View>
                <View style={styles.batteryDivider} />
                <View style={styles.batteryOption}>
                  <Text style={styles.batteryType}>LiFePO4</Text>
                  <Text style={[styles.batteryValue, { color: colors.success }]}>
                    {requiredLife.toFixed(0)}
                  </Text>
                  <Text style={styles.batteryUnit}>Ah</Text>
                  <Text style={styles.batteryDoD}>DoD {DEFAULT_DOD_LIFEPO4 * 100}%</Text>
                </View>
              </View>
              <View style={styles.autonomyBadge}>
                <Text style={styles.autonomyText}>
                  Autonomie: {daysAutonomy} jours
                </Text>
              </View>
            </Card>

            {/* Solar Production */}
            <Card title="Production solaire" icon="☀️" style={styles.card}>
              <View style={styles.solarRow}>
                <View>
                  <Text style={styles.solarValue}>{solarAh.toFixed(1)} Ah/j</Text>
                  <Text style={styles.solarHypothesis}>
                    {DEFAULT_SUN_HOURS}h soleil · {DEFAULT_SOLAR_EFFICIENCY * 100}% eff.
                  </Text>
                </View>
                <View style={[
                  styles.balanceBadge,
                  productionDeficit > 0 ? styles.balanceNegative : styles.balancePositive,
                ]}>
                  <Text style={styles.balanceText}>
                    {productionDeficit > 0 ? '−' : '+'}{Math.abs(productionDeficit).toFixed(1)} Ah/j
                  </Text>
                </View>
              </View>
            </Card>

            {/* Installed capacity */}
            {batteryInstalledAh > 0 && (
              <Card title="Capacité installée" icon="🔋" style={styles.card}>
                <StatRow label="Batteries" value={batteryInstalledAh} unit="Ah" />
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(100, (batteryInstalledAh / requiredLead) * 100)}%`,
                        backgroundColor:
                          batteryInstalledAh >= requiredLead
                            ? colors.success
                            : colors.warning,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {batteryInstalledAh >= requiredLead
                    ? '✓ Capacité suffisante'
                    : `${(requiredLead - batteryInstalledAh).toFixed(0)} Ah manquants`}
                </Text>
              </Card>
            )}

            {/* Hypotheses */}
            <Card title="Hypothèses de calcul" icon="📋" variant="outlined" style={styles.card}>
              <StatRow label="DoD Plomb" value={DEFAULT_DOD_LEAD * 100} unit="%" variant="muted" />
              <StatRow label="DoD LiFePO4" value={DEFAULT_DOD_LIFEPO4 * 100} unit="%" variant="muted" />
              <StatRow label="Ensoleillement" value={DEFAULT_SUN_HOURS} unit="h/j" variant="muted" />
              <StatRow
                label="Efficacité solaire"
                value={DEFAULT_SOLAR_EFFICIENCY * 100}
                unit="%"
                variant="muted"
              />
            </Card>
          </>
        )}

        {activeTab === 'devices' && (
          <>
            {project.devices.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⚡</Text>
                <Text style={styles.emptyText}>Aucun appareil</Text>
              </View>
            ) : (
              project.devices.map((device) => {
                const current = deviceCurrent(device);
                const daily = deviceDailyAh(device);
                return (
                  <Card key={device.id} style={styles.deviceCard}>
                    <View style={styles.deviceHeader}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceVoltage}>{device.voltage}V</Text>
                    </View>
                    <View style={styles.deviceStats}>
                      <View style={styles.deviceStat}>
                        <Text style={styles.deviceStatValue}>
                          {device.powerW ? `${device.powerW}W` : `${device.currentA}A`}
                        </Text>
                        <Text style={styles.deviceStatLabel}>Puissance</Text>
                      </View>
                      <View style={styles.deviceStat}>
                        <Text style={styles.deviceStatValue}>{current.toFixed(1)}A</Text>
                        <Text style={styles.deviceStatLabel}>Courant</Text>
                      </View>
                      <View style={styles.deviceStat}>
                        <Text style={styles.deviceStatValue}>{daily.toFixed(1)}</Text>
                        <Text style={styles.deviceStatLabel}>Ah/jour</Text>
                      </View>
                    </View>
                    <View style={styles.deviceMeta}>
                      <Text style={styles.deviceMetaText}>
                        {device.dailyHours}h/j · {Math.round(device.dutyCycle * 100)}% duty
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}

        {activeTab === 'alerts' && (
          <>
            {alertCount === 0 ? (
              <View style={styles.successState}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>Tout est en ordre</Text>
                <Text style={styles.successText}>
                  Aucune alerte critique détectée
                </Text>
              </View>
            ) : (
              <>
                {batteryAlert && (
                  <Card style={[styles.alertCard, styles.alertWarning]}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>⚠️</Text>
                      <Text style={styles.alertTitle}>Batterie insuffisante</Text>
                    </View>
                    <Text style={styles.alertMessage}>
                      Capacité installée ({batteryInstalledAh} Ah) inférieure au minimum
                      requis ({requiredLead.toFixed(0)} Ah pour plomb).
                    </Text>
                  </Card>
                )}

                {solarAlert && (
                  <Card style={[styles.alertCard, styles.alertWarning]}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>⚠️</Text>
                      <Text style={styles.alertTitle}>Production insuffisante</Text>
                    </View>
                    <Text style={styles.alertMessage}>
                      Production solaire ({solarAh.toFixed(1)} Ah/j) inférieure à la
                      consommation ({dailyAh.toFixed(1)} Ah/j).
                    </Text>
                  </Card>
                )}

                {cableAlerts.map((alert) => (
                  <Card key={alert.cableId} style={[styles.alertCard, styles.alertError]}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>❌</Text>
                      <Text style={styles.alertTitle}>Surintensité câble</Text>
                    </View>
                    <Text style={styles.alertMessage}>
                      Courant ({alert.currentA.toFixed(1)} A) dépasse la capacité du câble.
                    </Text>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  
  // Battery comparison
  batteryComparison: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  batteryDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  batteryType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  batteryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  batteryUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  batteryDoD: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  autonomyBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  autonomyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Solar
  solarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solarValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.warning,
  },
  solarHypothesis: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  balanceBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  balancePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  balanceNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Progress
  progressContainer: {
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Device cards
  deviceCard: {
    marginBottom: 0,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deviceVoltage: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  deviceStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  deviceStat: {
    flex: 1,
  },
  deviceStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  deviceStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  deviceMeta: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deviceMetaText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Empty & Success states
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  successState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  successIcon: {
    fontSize: 48,
    color: colors.success,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Alert cards
  alertCard: {
    borderLeftWidth: 4,
  },
  alertWarning: {
    borderLeftColor: colors.warning,
  },
  alertError: {
    borderLeftColor: colors.error,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
