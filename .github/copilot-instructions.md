# ElectricBoat v2.0 - Instructions de développement

## Vision
Application de schéma électrique interactif pour bateaux avec :
- Vue 2D du bateau (vue de dessus)
- Placement visuel des équipements par drag & drop
- Câblage interactif entre composants
- Calculs automatiques en temps réel

## Stack technique
- React Native + Expo (managed workflow)
- TypeScript strict
- Zustand pour l'état global
- react-native-svg pour le rendu graphique du canvas
- react-native-gesture-handler pour les interactions
- expo-file-system pour la persistance offline

## Architecture

### Structure des dossiers
```
src/
├── components/
│   ├── ui/           # Composants UI génériques (Button, Card, Modal...)
│   ├── canvas/       # Composants du canvas (BoatCanvas, NodeRenderer, CableRenderer...)
│   ├── editor/       # Outils d'édition (Toolbar, NodeLibrary, PropertiesPanel...)
│   └── analysis/     # Visualisation analyse (EnergyGauge, AlertBadge...)
├── data/             # Bibliothèques (nodeLibrary, boatTemplates, cableStandards)
├── models/           # Types TypeScript (types.ts, geometry.ts)
├── screens/          # Écrans de l'application
├── store/            # État global Zustand (useProjectStore, useEditorStore)
├── utils/
│   ├── calculations/ # Logique de calcul (power, battery, cables, validation)
│   └── geometry.ts   # Fonctions géométriques
├── storage/          # Persistance locale
└── theme/            # Design system (colors, spacing, typography)
```

## Conventions

### Composants
- Composants UI génériques dans `src/components/ui/`
- Composants canvas SVG dans `src/components/canvas/`
- Respecter le thème de couleurs dans `src/theme/colors.ts`

### Types
- Types stricts dans `src/models/types.ts`
- Types géométriques dans `src/models/geometry.ts`
- Utiliser `ElectricalNode` au lieu de Device/PowerSource séparés

### Calculs
- Calculs de puissance dans `src/utils/calculations/power.ts`
- Calculs batterie dans `src/utils/calculations/battery.ts`
- Calculs câbles dans `src/utils/calculations/cables.ts`
- Validation circuit dans `src/utils/calculations/validation.ts`

### État global
- `useProjectStore` : données du projet (nodes, connections, settings)
- `useEditorStore` : état de l'éditeur (mode, sélection, zoom, pan)

## Modèle de données principal

### ElectricalNode
```typescript
type NodeType = 'consumer' | 'battery' | 'solar' | 'alternator' | 'charger' | 'bus';

type ElectricalNode = {
  id: string;
  type: NodeType;
  name: string;
  icon: string;
  position: { x: number; y: number };
  voltage: 12 | 24 | 48;
  // Propriétés selon type...
};
```

### Connection (Câble)
```typescript
type Connection = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  sectionMm2: number;
  lengthM: number; // Auto-calculé
};
```

## Règles métier
- Un node consumer doit avoir `powerW` OU `currentA`
- Les longueurs de câbles sont calculées depuis les positions des nodes
- DoD par défaut: Plomb = 0.5, LiFePO4 = 0.8
- Autonomie par défaut: 2 jours
- Efficacité solaire par défaut: 70%
- Heures de soleil par défaut: 5h/jour
- Chute de tension max acceptée: 3%
- Résistivité cuivre: 0.0175 Ω·mm²/m

## Modes d'interaction
- `view` : Pan/zoom, inspection info
- `placement` : Drag & drop équipements
- `cabling` : Création de connexions
- `analysis` : Visualisation des flux

## Commandes
- `npm run ios` - Lancer sur iOS
- `npm run android` - Lancer sur Android
- `npm run web` - Lancer en mode web
- `npx tsc --noEmit` - Vérifier les types

