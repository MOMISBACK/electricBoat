// ============================================================================
// ElectricBoat v2.0 - Types et fonctions géométriques
// ============================================================================

import type { Point } from './types';

// ----------------------------------------------------------------------------
// Types géométriques additionnels
// ----------------------------------------------------------------------------

export type Size = {
  width: number;
  height: number;
};

export type Rect = Point & Size;

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type Line = {
  start: Point;
  end: Point;
};

export type Transform = {
  scale: number;
  translateX: number;
  translateY: number;
  rotation?: number;
};

// ----------------------------------------------------------------------------
// Fonctions utilitaires
// ----------------------------------------------------------------------------

/**
 * Calcule la distance euclidienne entre deux points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcule le point milieu entre deux points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calcule l'angle entre deux points en radians
 */
export function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Calcule l'angle entre deux points en degrés
 */
export function angleDegrees(p1: Point, p2: Point): number {
  return angle(p1, p2) * (180 / Math.PI);
}

/**
 * Vérifie si un point est dans un rectangle
 */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Vérifie si un point est dans un cercle
 */
export function pointInCircle(point: Point, center: Point, radius: number): boolean {
  return distance(point, center) <= radius;
}

/**
 * Calcule les bounds d'un ensemble de points
 */
export function getBounds(points: Point[]): Bounds | null {
  if (points.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  
  return { minX, minY, maxX, maxY };
}

/**
 * Convertit des Bounds en Rect
 */
export function boundsToRect(bounds: Bounds): Rect {
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

/**
 * Agrandit un rectangle d'un padding
 */
export function expandRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * Snap un point sur une grille
 */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Calcule la longueur totale d'un chemin (avec waypoints)
 */
export function pathLength(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Génère un chemin orthogonal entre deux points (pour les câbles)
 */
export function orthogonalPath(start: Point, end: Point): Point[] {
  const midX = (start.x + end.x) / 2;
  
  // Si les points sont proches horizontalement, utiliser un chemin vertical d'abord
  if (Math.abs(end.x - start.x) < Math.abs(end.y - start.y)) {
    const midY = (start.y + end.y) / 2;
    return [
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end,
    ];
  }
  
  // Sinon, chemin horizontal d'abord
  return [
    start,
    { x: midX, y: start.y },
    { x: midX, y: end.y },
    end,
  ];
}

/**
 * Applique une transformation à un point
 */
export function transformPoint(point: Point, transform: Transform): Point {
  const { scale, translateX, translateY, rotation = 0 } = transform;
  
  // Rotation
  const rad = rotation * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotatedX = point.x * cos - point.y * sin;
  const rotatedY = point.x * sin + point.y * cos;
  
  // Scale et translation
  return {
    x: rotatedX * scale + translateX,
    y: rotatedY * scale + translateY,
  };
}

/**
 * Inverse une transformation sur un point (pour convertir coordonnées écran vers canvas)
 */
export function inverseTransformPoint(point: Point, transform: Transform): Point {
  const { scale, translateX, translateY, rotation = 0 } = transform;
  
  // Inverse translation et scale
  const x = (point.x - translateX) / scale;
  const y = (point.y - translateY) / scale;
  
  // Inverse rotation
  const rad = -rotation * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

/**
 * Calcule le centre d'un rectangle
 */
export function rectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Vérifie si deux rectangles se chevauchent
 */
export function rectsIntersect(r1: Rect, r2: Rect): boolean {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Clamp une valeur entre min et max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Lerp (interpolation linéaire)
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Lerp entre deux points
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  };
}
