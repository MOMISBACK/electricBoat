// ============================================================================
// ElectricBoat v2.0 - Compatibilité ancien deviceLibrary
// Ce fichier sera supprimé une fois les écrans migrés
// ============================================================================

import type { Device } from '../models/types';
import { nodeLibrary, getConsumerCategories } from './nodeLibrary';

type DeviceTemplate = Omit<Device, 'id' | 'position'>;

export interface DeviceCategory {
  name: string;
  icon: string;
  devices: DeviceTemplate[];
}

// Convertir la nouvelle bibliothèque vers l'ancien format
export const deviceLibrary: DeviceCategory[] = getConsumerCategories().map(cat => ({
  name: cat.name,
  icon: cat.icon,
  devices: cat.templates
    .filter(t => t.type === 'consumer')
    .map(t => ({
      name: t.name,
      voltage: t.voltage as 12 | 24,
      powerW: t.powerW,
      currentA: t.currentA,
      dailyHours: t.dailyHours ?? 1,
      dutyCycle: t.dutyCycle ?? 1,
    })),
}));
