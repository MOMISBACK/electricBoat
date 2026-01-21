// ============================================================================
// ElectricBoat v2.0 - Compatibilité anciens calculs
// Ce fichier sera supprimé une fois les écrans migrés
// ============================================================================

import type { Device, PowerSource, Cable } from '../models/types';
import { DOD_BY_CHEMISTRY } from './calculations/battery';

// Réexporter les constantes
export const DEFAULT_SUN_HOURS = 5;
export const DEFAULT_SOLAR_EFFICIENCY = 0.7;
export const DEFAULT_DOD_LEAD = DOD_BY_CHEMISTRY.lead;
export const DEFAULT_DOD_LIFEPO4 = DOD_BY_CHEMISTRY.lifepo4;

// ----------------------------------------------------------------------------
// Fonctions compatibles avec l'ancien modèle Device/PowerSource
// ----------------------------------------------------------------------------

export function deviceCurrent(device: Device): number {
  if (device.currentA) return device.currentA;
  if (device.powerW) return device.powerW / device.voltage;
  return 0;
}

export function deviceDailyAh(device: Device): number {
  return deviceCurrent(device) * device.dailyHours * device.dutyCycle;
}

export function totalDailyAh(devices: Device[]): number {
  return devices.reduce((sum, d) => sum + deviceDailyAh(d), 0);
}

export function totalInstantPowerW(devices: Device[]): number {
  return devices.reduce((sum, d) => sum + deviceCurrent(d) * d.voltage, 0);
}

export function requiredBatteryCapacity(
  dailyAh: number,
  daysAutonomy: number,
  depthOfDischarge: number
): number {
  return (dailyAh * daysAutonomy) / depthOfDischarge;
}

export function solarDailyAh(
  panelW: number,
  sunHours: number,
  efficiency: number,
  voltage: number
): number {
  return (panelW * sunHours * efficiency) / voltage;
}

export function totalSolarDailyAh(
  sources: PowerSource[],
  sunHours = DEFAULT_SUN_HOURS
): number {
  return sources
    .filter((s) => s.type === 'solar' && s.powerW)
    .reduce((sum, s) => {
      const efficiency = s.efficiency ?? DEFAULT_SOLAR_EFFICIENCY;
      return sum + solarDailyAh(s.powerW ?? 0, sunHours, efficiency, s.voltage);
    }, 0);
}

export function totalBatteryCapacityAh(sources: PowerSource[]): number {
  return sources
    .filter((s) => s.type === 'battery' && s.capacityAh)
    .reduce((sum, s) => sum + (s.capacityAh ?? 0), 0);
}

export function cableOverCurrentAlerts(
  cables: Cable[],
  devices: Device[]
): Array<{ cableId: string; currentA: number }> {
  const deviceById = new Map(devices.map((d) => [d.id, d] as const));
  return cables
    .map((c) => {
      const fromDevice = deviceById.get(c.fromId);
      const toDevice = deviceById.get(c.toId);
      const currentA = Math.max(
        fromDevice ? deviceCurrent(fromDevice) : 0,
        toDevice ? deviceCurrent(toDevice) : 0
      );
      return { cableId: c.id, currentA, maxCurrentA: c.maxCurrentA };
    })
    .filter((c) => c.currentA > c.maxCurrentA)
    .map((c) => ({ cableId: c.cableId, currentA: c.currentA }));
}