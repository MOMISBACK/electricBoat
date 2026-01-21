// ============================================================================
// ElectricBoat v2.0 - Types principaux
// ============================================================================

// ----------------------------------------------------------------------------
// Types de base
// ----------------------------------------------------------------------------

export type Voltage = 12 | 24 | 48;

export type NodeType = 
  | 'consumer'    // Consommateur (feux, frigo, etc.)
  | 'battery'     // Batterie
  | 'solar'       // Panneau solaire
  | 'alternator'  // Alternateur moteur
  | 'charger'     // Chargeur de quai
  | 'inverter'    // Convertisseur DC/AC
  | 'bus'         // Barre de distribution
  | 'fuse'        // Fusible/Disjoncteur
  | 'switch';     // Interrupteur

export type EditorMode = 'view' | 'placement' | 'cabling' | 'analysis';

export type BatteryChemistry = 'lead' | 'agm' | 'gel' | 'lifepo4' | 'lithium';

export type CableType = 'single' | 'twin' | 'shielded' | 'battery';

export type PortType = 'positive' | 'negative' | 'data' | 'ac';

// ----------------------------------------------------------------------------
// Position & Géométrie
// ----------------------------------------------------------------------------

export type Point = {
  x: number;
  y: number;
};

// ----------------------------------------------------------------------------
// Types de compatibilité (ancien modèle)
// À supprimer une fois la migration terminée
// ----------------------------------------------------------------------------

/** @deprecated Utiliser ElectricalNode avec type='consumer' */
export type Device = {
  id: string;
  name: string;
  voltage: 12 | 24;
  powerW?: number;
  currentA?: number;
  dailyHours: number;
  dutyCycle: number;
  position: Point;
};

/** @deprecated Utiliser ElectricalNode avec type='battery'|'solar'|'alternator' */
export type PowerSource = {
  id: string;
  type: 'battery' | 'solar' | 'alternator' | 'wind';
  voltage: 12 | 24;
  capacityAh?: number;
  powerW?: number;
  efficiency?: number;
};

/** @deprecated Utiliser Connection */
export type Cable = {
  id: string;
  fromId: string;
  toId: string;
  lengthM: number;
  sectionMm2: number;
  maxCurrentA: number;
};

// ----------------------------------------------------------------------------
// ElectricalNode - Type unifié pour tous les composants
// ----------------------------------------------------------------------------

export type ElectricalNodeBase = {
  id: string;
  type: NodeType;
  name: string;
  icon: string;
  position: Point;
  voltage: Voltage;
  rotation?: number; // Degrés, 0 par défaut
  locked?: boolean;  // Empêche le déplacement
};

// Propriétés spécifiques selon le type
export type ConsumerProps = {
  type: 'consumer';
  powerW?: number;       // Puissance en W (ou currentA)
  currentA?: number;     // Courant en A (ou powerW)
  dailyHours: number;    // Heures d'utilisation par jour
  dutyCycle: number;     // 0-1, rapport cyclique
  category?: string;     // Catégorie (navigation, éclairage, etc.)
};

export type BatteryProps = {
  type: 'battery';
  capacityAh: number;
  chemistry: BatteryChemistry;
  quantity?: number;     // Nombre de batteries (série ou parallèle)
  configuration?: 'series' | 'parallel';
  dod?: number;          // Profondeur de décharge (0-1)
};

export type SolarProps = {
  type: 'solar';
  maxPowerW: number;     // Puissance crête Wc
  efficiency?: number;   // 0-1, rendement (défaut 0.7)
  quantity?: number;
};

export type AlternatorProps = {
  type: 'alternator';
  maxPowerW: number;
  efficiency?: number;   // 0-1 (défaut 0.85)
  engineHoursPerDay?: number;
  chargeCurrentA?: number; // Courant de charge
};

export type ChargerProps = {
  type: 'charger';
  maxPowerW: number;
  inputVoltage: 110 | 220;
};

export type InverterProps = {
  type: 'inverter';
  maxPowerW: number;
  efficiency?: number;   // 0-1 (défaut 0.9)
  outputVoltage: 110 | 220;
};

export type BusProps = {
  type: 'bus';
  maxCurrentA: number;
  portCount?: number;
};

export type FuseProps = {
  type: 'fuse';
  ratingA: number;       // Calibre en ampères
  fuseType?: 'blade' | 'anl' | 'mega' | 'breaker';
};

export type SwitchProps = {
  type: 'switch';
  maxCurrentA: number;
  isOn?: boolean;
  switchType?: 'toggle' | 'rocker' | 'battery';
};

// Type union pour les propriétés spécifiques
export type NodeSpecificProps =
  | ConsumerProps
  | BatteryProps
  | SolarProps
  | AlternatorProps
  | ChargerProps
  | InverterProps
  | BusProps
  | FuseProps
  | SwitchProps;

// Type complet d'un ElectricalNode
export type ElectricalNode = ElectricalNodeBase & NodeSpecificProps;

// ----------------------------------------------------------------------------
// Connection (Câble)
// ----------------------------------------------------------------------------

export type Connection = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: PortType;
  toPort?: PortType;
  sectionMm2: number;          // Section du câble en mm²
  lengthM: number;             // Longueur en mètres (auto-calculée)
  cableType: CableType;
  color?: string;              // Couleur du câble (pour affichage)
  label?: string;              // Étiquette optionnelle
  waypoints?: Point[];         // Points de passage pour le routage
  // Propriétés calculées
  voltageDrop?: number;        // Chute de tension en %
  fuseRating?: number;         // Fusible recommandé en A
};

// ----------------------------------------------------------------------------
// Boat Schema
// ----------------------------------------------------------------------------

export type BoatZone = {
  id: string;
  name: string;
  path: string;    // SVG path
  color?: string;
  fill?: string;   // Couleur de remplissage
  dashed?: boolean; // Ligne pointillée
};

export type BoatTemplate = {
  id: string;
  name: string;
  icon: string;
  viewBox: string;           // "0 0 width height"
  outlinePath: string;       // SVG path du contour
  zones?: BoatZone[];        // Zones optionnelles
  defaultScale?: number;
};

// ----------------------------------------------------------------------------
// Project Settings
// ----------------------------------------------------------------------------

export type ProjectSettings = {
  // Général
  defaultVoltage: Voltage;       // Tension par défaut du système
  
  // Autonomie
  daysAutonomy: number;          // Jours d'autonomie souhaités
  
  // Solaire
  sunHoursPerDay: number;        // Heures d'ensoleillement
  defaultSolarEfficiency: number; // Efficacité par défaut
  
  // Batterie
  defaultDodLead: number;        // DoD plomb
  defaultDodLifepo4: number;     // DoD LiFePO4
  
  // Câbles
  maxVoltageDrop: number;        // % de chute max acceptée
  copperResistivity: number;     // Ω·mm²/m
  
  // Affichage
  showGrid: boolean;
  gridSize: number;              // Taille grille en pixels
  snapToGrid: boolean;
};

export const DEFAULT_SETTINGS: ProjectSettings = {
  defaultVoltage: 12,
  daysAutonomy: 2,
  sunHoursPerDay: 5,
  defaultSolarEfficiency: 0.7,
  defaultDodLead: 0.5,
  defaultDodLifepo4: 0.8,
  maxVoltageDrop: 3,
  copperResistivity: 0.0175,
  showGrid: true,
  gridSize: 20,
  snapToGrid: true,
};

// ----------------------------------------------------------------------------
// Project
// ----------------------------------------------------------------------------

export type Project = {
  id: string;
  name: string;
  
  // Schéma du bateau
  boatTemplateId: string;        // ID du template ou 'custom'
  customBackground?: string;     // URI image personnalisée
  boatTransform?: {              // Transformation du bateau sur le canvas
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  
  // Données électriques
  nodes: ElectricalNode[];
  connections: Connection[];
  
  // Configuration
  settings: ProjectSettings;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
};

// ----------------------------------------------------------------------------
// Types utilitaires pour la création
// ----------------------------------------------------------------------------

export type CreateNodeInput = Omit<ElectricalNode, 'id'>;
export type CreateConnectionInput = Omit<Connection, 'id' | 'lengthM' | 'voltageDrop' | 'fuseRating'> & {
  cableType?: CableType;  // Optionnel, défaut: 'single'
};

// Template pour la bibliothèque (sans id ni position)
// On utilise un type plus flexible pour permettre toutes les propriétés spécifiques
export type NodeTemplateBase = {
  id?: string;           // ID optionnel du template (peut être généré)
  type: NodeType;
  name: string;
  icon: string;
  voltage: Voltage;
  rotation?: number;
  locked?: boolean;
};

// Type template complet avec propriétés optionnelles
export type NodeTemplate = NodeTemplateBase & {
  // Consumer
  powerW?: number;
  currentA?: number;
  dailyHours?: number;
  dutyCycle?: number;
  category?: string;
  // Battery
  capacityAh?: number;
  chemistry?: BatteryChemistry;
  quantity?: number;
  configuration?: 'series' | 'parallel';
  // Solar/Alternator
  maxPowerW?: number;
  efficiency?: number;
  engineHoursPerDay?: number;
  // Charger
  inputVoltage?: 110 | 220;
  // Inverter
  outputVoltage?: 110 | 220;
  // Bus/Fuse/Switch
  maxCurrentA?: number;
  portCount?: number;
  ratingA?: number;
  fuseType?: 'blade' | 'anl' | 'mega' | 'breaker';
  isOn?: boolean;
  switchType?: 'toggle' | 'rocker' | 'battery';
};

// ----------------------------------------------------------------------------
// Types pour les calculs
// ----------------------------------------------------------------------------

export type EnergyBalance = {
  // Consommation
  totalDailyConsumptionAh: number;
  totalInstantPowerW: number;
  maxCurrentA: number;
  
  // Production
  solarDailyProductionAh: number;
  alternatorDailyProductionAh: number;
  chargerDailyProductionAh: number;
  totalDailyProductionAh: number;
  
  // Batterie
  totalBatteryCapacityAh: number;
  usableBatteryCapacityAh: number;
  requiredBatteryCapacityAh: number;
  
  // Bilan
  dailyBalanceAh: number;          // Production - Consommation
  estimatedAutonomyDays: number;
  batteryStatus: 'ok' | 'warning' | 'critical';
};

export type CableAnalysis = {
  connectionId: string;
  currentA: number;
  voltageDrop: number;
  voltageDropPercent: number;
  powerLossW: number;
  recommendedSectionMm2: number;
  status: 'ok' | 'warning' | 'overload';
};

export type CircuitValidation = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  type: 'voltage_mismatch' | 'overcurrent' | 'no_source' | 'disconnected';
  nodeIds?: string[];
  connectionId?: string;
  message: string;
};

export type ValidationWarning = {
  type: 'voltage_drop' | 'undersized_cable' | 'low_battery' | 'unbalanced';
  nodeIds?: string[];
  connectionId?: string;
  message: string;
};
