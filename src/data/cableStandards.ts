// ============================================================================
// ElectricBoat v2.0 - Standards de câblage marin
// ============================================================================

/**
 * Sections de câbles standards en mm²
 * Avec courant max admissible (en air libre, température ambiante 30°C)
 */
export type CableSpec = {
  sectionMm2: number;
  maxCurrentA: number;          // Courant max en A
  recommendedFuseA: number;     // Fusible recommandé en A
  awg?: number | string;        // Équivalent AWG (peut être "2/0", "3/0", etc.)
  resistancePerKm: number;       // Résistance en Ω/km (cuivre)
  usageHint: string;             // Conseil d'utilisation
};

export const cableStandards: CableSpec[] = [
  {
    sectionMm2: 0.5,
    maxCurrentA: 3,
    recommendedFuseA: 3,
    awg: 20,
    resistancePerKm: 36.7,
    usageHint: 'Signaux, capteurs, LED individuelles',
  },
  {
    sectionMm2: 0.75,
    maxCurrentA: 6,
    recommendedFuseA: 5,
    awg: 18,
    resistancePerKm: 24.8,
    usageHint: 'Éclairage LED, instruments',
  },
  {
    sectionMm2: 1.0,
    maxCurrentA: 10,
    recommendedFuseA: 7.5,
    awg: 17,
    resistancePerKm: 18.2,
    usageHint: 'Petits consommateurs',
  },
  {
    sectionMm2: 1.5,
    maxCurrentA: 15,
    recommendedFuseA: 10,
    awg: 16,
    resistancePerKm: 12.2,
    usageHint: 'Pompes, feux de nav',
  },
  {
    sectionMm2: 2.5,
    maxCurrentA: 20,
    recommendedFuseA: 15,
    awg: 14,
    resistancePerKm: 7.41,
    usageHint: 'Prises 12V, VHF, GPS',
  },
  {
    sectionMm2: 4,
    maxCurrentA: 30,
    recommendedFuseA: 25,
    awg: 12,
    resistancePerKm: 4.61,
    usageHint: 'Réfrigérateur, pompes pression',
  },
  {
    sectionMm2: 6,
    maxCurrentA: 40,
    recommendedFuseA: 30,
    awg: 10,
    resistancePerKm: 3.08,
    usageHint: 'Guindeau petit, dessalinisateur',
  },
  {
    sectionMm2: 10,
    maxCurrentA: 60,
    recommendedFuseA: 50,
    awg: 8,
    resistancePerKm: 1.83,
    usageHint: 'Chargeur, propulseur petit',
  },
  {
    sectionMm2: 16,
    maxCurrentA: 80,
    recommendedFuseA: 60,
    awg: 6,
    resistancePerKm: 1.15,
    usageHint: 'Guindeau moyen, pompe cale grosse',
  },
  {
    sectionMm2: 25,
    maxCurrentA: 110,
    recommendedFuseA: 80,
    awg: 4,
    resistancePerKm: 0.727,
    usageHint: 'Propulseur, onduleur petit',
  },
  {
    sectionMm2: 35,
    maxCurrentA: 140,
    recommendedFuseA: 100,
    awg: 2,
    resistancePerKm: 0.524,
    usageHint: 'Alternateur, onduleur moyen',
  },
  {
    sectionMm2: 50,
    maxCurrentA: 175,
    recommendedFuseA: 150,
    awg: 1,
    resistancePerKm: 0.387,
    usageHint: 'Câbles batterie courts',
  },
  {
    sectionMm2: 70,
    maxCurrentA: 215,
    recommendedFuseA: 175,
    awg: '2/0',
    resistancePerKm: 0.268,
    usageHint: 'Câbles batterie, démarreur',
  },
  {
    sectionMm2: 95,
    maxCurrentA: 265,
    recommendedFuseA: 200,
    awg: '3/0',
    resistancePerKm: 0.193,
    usageHint: 'Liaison batterie principale',
  },
  {
    sectionMm2: 120,
    maxCurrentA: 310,
    recommendedFuseA: 250,
    awg: '4/0',
    resistancePerKm: 0.153,
    usageHint: 'Gros onduleur, propulsion électrique',
  },
];

/**
 * Résistivité du cuivre en Ω·mm²/m
 */
export const COPPER_RESISTIVITY = 0.0175;

/**
 * Chute de tension maximale recommandée (en %)
 */
export const MAX_VOLTAGE_DROP_PERCENT = 3;

/**
 * Trouve la section recommandée pour un courant donné
 */
export function getRecommendedSection(currentA: number): CableSpec | undefined {
  return cableStandards.find(spec => spec.maxCurrentA >= currentA * 1.25);
}

/**
 * Calcule la chute de tension dans un câble
 * @param currentA - Courant en ampères
 * @param lengthM - Longueur en mètres (aller simple)
 * @param sectionMm2 - Section en mm²
 * @param voltage - Tension du circuit
 * @returns Chute de tension en % et en volts
 */
export function calculateVoltageDrop(
  currentA: number,
  lengthM: number,
  sectionMm2: number,
  voltage: number
): { dropVolts: number; dropPercent: number } {
  // Formule : ΔV = 2 × ρ × L × I / S
  // Le facteur 2 compte l'aller-retour du courant
  const dropVolts = (2 * COPPER_RESISTIVITY * lengthM * currentA) / sectionMm2;
  const dropPercent = (dropVolts / voltage) * 100;
  
  return {
    dropVolts: Math.round(dropVolts * 1000) / 1000,
    dropPercent: Math.round(dropPercent * 100) / 100,
  };
}

/**
 * Calcule la section minimale pour respecter une chute de tension max
 * @param currentA - Courant en ampères
 * @param lengthM - Longueur en mètres (aller simple)
 * @param voltage - Tension du circuit
 * @param maxDropPercent - Chute max acceptée en %
 * @returns Section minimale en mm²
 */
export function calculateMinSection(
  currentA: number,
  lengthM: number,
  voltage: number,
  maxDropPercent: number = MAX_VOLTAGE_DROP_PERCENT
): number {
  // S = 2 × ρ × L × I / (V × ΔV%)
  const maxDropVolts = voltage * (maxDropPercent / 100);
  const minSection = (2 * COPPER_RESISTIVITY * lengthM * currentA) / maxDropVolts;
  
  return Math.round(minSection * 100) / 100;
}

/**
 * Trouve la section standard supérieure ou égale à une valeur
 */
export function getNextStandardSection(minSectionMm2: number): CableSpec | undefined {
  return cableStandards.find(spec => spec.sectionMm2 >= minSectionMm2);
}

/**
 * Couleurs standard des câbles marins
 */
export const cableColors = {
  positive: '#ef4444',      // Rouge - Positif
  negative: '#1f2937',      // Noir - Négatif/Masse
  ground: '#22c55e',        // Vert - Terre
  accessory: '#eab308',     // Jaune - Accessoires
  instrument: '#3b82f6',    // Bleu - Instruments
  bilgePump: '#f97316',     // Orange - Pompe de cale
  navigation: '#8b5cf6',    // Violet - Navigation
};

/**
 * Types de fusibles courants
 */
export const fuseTypes = [
  { type: 'blade', name: 'Lame (ATO/ATC)', maxA: 30 },
  { type: 'mini-blade', name: 'Mini lame', maxA: 30 },
  { type: 'maxi-blade', name: 'Maxi lame', maxA: 80 },
  { type: 'anl', name: 'ANL', maxA: 300 },
  { type: 'mega', name: 'MEGA', maxA: 500 },
  { type: 'class-t', name: 'Class T', maxA: 400 },
  { type: 'breaker', name: 'Disjoncteur', maxA: 300 },
];

/**
 * Calibres de fusibles standards
 */
export const standardFuseRatings = [
  1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100, 125, 150, 175, 200, 250, 300
];

/**
 * Retourne le fusible recommandé pour un courant donné
 * Règle : fusible = 125% à 150% du courant nominal
 */
export function getRecommendedFuse(currentA: number): number {
  const targetRating = currentA * 1.25;
  return standardFuseRatings.find(rating => rating >= targetRating) ?? standardFuseRatings[standardFuseRatings.length - 1];
}

/**
 * Trouve les specs d'un câble par sa section
 */
export function getCableSpecBySection(sectionMm2: number): CableSpec | undefined {
  return cableStandards.find(spec => spec.sectionMm2 === sectionMm2);
}

/**
 * Alias pour l'export (compatibilité)
 */
export const CABLE_STANDARDS = cableStandards;
