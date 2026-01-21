// ============================================================================
// ElectricBoat v2.0 - Compatibilité ancien sourceLibrary
// Ce fichier sera supprimé une fois les écrans migrés
// ============================================================================

import type { PowerSource } from '../models/types';
import { nodeLibrary, getSourceCategories } from './nodeLibrary';

type SourceTemplate = Omit<PowerSource, 'id'>;

export interface SourceCategory {
  name: string;
  icon: string;
  type: PowerSource['type'];
  sources: SourceTemplate[];
}

// Convertir la nouvelle bibliothèque vers l'ancien format
export const sourceLibrary: SourceCategory[] = getSourceCategories().map(cat => {
  const nodeType = Array.isArray(cat.nodeType) ? cat.nodeType[0] : cat.nodeType;
  
  // Map new types to old types
  let oldType: PowerSource['type'] = 'battery';
  if (nodeType === 'solar') oldType = 'solar';
  if (nodeType === 'alternator') oldType = 'alternator';
  
  return {
    name: cat.name,
    icon: cat.icon,
    type: oldType,
    sources: cat.templates.map(t => ({
      type: oldType,
      voltage: t.voltage as 12 | 24,
      capacityAh: t.capacityAh,
      powerW: t.maxPowerW,
      efficiency: t.efficiency,
    })),
  };
});

/**
 * @deprecated Utiliser getSourceCategories à la place
 */
export function getSourceByType(type: PowerSource['type']): SourceCategory | undefined {
  return sourceLibrary.find(s => s.type === type);
}

/**
 * @deprecated Helper pour affichage
 */
export function getSourceDisplayName(source: PowerSource): string {
  switch (source.type) {
    case 'battery':
      return `Batterie ${source.capacityAh}Ah ${source.voltage}V`;
    case 'solar':
      return `Panneau solaire ${source.powerW}W`;
    case 'alternator':
      return `Alternateur ${source.powerW}W`;
    default:
      return `Source ${source.voltage}V`;
  }
}
