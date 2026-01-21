// ============================================================================
// ElectricBoat v2.0 - Templates de bateaux SVG
// ============================================================================

import type { BoatTemplate } from '../models/types';

/**
 * Templates de bateaux prédéfinis
 * Les paths SVG représentent une vue de dessus (plan)
 * Orientation : proue en haut, poupe en bas
 */
export const boatTemplates: BoatTemplate[] = [
  // -------------------------------------------------------------------------
  // Voilier monocoque 30-35 pieds
  // -------------------------------------------------------------------------
  {
    id: 'sailboat-30',
    name: 'Voilier 30\'',
    icon: '⛵',
    viewBox: '0 0 200 500',
    // Forme réaliste: proue pointue en haut, poupe plate/arrondie en bas, côtés courbes
    outlinePath: `
      M 100 15
      Q 100 5, 100 15
      C 55 25, 25 80, 20 160
      Q 15 250, 18 340
      Q 20 400, 35 440
      L 45 455
      Q 60 465, 100 468
      Q 140 465, 155 455
      L 165 440
      Q 180 400, 182 340
      Q 185 250, 180 160
      C 175 80, 145 25, 100 15
      Z
    `,
    zones: [
      {
        id: 'bow',
        name: 'Proue',
        path: 'M 100 15 C 55 25, 25 80, 20 160 L 180 160 C 175 80, 145 25, 100 15 Z',
        color: 'rgba(59, 130, 246, 0.1)',
      },
      {
        id: 'cabin',
        name: 'Cabine',
        path: 'M 20 160 Q 15 250, 18 300 L 182 300 Q 185 250, 180 160 Z',
        color: 'rgba(16, 185, 129, 0.1)',
      },
      {
        id: 'cockpit',
        name: 'Cockpit',
        path: 'M 18 300 Q 18 360, 25 400 L 175 400 Q 182 360, 182 300 Z',
        color: 'rgba(245, 158, 11, 0.1)',
      },
      {
        id: 'stern',
        name: 'Poupe',
        path: 'M 25 400 Q 20 430, 45 455 Q 60 465, 100 468 Q 140 465, 155 455 Q 180 430, 175 400 Z',
        color: 'rgba(239, 68, 68, 0.1)',
      },
    ],
    defaultScale: 1,
  },

  // -------------------------------------------------------------------------
  // Voilier monocoque 40-45 pieds
  // -------------------------------------------------------------------------
  {
    id: 'sailboat-40',
    name: 'Voilier 40\'',
    icon: '⛵',
    viewBox: '0 0 220 550',
    // Forme réaliste plus grande: proue effilée, poupe transom
    outlinePath: `
      M 110 12
      Q 110 5, 110 12
      C 60 25, 25 90, 20 180
      Q 15 280, 18 380
      Q 20 450, 40 490
      L 55 510
      L 80 520
      L 110 522
      L 140 520
      L 165 510
      L 180 490
      Q 200 450, 202 380
      Q 205 280, 200 180
      C 195 90, 160 25, 110 12
      Z
    `,
    zones: [
      {
        id: 'bow',
        name: 'Proue',
        path: 'M 110 12 C 60 25, 25 90, 20 180 L 200 180 C 195 90, 160 25, 110 12 Z',
      },
      {
        id: 'forward-cabin',
        name: 'Cabine avant',
        path: 'M 20 180 Q 15 230, 17 280 L 203 280 Q 205 230, 200 180 Z',
      },
      {
        id: 'salon',
        name: 'Carré',
        path: 'M 17 280 Q 16 330, 18 380 L 202 380 Q 204 330, 203 280 Z',
      },
      {
        id: 'cockpit',
        name: 'Cockpit',
        path: 'M 18 380 Q 18 420, 30 460 L 190 460 Q 202 420, 202 380 Z',
      },
      {
        id: 'stern',
        name: 'Poupe',
        path: 'M 30 460 Q 20 480, 55 510 L 80 520 L 110 522 L 140 520 L 165 510 Q 200 480, 190 460 Z',
      },
    ],
    defaultScale: 0.9,
  },

  // -------------------------------------------------------------------------
  // Catamaran
  // -------------------------------------------------------------------------
  {
    id: 'catamaran-40',
    name: 'Catamaran 40\'',
    icon: '🚤',
    viewBox: '0 0 350 500',
    outlinePath: `
      M 50 20 
      Q 50 10, 50 20
      C 25 30, 15 70, 15 120
      L 15 400
      Q 15 450, 35 470
      L 55 475
      L 70 470
      Q 90 450, 90 400
      L 90 120
      C 90 70, 80 30, 50 20
      Z
      
      M 300 20
      Q 300 10, 300 20
      C 325 30, 335 70, 335 120
      L 335 400
      Q 335 450, 315 470
      L 295 475
      L 280 470
      Q 260 450, 260 400
      L 260 120
      C 260 70, 270 30, 300 20
      Z
      
      M 90 150 L 260 150 L 260 170 L 90 170 Z
      M 90 380 L 260 380 L 260 400 L 90 400 Z
    `,
    zones: [
      {
        id: 'hull-port',
        name: 'Coque bâbord',
        path: 'M 50 20 C 25 20, 15 60, 15 100 L 15 400 C 15 450, 25 480, 50 485 L 70 485 C 85 480, 90 450, 90 400 L 90 100 C 90 60, 80 20, 50 20 Z',
      },
      {
        id: 'hull-starboard',
        name: 'Coque tribord',
        path: 'M 300 20 C 325 20, 335 60, 335 100 L 335 400 C 335 450, 325 480, 300 485 L 280 485 C 265 480, 260 450, 260 400 L 260 100 C 260 60, 270 20, 300 20 Z',
      },
      {
        id: 'bridge',
        name: 'Nacelle',
        path: 'M 90 150 L 260 150 L 260 400 L 90 400 Z',
      },
    ],
    defaultScale: 0.85,
  },

  // -------------------------------------------------------------------------
  // Motor Yacht
  // -------------------------------------------------------------------------
  {
    id: 'motor-yacht-35',
    name: 'Yacht à moteur 35\'',
    icon: '🛥️',
    viewBox: '0 0 200 450',
    outlinePath: `
      M 100 15
      C 55 15, 30 50, 25 90
      L 20 350
      L 20 400
      L 40 420
      L 80 430
      L 100 432
      L 120 430
      L 160 420
      L 180 400
      L 180 350
      L 175 90
      C 170 50, 145 15, 100 15
      Z
    `,
    zones: [
      {
        id: 'bow',
        name: 'Proue',
        path: 'M 100 15 C 55 15, 30 50, 25 90 L 175 90 C 170 50, 145 15, 100 15 Z',
      },
      {
        id: 'forward-deck',
        name: 'Pont avant',
        path: 'M 25 90 L 20 180 L 180 180 L 175 90 Z',
      },
      {
        id: 'cabin',
        name: 'Cabine',
        path: 'M 20 180 L 20 300 L 180 300 L 180 180 Z',
      },
      {
        id: 'cockpit',
        name: 'Cockpit',
        path: 'M 20 300 L 20 400 L 180 400 L 180 300 Z',
      },
      {
        id: 'stern',
        name: 'Poupe',
        path: 'M 20 400 L 40 420 L 80 430 L 120 430 L 160 420 L 180 400 Z',
      },
    ],
    defaultScale: 1,
  },

  // -------------------------------------------------------------------------
  // Petit bateau / Annexe
  // -------------------------------------------------------------------------
  {
    id: 'dinghy',
    name: 'Annexe',
    icon: '🚣',
    viewBox: '0 0 120 250',
    outlinePath: `
      M 60 10
      C 35 10, 20 35, 15 60
      L 10 190
      C 10 215, 25 235, 45 240
      L 60 242
      L 75 240
      C 95 235, 110 215, 110 190
      L 105 60
      C 100 35, 85 10, 60 10
      Z
    `,
    zones: [
      {
        id: 'bow',
        name: 'Avant',
        path: 'M 60 10 C 35 10, 20 35, 15 60 L 105 60 C 100 35, 85 10, 60 10 Z',
      },
      {
        id: 'main',
        name: 'Zone principale',
        path: 'M 15 60 L 10 190 C 10 215, 25 235, 45 240 L 75 240 C 95 235, 110 215, 110 190 L 105 60 Z',
      },
    ],
    defaultScale: 1.5,
  },

  // -------------------------------------------------------------------------
  // Template vide (pour image personnalisée)
  // -------------------------------------------------------------------------
  {
    id: 'custom',
    name: 'Personnalisé',
    icon: '📷',
    viewBox: '0 0 400 600',
    outlinePath: '', // Pas de contour, l'utilisateur met son image
    defaultScale: 1,
  },
];

/**
 * Récupère un template par son ID
 */
export function getBoatTemplate(id: string): BoatTemplate | undefined {
  return boatTemplates.find(t => t.id === id);
}

/**
 * Template par défaut
 */
export const DEFAULT_BOAT_TEMPLATE = boatTemplates[0];
