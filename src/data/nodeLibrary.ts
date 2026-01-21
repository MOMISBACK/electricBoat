// ============================================================================
// ElectricBoat v2.0 - Bibliothèque unifiée des équipements électriques
// ============================================================================

import type { NodeTemplate, NodeType } from '../models/types';

// ----------------------------------------------------------------------------
// Types pour la bibliothèque
// ----------------------------------------------------------------------------

export type NodeCategory = {
  id: string;
  name: string;
  icon: string;
  nodeType: NodeType | NodeType[];  // Type(s) de node dans cette catégorie
  templates: NodeTemplate[];
};

// ----------------------------------------------------------------------------
// Catalogue complet des équipements
// ----------------------------------------------------------------------------

export const nodeLibrary: NodeCategory[] = [
  // -------------------------------------------------------------------------
  // BATTERIES
  // -------------------------------------------------------------------------
  {
    id: 'batteries',
    name: 'Batteries',
    icon: '🔋',
    nodeType: 'battery',
    templates: [
      // Plomb 12V
      {
        type: 'battery',
        name: 'Batterie Plomb 100Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 100,
        chemistry: 'lead',
      },
      {
        type: 'battery',
        name: 'Batterie Plomb 200Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 200,
        chemistry: 'lead',
      },
      // AGM 12V
      {
        type: 'battery',
        name: 'Batterie AGM 100Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 100,
        chemistry: 'agm',
      },
      {
        type: 'battery',
        name: 'Batterie AGM 200Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 200,
        chemistry: 'agm',
      },
      // LiFePO4 12V
      {
        type: 'battery',
        name: 'Batterie LiFePO4 100Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 100,
        chemistry: 'lifepo4',
      },
      {
        type: 'battery',
        name: 'Batterie LiFePO4 200Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 200,
        chemistry: 'lifepo4',
      },
      {
        type: 'battery',
        name: 'Batterie LiFePO4 300Ah',
        icon: '🔋',
        voltage: 12,
        capacityAh: 300,
        chemistry: 'lifepo4',
      },
      // 24V
      {
        type: 'battery',
        name: 'Batterie 24V 100Ah',
        icon: '🔋',
        voltage: 24,
        capacityAh: 100,
        chemistry: 'agm',
      },
      {
        type: 'battery',
        name: 'Batterie LiFePO4 24V 200Ah',
        icon: '🔋',
        voltage: 24,
        capacityAh: 200,
        chemistry: 'lifepo4',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // PANNEAUX SOLAIRES
  // -------------------------------------------------------------------------
  {
    id: 'solar',
    name: 'Panneaux solaires',
    icon: '☀️',
    nodeType: 'solar',
    templates: [
      {
        type: 'solar',
        name: 'Panneau 100Wc',
        icon: '☀️',
        voltage: 12,
        maxPowerW: 100,
        efficiency: 0.7,
      },
      {
        type: 'solar',
        name: 'Panneau 150Wc',
        icon: '☀️',
        voltage: 12,
        maxPowerW: 150,
        efficiency: 0.7,
      },
      {
        type: 'solar',
        name: 'Panneau 200Wc',
        icon: '☀️',
        voltage: 12,
        maxPowerW: 200,
        efficiency: 0.7,
      },
      {
        type: 'solar',
        name: 'Panneau 300Wc',
        icon: '☀️',
        voltage: 24,
        maxPowerW: 300,
        efficiency: 0.7,
      },
      {
        type: 'solar',
        name: 'Panneau 400Wc',
        icon: '☀️',
        voltage: 24,
        maxPowerW: 400,
        efficiency: 0.7,
      },
      {
        type: 'solar',
        name: 'Panneau flexible 100Wc',
        icon: '☀️',
        voltage: 12,
        maxPowerW: 100,
        efficiency: 0.65,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ALTERNATEURS
  // -------------------------------------------------------------------------
  {
    id: 'alternators',
    name: 'Alternateurs',
    icon: '⚙️',
    nodeType: 'alternator',
    templates: [
      {
        type: 'alternator',
        name: 'Alternateur 50A',
        icon: '⚙️',
        voltage: 12,
        maxPowerW: 600,
        efficiency: 0.85,
        engineHoursPerDay: 2,
      },
      {
        type: 'alternator',
        name: 'Alternateur 80A',
        icon: '⚙️',
        voltage: 12,
        maxPowerW: 960,
        efficiency: 0.85,
        engineHoursPerDay: 2,
      },
      {
        type: 'alternator',
        name: 'Alternateur 120A',
        icon: '⚙️',
        voltage: 12,
        maxPowerW: 1440,
        efficiency: 0.85,
        engineHoursPerDay: 2,
      },
      {
        type: 'alternator',
        name: 'Alternateur 24V 60A',
        icon: '⚙️',
        voltage: 24,
        maxPowerW: 1440,
        efficiency: 0.85,
        engineHoursPerDay: 2,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // CHARGEURS
  // -------------------------------------------------------------------------
  {
    id: 'chargers',
    name: 'Chargeurs',
    icon: '🔌',
    nodeType: 'charger',
    templates: [
      {
        type: 'charger',
        name: 'Chargeur 20A',
        icon: '🔌',
        voltage: 12,
        maxPowerW: 240,
        inputVoltage: 220,
      },
      {
        type: 'charger',
        name: 'Chargeur 40A',
        icon: '🔌',
        voltage: 12,
        maxPowerW: 480,
        inputVoltage: 220,
      },
      {
        type: 'charger',
        name: 'Chargeur 60A',
        icon: '🔌',
        voltage: 12,
        maxPowerW: 720,
        inputVoltage: 220,
      },
      {
        type: 'charger',
        name: 'Chargeur 24V 30A',
        icon: '🔌',
        voltage: 24,
        maxPowerW: 720,
        inputVoltage: 220,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ONDULEURS
  // -------------------------------------------------------------------------
  {
    id: 'inverters',
    name: 'Onduleurs',
    icon: '⚡',
    nodeType: 'inverter',
    templates: [
      {
        type: 'inverter',
        name: 'Onduleur 300W',
        icon: '⚡',
        voltage: 12,
        maxPowerW: 300,
        efficiency: 0.9,
        outputVoltage: 220,
      },
      {
        type: 'inverter',
        name: 'Onduleur 1000W',
        icon: '⚡',
        voltage: 12,
        maxPowerW: 1000,
        efficiency: 0.9,
        outputVoltage: 220,
      },
      {
        type: 'inverter',
        name: 'Onduleur 2000W',
        icon: '⚡',
        voltage: 12,
        maxPowerW: 2000,
        efficiency: 0.9,
        outputVoltage: 220,
      },
      {
        type: 'inverter',
        name: 'Onduleur 3000W',
        icon: '⚡',
        voltage: 24,
        maxPowerW: 3000,
        efficiency: 0.9,
        outputVoltage: 220,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------------------------
  {
    id: 'navigation',
    name: 'Navigation',
    icon: '🧭',
    nodeType: 'consumer',
    templates: [
      {
        type: 'consumer',
        name: 'Pilote automatique',
        icon: '🧭',
        voltage: 12,
        powerW: 60,
        dailyHours: 8,
        dutyCycle: 0.6,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'GPS / Traceur',
        icon: '📍',
        voltage: 12,
        powerW: 15,
        dailyHours: 12,
        dutyCycle: 1.0,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'VHF',
        icon: '📻',
        voltage: 12,
        powerW: 25,
        dailyHours: 12,
        dutyCycle: 0.1,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'AIS',
        icon: '📡',
        voltage: 12,
        powerW: 5,
        dailyHours: 24,
        dutyCycle: 1.0,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'Radar',
        icon: '📡',
        voltage: 12,
        powerW: 35,
        dailyHours: 6,
        dutyCycle: 0.8,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'Sondeur',
        icon: '🔊',
        voltage: 12,
        powerW: 12,
        dailyHours: 8,
        dutyCycle: 1.0,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'Compas électronique',
        icon: '🧭',
        voltage: 12,
        powerW: 2,
        dailyHours: 24,
        dutyCycle: 1.0,
        category: 'navigation',
      },
      {
        type: 'consumer',
        name: 'Anémomètre',
        icon: '💨',
        voltage: 12,
        powerW: 1,
        dailyHours: 24,
        dutyCycle: 1.0,
        category: 'navigation',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ÉCLAIRAGE
  // -------------------------------------------------------------------------
  {
    id: 'lighting',
    name: 'Éclairage',
    icon: '💡',
    nodeType: 'consumer',
    templates: [
      {
        type: 'consumer',
        name: 'Feux de navigation',
        icon: '🚨',
        voltage: 12,
        powerW: 15,
        dailyHours: 10,
        dutyCycle: 1.0,
        category: 'lighting',
      },
      {
        type: 'consumer',
        name: 'Feu de mouillage',
        icon: '💡',
        voltage: 12,
        powerW: 5,
        dailyHours: 12,
        dutyCycle: 1.0,
        category: 'lighting',
      },
      {
        type: 'consumer',
        name: 'Éclairage cabine LED',
        icon: '💡',
        voltage: 12,
        powerW: 8,
        dailyHours: 4,
        dutyCycle: 1.0,
        category: 'lighting',
      },
      {
        type: 'consumer',
        name: 'Éclairage cockpit',
        icon: '💡',
        voltage: 12,
        powerW: 5,
        dailyHours: 3,
        dutyCycle: 1.0,
        category: 'lighting',
      },
      {
        type: 'consumer',
        name: 'Spot de lecture',
        icon: '💡',
        voltage: 12,
        powerW: 3,
        dailyHours: 2,
        dutyCycle: 1.0,
        category: 'lighting',
      },
      {
        type: 'consumer',
        name: 'Éclairage pont',
        icon: '💡',
        voltage: 12,
        powerW: 10,
        dailyHours: 2,
        dutyCycle: 0.5,
        category: 'lighting',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // CONFORT
  // -------------------------------------------------------------------------
  {
    id: 'comfort',
    name: 'Confort',
    icon: '🏠',
    nodeType: 'consumer',
    templates: [
      {
        type: 'consumer',
        name: 'Réfrigérateur',
        icon: '❄️',
        voltage: 12,
        powerW: 45,
        dailyHours: 24,
        dutyCycle: 0.3,
        category: 'comfort',
      },
      {
        type: 'consumer',
        name: 'Congélateur',
        icon: '🧊',
        voltage: 12,
        powerW: 60,
        dailyHours: 24,
        dutyCycle: 0.35,
        category: 'comfort',
      },
      {
        type: 'consumer',
        name: 'Chauffe-eau',
        icon: '🚿',
        voltage: 12,
        powerW: 200,
        dailyHours: 1,
        dutyCycle: 1.0,
        category: 'comfort',
      },
      {
        type: 'consumer',
        name: 'Ventilateur cabine',
        icon: '🌀',
        voltage: 12,
        powerW: 5,
        dailyHours: 8,
        dutyCycle: 1.0,
        category: 'comfort',
      },
      {
        type: 'consumer',
        name: 'Prises USB',
        icon: '🔌',
        voltage: 12,
        powerW: 10,
        dailyHours: 4,
        dutyCycle: 1.0,
        category: 'comfort',
      },
      {
        type: 'consumer',
        name: 'TV / Écran',
        icon: '📺',
        voltage: 12,
        powerW: 30,
        dailyHours: 3,
        dutyCycle: 1.0,
        category: 'comfort',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // POMPES
  // -------------------------------------------------------------------------
  {
    id: 'pumps',
    name: 'Pompes',
    icon: '💧',
    nodeType: 'consumer',
    templates: [
      {
        type: 'consumer',
        name: 'Pompe eau douce',
        icon: '💧',
        voltage: 12,
        powerW: 40,
        dailyHours: 0.5,
        dutyCycle: 1.0,
        category: 'pumps',
      },
      {
        type: 'consumer',
        name: 'Pompe de cale',
        icon: '💧',
        voltage: 12,
        powerW: 30,
        dailyHours: 0.2,
        dutyCycle: 1.0,
        category: 'pumps',
      },
      {
        type: 'consumer',
        name: 'Pompe WC électrique',
        icon: '🚽',
        voltage: 12,
        powerW: 20,
        dailyHours: 0.3,
        dutyCycle: 1.0,
        category: 'pumps',
      },
      {
        type: 'consumer',
        name: 'Dessalinisateur',
        icon: '💧',
        voltage: 12,
        powerW: 120,
        dailyHours: 2,
        dutyCycle: 1.0,
        category: 'pumps',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // MANŒUVRE
  // -------------------------------------------------------------------------
  {
    id: 'maneuver',
    name: 'Manœuvre',
    icon: '⚓',
    nodeType: 'consumer',
    templates: [
      {
        type: 'consumer',
        name: 'Guindeau',
        icon: '⚓',
        voltage: 12,
        currentA: 80,
        dailyHours: 0.1,
        dutyCycle: 1.0,
        category: 'maneuver',
      },
      {
        type: 'consumer',
        name: 'Propulseur d\'étrave',
        icon: '🔄',
        voltage: 12,
        currentA: 120,
        dailyHours: 0.1,
        dutyCycle: 0.5,
        category: 'maneuver',
      },
      {
        type: 'consumer',
        name: 'Winch électrique',
        icon: '🔧',
        voltage: 12,
        currentA: 60,
        dailyHours: 0.2,
        dutyCycle: 0.5,
        category: 'maneuver',
      },
      {
        type: 'consumer',
        name: 'Enrouleur électrique',
        icon: '🔄',
        voltage: 12,
        powerW: 200,
        dailyHours: 0.1,
        dutyCycle: 1.0,
        category: 'maneuver',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // DISTRIBUTION
  // -------------------------------------------------------------------------
  {
    id: 'distribution',
    name: 'Distribution',
    icon: '⬜',
    nodeType: ['bus', 'fuse', 'switch'],
    templates: [
      {
        type: 'bus',
        name: 'Barre positive',
        icon: '➕',
        voltage: 12,
        maxCurrentA: 150,
        portCount: 8,
      },
      {
        type: 'bus',
        name: 'Barre négative',
        icon: '➖',
        voltage: 12,
        maxCurrentA: 150,
        portCount: 8,
      },
      {
        type: 'bus',
        name: 'Répartiteur 12 voies',
        icon: '⬜',
        voltage: 12,
        maxCurrentA: 100,
        portCount: 12,
      },
      {
        type: 'fuse',
        name: 'Fusible 10A',
        icon: '🔲',
        voltage: 12,
        ratingA: 10,
        fuseType: 'blade',
      },
      {
        type: 'fuse',
        name: 'Fusible 20A',
        icon: '🔲',
        voltage: 12,
        ratingA: 20,
        fuseType: 'blade',
      },
      {
        type: 'fuse',
        name: 'Fusible 30A',
        icon: '🔲',
        voltage: 12,
        ratingA: 30,
        fuseType: 'blade',
      },
      {
        type: 'fuse',
        name: 'Disjoncteur 50A',
        icon: '🔲',
        voltage: 12,
        ratingA: 50,
        fuseType: 'breaker',
      },
      {
        type: 'fuse',
        name: 'Fusible ANL 100A',
        icon: '🔲',
        voltage: 12,
        ratingA: 100,
        fuseType: 'anl',
      },
      {
        type: 'switch',
        name: 'Coupe-batterie',
        icon: '🔘',
        voltage: 12,
        maxCurrentA: 300,
        switchType: 'battery',
        isOn: true,
      },
      {
        type: 'switch',
        name: 'Interrupteur',
        icon: '🔘',
        voltage: 12,
        maxCurrentA: 20,
        switchType: 'toggle',
        isOn: true,
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Fonctions utilitaires
// ----------------------------------------------------------------------------

/**
 * Récupère une catégorie par son ID
 */
export function getCategory(categoryId: string): NodeCategory | undefined {
  return nodeLibrary.find(cat => cat.id === categoryId);
}

/**
 * Récupère tous les templates d'un type de node donné
 */
export function getTemplatesByType(nodeType: NodeType): NodeTemplate[] {
  return nodeLibrary
    .filter(cat => {
      if (Array.isArray(cat.nodeType)) {
        return cat.nodeType.includes(nodeType);
      }
      return cat.nodeType === nodeType;
    })
    .flatMap(cat => cat.templates)
    .filter(t => t.type === nodeType);
}

/**
 * Recherche des templates par nom
 */
export function searchTemplates(query: string): NodeTemplate[] {
  const lowerQuery = query.toLowerCase();
  return nodeLibrary
    .flatMap(cat => cat.templates)
    .filter(t => t.name.toLowerCase().includes(lowerQuery));
}

/**
 * Récupère tous les templates "consumer" d'une catégorie donnée
 */
export function getConsumersByCategory(category: string): NodeTemplate[] {
  return nodeLibrary
    .flatMap(cat => cat.templates)
    .filter(t => t.type === 'consumer' && (t as any).category === category);
}

/**
 * Retourne les catégories de consommateurs uniquement
 */
export function getConsumerCategories(): NodeCategory[] {
  return nodeLibrary.filter(cat => cat.nodeType === 'consumer');
}

/**
 * Retourne les catégories de sources d'énergie
 */
export function getSourceCategories(): NodeCategory[] {
  return nodeLibrary.filter(cat => 
    cat.nodeType === 'battery' || 
    cat.nodeType === 'solar' || 
    cat.nodeType === 'alternator' ||
    cat.nodeType === 'charger'
  );
}
