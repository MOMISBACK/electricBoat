// ============================================================================
// ElectricBoat v2.0 - Calculs de puissance et consommation
// ============================================================================

import type { ElectricalNode } from '../../models/types';

// ----------------------------------------------------------------------------
// Constantes
// ----------------------------------------------------------------------------

export const DEFAULT_SUN_HOURS = 5;
export const DEFAULT_SOLAR_EFFICIENCY = 0.7;
export const DEFAULT_ALTERNATOR_EFFICIENCY = 0.85;
export const DEFAULT_INVERTER_EFFICIENCY = 0.9;
export const DEFAULT_CHARGER_EFFICIENCY = 0.85;

// ----------------------------------------------------------------------------
// Calculs de courant pour les consommateurs
// ----------------------------------------------------------------------------

/**
 * Calcule le courant d'un consommateur
 */
export function getNodeCurrent(node: ElectricalNode): number {
  if (node.type !== 'consumer') return 0;
  
  if ('currentA' in node && node.currentA !== undefined) {
    return node.currentA;
  }
  
  if ('powerW' in node && node.powerW !== undefined) {
    return node.powerW / node.voltage;
  }
  
  return 0;
}

/**
 * Calcule la puissance d'un consommateur
 */
export function getNodePower(node: ElectricalNode): number {
  if (node.type !== 'consumer') return 0;
  
  if ('powerW' in node && node.powerW !== undefined) {
    return node.powerW;
  }
  
  if ('currentA' in node && node.currentA !== undefined) {
    return node.currentA * node.voltage;
  }
  
  return 0;
}

/**
 * Calcule la consommation journalière en Ah d'un consommateur
 */
export function getNodeDailyAh(node: ElectricalNode): number {
  if (node.type !== 'consumer') return 0;
  
  const current = getNodeCurrent(node);
  const dailyHours = 'dailyHours' in node ? node.dailyHours : 0;
  const dutyCycle = 'dutyCycle' in node ? node.dutyCycle : 1;
  
  return current * dailyHours * dutyCycle;
}

/**
 * Calcule la consommation journalière en Wh d'un consommateur
 */
export function getNodeDailyWh(node: ElectricalNode): number {
  return getNodeDailyAh(node) * node.voltage;
}

// ----------------------------------------------------------------------------
// Calculs agrégés pour plusieurs nodes
// ----------------------------------------------------------------------------

/**
 * Filtre les nodes par type
 */
export function filterNodesByType<T extends ElectricalNode['type']>(
  nodes: ElectricalNode[],
  type: T
): Extract<ElectricalNode, { type: T }>[] {
  return nodes.filter((n) => n.type === type) as Extract<ElectricalNode, { type: T }>[];
}

/**
 * Calcule la consommation journalière totale en Ah
 */
export function getTotalDailyConsumptionAh(nodes: ElectricalNode[]): number {
  return nodes
    .filter((n) => n.type === 'consumer')
    .reduce((sum, n) => sum + getNodeDailyAh(n), 0);
}

/**
 * Calcule la puissance instantanée totale (tous consommateurs actifs)
 */
export function getTotalInstantPowerW(nodes: ElectricalNode[]): number {
  return nodes
    .filter((n) => n.type === 'consumer')
    .reduce((sum, n) => sum + getNodePower(n), 0);
}

/**
 * Calcule le courant max instantané
 */
export function getMaxInstantCurrentA(nodes: ElectricalNode[], voltage: number): number {
  const totalPower = getTotalInstantPowerW(nodes);
  return totalPower / voltage;
}

// ----------------------------------------------------------------------------
// Calculs de production
// ----------------------------------------------------------------------------

/**
 * Calcule la production journalière d'un panneau solaire en Ah
 */
export function getSolarDailyAh(
  node: ElectricalNode,
  sunHours: number = DEFAULT_SUN_HOURS
): number {
  if (node.type !== 'solar') return 0;
  
  const maxPowerW = 'maxPowerW' in node ? node.maxPowerW : 0;
  const efficiency = 'efficiency' in node ? (node.efficiency ?? DEFAULT_SOLAR_EFFICIENCY) : DEFAULT_SOLAR_EFFICIENCY;
  const quantity = 'quantity' in node ? (node.quantity ?? 1) : 1;
  
  // Ah = (W × heures × efficacité) / tension
  return (maxPowerW * quantity * sunHours * efficiency) / node.voltage;
}

/**
 * Calcule la production journalière totale solaire en Ah
 */
export function getTotalSolarDailyAh(
  nodes: ElectricalNode[],
  sunHours: number = DEFAULT_SUN_HOURS
): number {
  return nodes
    .filter((n) => n.type === 'solar')
    .reduce((sum, n) => sum + getSolarDailyAh(n, sunHours), 0);
}

/**
 * Calcule la production journalière d'un alternateur en Ah
 */
export function getAlternatorDailyAh(node: ElectricalNode): number {
  if (node.type !== 'alternator') return 0;
  
  const maxPowerW = 'maxPowerW' in node ? node.maxPowerW : 0;
  const efficiency = 'efficiency' in node ? (node.efficiency ?? DEFAULT_ALTERNATOR_EFFICIENCY) : DEFAULT_ALTERNATOR_EFFICIENCY;
  const engineHours = 'engineHoursPerDay' in node ? (node.engineHoursPerDay ?? 0) : 0;
  
  // Courant max = Puissance / tension
  const maxCurrent = (maxPowerW * efficiency) / node.voltage;
  
  return maxCurrent * engineHours;
}

/**
 * Calcule la production journalière totale des alternateurs en Ah
 */
export function getTotalAlternatorDailyAh(nodes: ElectricalNode[]): number {
  return nodes
    .filter((n) => n.type === 'alternator')
    .reduce((sum, n) => sum + getAlternatorDailyAh(n), 0);
}

/**
 * Calcule la production journalière d'un chargeur de quai en Ah
 * (suppose 8h de charge quand branché)
 */
export function getChargerDailyAh(node: ElectricalNode, hoursPlugged: number = 0): number {
  if (node.type !== 'charger') return 0;
  
  const maxPowerW = 'maxPowerW' in node ? node.maxPowerW : 0;
  const maxCurrent = maxPowerW / node.voltage;
  
  return maxCurrent * hoursPlugged;
}

// ----------------------------------------------------------------------------
// Production totale
// ----------------------------------------------------------------------------

/**
 * Calcule la production journalière totale en Ah
 */
export function getTotalDailyProductionAh(
  nodes: ElectricalNode[],
  sunHours: number = DEFAULT_SUN_HOURS
): number {
  const solar = getTotalSolarDailyAh(nodes, sunHours);
  const alternator = getTotalAlternatorDailyAh(nodes);
  
  return solar + alternator;
}

// ----------------------------------------------------------------------------
// Bilan énergétique
// ----------------------------------------------------------------------------

/**
 * Calcule le bilan journalier (production - consommation)
 */
export function getDailyBalanceAh(
  nodes: ElectricalNode[],
  sunHours: number = DEFAULT_SUN_HOURS
): number {
  const production = getTotalDailyProductionAh(nodes, sunHours);
  const consumption = getTotalDailyConsumptionAh(nodes);
  
  return production - consumption;
}

/**
 * Vérifie si le bilan énergétique est positif
 */
export function isEnergyBalancePositive(
  nodes: ElectricalNode[],
  sunHours: number = DEFAULT_SUN_HOURS
): boolean {
  return getDailyBalanceAh(nodes, sunHours) >= 0;
}
