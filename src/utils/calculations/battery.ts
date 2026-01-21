// ============================================================================
// ElectricBoat v2.0 - Calculs de dimensionnement batterie
// ============================================================================

import type { BatteryChemistry, ElectricalNode } from '../../models/types';
import { getTotalDailyConsumptionAh } from './power';

// ----------------------------------------------------------------------------
// Constantes DoD (Depth of Discharge)
// ----------------------------------------------------------------------------

export const DOD_BY_CHEMISTRY: Record<BatteryChemistry, number> = {
  lead: 0.5,      // 50% pour plomb ouvert
  agm: 0.5,       // 50% pour AGM
  gel: 0.5,       // 50% pour Gel
  lifepo4: 0.8,   // 80% pour LiFePO4
  lithium: 0.8,   // 80% pour lithium-ion
};

export const DEFAULT_DAYS_AUTONOMY = 2;

// ----------------------------------------------------------------------------
// Calculs de capacité batterie
// ----------------------------------------------------------------------------

/**
 * Calcule la capacité totale des batteries en Ah
 */
export function getTotalBatteryCapacityAh(nodes: ElectricalNode[]): number {
  return nodes
    .filter((n) => n.type === 'battery')
    .reduce((sum, n) => {
      if ('capacityAh' in n) {
        const quantity = 'quantity' in n ? (n.quantity ?? 1) : 1;
        const config = 'configuration' in n ? n.configuration : 'parallel';
        
        // En parallèle : capacités s'additionnent
        // En série : capacité reste la même (mais tension augmente)
        if (config === 'parallel') {
          return sum + n.capacityAh * quantity;
        } else {
          return sum + n.capacityAh;
        }
      }
      return sum;
    }, 0);
}

/**
 * Détermine la chimie dominante des batteries (pour le DoD)
 */
export function getDominantBatteryChemistry(nodes: ElectricalNode[]): BatteryChemistry {
  const batteries = nodes.filter((n) => n.type === 'battery');
  
  if (batteries.length === 0) return 'lead';
  
  // Compte la capacité par chimie
  const capacityByChemistry: Partial<Record<BatteryChemistry, number>> = {};
  
  for (const bat of batteries) {
    if ('chemistry' in bat && 'capacityAh' in bat) {
      const chemistry = bat.chemistry;
      const capacity = bat.capacityAh * ('quantity' in bat ? (bat.quantity ?? 1) : 1);
      capacityByChemistry[chemistry] = (capacityByChemistry[chemistry] ?? 0) + capacity;
    }
  }
  
  // Trouve la chimie avec la plus grande capacité
  let maxCapacity = 0;
  let dominantChemistry: BatteryChemistry = 'lead';
  
  for (const [chemistry, capacity] of Object.entries(capacityByChemistry)) {
    if (capacity > maxCapacity) {
      maxCapacity = capacity;
      dominantChemistry = chemistry as BatteryChemistry;
    }
  }
  
  return dominantChemistry;
}

/**
 * Calcule le DoD effectif basé sur les batteries installées
 */
export function getEffectiveDoD(nodes: ElectricalNode[]): number {
  const chemistry = getDominantBatteryChemistry(nodes);
  return DOD_BY_CHEMISTRY[chemistry];
}

/**
 * Calcule la capacité utilisable des batteries (après DoD)
 */
export function getUsableBatteryCapacityAh(nodes: ElectricalNode[]): number {
  const totalCapacity = getTotalBatteryCapacityAh(nodes);
  const dod = getEffectiveDoD(nodes);
  return totalCapacity * dod;
}

/**
 * Calcule la capacité batterie requise pour une autonomie donnée
 */
export function getRequiredBatteryCapacityAh(
  dailyConsumptionAh: number,
  daysAutonomy: number,
  depthOfDischarge: number
): number {
  if (depthOfDischarge <= 0) return Infinity;
  return (dailyConsumptionAh * daysAutonomy) / depthOfDischarge;
}

/**
 * Calcule la capacité batterie requise basée sur les nodes
 */
export function getRequiredBatteryCapacityAhFromNodes(
  nodes: ElectricalNode[],
  daysAutonomy: number = DEFAULT_DAYS_AUTONOMY
): number {
  const dailyConsumption = getTotalDailyConsumptionAh(nodes);
  const dod = getEffectiveDoD(nodes);
  return getRequiredBatteryCapacityAh(dailyConsumption, daysAutonomy, dod);
}

// ----------------------------------------------------------------------------
// Calculs d'autonomie
// ----------------------------------------------------------------------------

/**
 * Calcule l'autonomie estimée en jours
 */
export function getEstimatedAutonomyDays(
  usableCapacityAh: number,
  dailyConsumptionAh: number
): number {
  if (dailyConsumptionAh <= 0) return Infinity;
  return usableCapacityAh / dailyConsumptionAh;
}

/**
 * Calcule l'autonomie estimée basée sur les nodes
 */
export function getEstimatedAutonomyDaysFromNodes(nodes: ElectricalNode[]): number {
  const usableCapacity = getUsableBatteryCapacityAh(nodes);
  const dailyConsumption = getTotalDailyConsumptionAh(nodes);
  return getEstimatedAutonomyDays(usableCapacity, dailyConsumption);
}

// ----------------------------------------------------------------------------
// Statut batterie
// ----------------------------------------------------------------------------

export type BatteryStatus = 'ok' | 'warning' | 'critical';

/**
 * Détermine le statut de la batterie
 */
export function getBatteryStatus(
  nodes: ElectricalNode[],
  requiredAutonomyDays: number = DEFAULT_DAYS_AUTONOMY
): BatteryStatus {
  const estimatedAutonomy = getEstimatedAutonomyDaysFromNodes(nodes);
  
  if (estimatedAutonomy >= requiredAutonomyDays) {
    return 'ok';
  } else if (estimatedAutonomy >= requiredAutonomyDays * 0.5) {
    return 'warning';
  } else {
    return 'critical';
  }
}

/**
 * Calcule le pourcentage de couverture de la capacité
 */
export function getBatteryCoveragePercent(
  nodes: ElectricalNode[],
  daysAutonomy: number = DEFAULT_DAYS_AUTONOMY
): number {
  const installed = getTotalBatteryCapacityAh(nodes);
  const required = getRequiredBatteryCapacityAhFromNodes(nodes, daysAutonomy);
  
  if (required <= 0) return 100;
  return Math.min(100, (installed / required) * 100);
}

// ----------------------------------------------------------------------------
// Recommandations
// ----------------------------------------------------------------------------

/**
 * Génère une recommandation de capacité batterie
 */
export function getBatteryRecommendation(
  nodes: ElectricalNode[],
  daysAutonomy: number = DEFAULT_DAYS_AUTONOMY
): {
  currentCapacityAh: number;
  requiredCapacityAh: number;
  deficitAh: number;
  message: string;
} {
  const current = getTotalBatteryCapacityAh(nodes);
  const required = getRequiredBatteryCapacityAhFromNodes(nodes, daysAutonomy);
  const deficit = Math.max(0, required - current);
  
  let message: string;
  if (deficit === 0) {
    message = `Capacité suffisante pour ${daysAutonomy} jours d'autonomie`;
  } else {
    message = `Il manque ${Math.round(deficit)} Ah pour ${daysAutonomy} jours d'autonomie`;
  }
  
  return {
    currentCapacityAh: Math.round(current),
    requiredCapacityAh: Math.round(required),
    deficitAh: Math.round(deficit),
    message,
  };
}
