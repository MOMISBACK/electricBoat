// ============================================================================
// ElectricBoat v2.0 - Calculs de câblage
// ============================================================================

import type { CableAnalysis, Connection, ElectricalNode } from '../../models/types';
import { cableStandards, COPPER_RESISTIVITY, MAX_VOLTAGE_DROP_PERCENT } from '../../data/cableStandards';
import { getNodeCurrent } from './power';

// ----------------------------------------------------------------------------
// Calculs de chute de tension
// ----------------------------------------------------------------------------

/**
 * Calcule la chute de tension dans un câble
 * @param currentA - Courant en ampères
 * @param lengthM - Longueur en mètres (aller simple, sera doublé pour l'aller-retour)
 * @param sectionMm2 - Section en mm²
 * @returns Chute de tension en volts
 */
export function calculateVoltageDrop(
  currentA: number,
  lengthM: number,
  sectionMm2: number
): number {
  // ΔV = 2 × ρ × L × I / S
  // Le facteur 2 compte l'aller-retour du courant
  return (2 * COPPER_RESISTIVITY * lengthM * currentA) / sectionMm2;
}

/**
 * Calcule la chute de tension en pourcentage
 */
export function calculateVoltageDropPercent(
  currentA: number,
  lengthM: number,
  sectionMm2: number,
  voltage: number
): number {
  const dropVolts = calculateVoltageDrop(currentA, lengthM, sectionMm2);
  return (dropVolts / voltage) * 100;
}

/**
 * Calcule la perte de puissance dans un câble
 */
export function calculatePowerLoss(
  currentA: number,
  lengthM: number,
  sectionMm2: number
): number {
  // P = I² × R, où R = 2 × ρ × L / S
  const resistance = (2 * COPPER_RESISTIVITY * lengthM) / sectionMm2;
  return currentA * currentA * resistance;
}

// ----------------------------------------------------------------------------
// Dimensionnement de câble
// ----------------------------------------------------------------------------

/**
 * Calcule la section minimale pour respecter une chute de tension max
 */
export function calculateMinSection(
  currentA: number,
  lengthM: number,
  voltage: number,
  maxDropPercent: number = MAX_VOLTAGE_DROP_PERCENT
): number {
  // S = 2 × ρ × L × I / (V × ΔV%)
  const maxDropVolts = voltage * (maxDropPercent / 100);
  if (maxDropVolts <= 0) return Infinity;
  
  return (2 * COPPER_RESISTIVITY * lengthM * currentA) / maxDropVolts;
}

/**
 * Trouve la section standard recommandée pour un courant et une longueur
 */
export function getRecommendedSection(
  currentA: number,
  lengthM: number,
  voltage: number,
  maxDropPercent: number = MAX_VOLTAGE_DROP_PERCENT
): number {
  // D'abord, section minimale pour la chute de tension
  const minSectionForDrop = calculateMinSection(currentA, lengthM, voltage, maxDropPercent);
  
  // Ensuite, section minimale pour le courant (avec marge de 25%)
  const requiredCurrent = currentA * 1.25;
  const sectionForCurrent = cableStandards.find(s => s.maxCurrentA >= requiredCurrent);
  const minSectionForCurrent = sectionForCurrent?.sectionMm2 ?? 0.5;
  
  // Prendre le max des deux
  const minSection = Math.max(minSectionForDrop, minSectionForCurrent);
  
  // Trouver la section standard supérieure
  const standard = cableStandards.find(s => s.sectionMm2 >= minSection);
  return standard?.sectionMm2 ?? cableStandards[cableStandards.length - 1].sectionMm2;
}

/**
 * Vérifie si un câble est correctement dimensionné
 */
export function isCableOversized(
  connection: Connection,
  currentA: number,
  voltage: number
): boolean {
  const recommended = getRecommendedSection(currentA, connection.lengthM, voltage);
  return connection.sectionMm2 > recommended * 1.5;
}

// ----------------------------------------------------------------------------
// Analyse complète d'un câble
// ----------------------------------------------------------------------------

/**
 * Analyse complète d'une connexion
 */
export function analyzeCable(
  connection: Connection,
  fromNode: ElectricalNode,
  toNode: ElectricalNode
): CableAnalysis {
  // Déterminer le courant qui passe dans le câble
  let currentA = 0;
  
  if (fromNode.type === 'consumer') {
    currentA = getNodeCurrent(fromNode);
  } else if (toNode.type === 'consumer') {
    currentA = getNodeCurrent(toNode);
  } else {
    // Pour les connexions entre sources/distribution, estimer le courant
    // basé sur la capacité de la source
    if (fromNode.type === 'battery' && 'capacityAh' in fromNode) {
      // Courant max typique = capacité / 5 (charge C/5)
      currentA = fromNode.capacityAh / 5;
    }
  }
  
  const voltage = fromNode.voltage;
  const voltageDrop = calculateVoltageDrop(currentA, connection.lengthM, connection.sectionMm2);
  const voltageDropPercent = (voltageDrop / voltage) * 100;
  const powerLossW = calculatePowerLoss(currentA, connection.lengthM, connection.sectionMm2);
  const recommendedSection = getRecommendedSection(currentA, connection.lengthM, voltage);
  
  // Déterminer le statut
  let status: CableAnalysis['status'] = 'ok';
  
  // Vérifier la surcharge (courant > max du câble)
  const cableSpec = cableStandards.find(s => s.sectionMm2 === connection.sectionMm2);
  const maxCurrent = cableSpec?.maxCurrentA ?? 0;
  
  if (currentA > maxCurrent) {
    status = 'overload';
  } else if (voltageDropPercent > MAX_VOLTAGE_DROP_PERCENT) {
    status = 'warning';
  }
  
  return {
    connectionId: connection.id,
    currentA: Math.round(currentA * 10) / 10,
    voltageDrop: Math.round(voltageDrop * 1000) / 1000,
    voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
    powerLossW: Math.round(powerLossW * 10) / 10,
    recommendedSectionMm2: recommendedSection,
    status,
  };
}

/**
 * Analyse tous les câbles d'un projet
 */
export function analyzeAllCables(
  connections: Connection[],
  nodes: ElectricalNode[]
): CableAnalysis[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  return connections.map(conn => {
    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);
    
    if (!fromNode || !toNode) {
      return {
        connectionId: conn.id,
        currentA: 0,
        voltageDrop: 0,
        voltageDropPercent: 0,
        powerLossW: 0,
        recommendedSectionMm2: 0.5,
        status: 'ok' as const,
      };
    }
    
    return analyzeCable(conn, fromNode, toNode);
  });
}

/**
 * Filtre les câbles en surcharge
 */
export function getOverloadedCables(analyses: CableAnalysis[]): CableAnalysis[] {
  return analyses.filter(a => a.status === 'overload');
}

/**
 * Filtre les câbles avec chute de tension excessive
 */
export function getHighVoltageDropCables(analyses: CableAnalysis[]): CableAnalysis[] {
  return analyses.filter(a => a.status === 'warning' || a.voltageDropPercent > MAX_VOLTAGE_DROP_PERCENT);
}

/**
 * Calcule la perte totale dans tous les câbles
 */
export function getTotalPowerLoss(analyses: CableAnalysis[]): number {
  return analyses.reduce((sum, a) => sum + a.powerLossW, 0);
}
