// ============================================================================
// ElectricBoat v2.0 - Validation du circuit électrique
// ============================================================================

import type { 
  CircuitValidation, 
  Connection, 
  ElectricalNode, 
  ValidationError, 
  ValidationWarning 
} from '../../models/types';
import { analyzeAllCables } from './cables';
import { 
  getBatteryStatus, 
  getTotalBatteryCapacityAh 
} from './battery';
import { 
  getTotalDailyConsumptionAh, 
  getTotalDailyProductionAh 
} from './power';

// ----------------------------------------------------------------------------
// Validation complète du circuit
// ----------------------------------------------------------------------------

/**
 * Valide l'ensemble du circuit électrique
 */
export function validateCircuit(
  nodes: ElectricalNode[],
  connections: Connection[]
): CircuitValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 1. Vérifier qu'il y a au moins une source d'énergie
  const hasBattery = nodes.some(n => n.type === 'battery');
  if (!hasBattery) {
    errors.push({
      type: 'no_source',
      message: 'Aucune batterie dans le circuit',
    });
  }
  
  // 2. Vérifier les incompatibilités de voltage
  const voltageErrors = checkVoltageMismatch(nodes, connections);
  errors.push(...voltageErrors);
  
  // 3. Vérifier les nodes non connectés
  const disconnectedWarnings = checkDisconnectedNodes(nodes, connections);
  warnings.push(...disconnectedWarnings);
  
  // 4. Vérifier les câbles
  const cableAnalyses = analyzeAllCables(connections, nodes);
  
  // Câbles en surcharge
  for (const analysis of cableAnalyses) {
    if (analysis.status === 'overload') {
      errors.push({
        type: 'overcurrent',
        connectionId: analysis.connectionId,
        message: `Câble en surcharge (${analysis.currentA}A)`,
      });
    }
  }
  
  // Câbles avec chute de tension excessive
  for (const analysis of cableAnalyses) {
    if (analysis.status === 'warning') {
      warnings.push({
        type: 'voltage_drop',
        connectionId: analysis.connectionId,
        message: `Chute de tension élevée (${analysis.voltageDropPercent.toFixed(1)}%)`,
      });
    }
    
    if (analysis.recommendedSectionMm2 > 0) {
      const conn = connections.find(c => c.id === analysis.connectionId);
      if (conn && conn.sectionMm2 < analysis.recommendedSectionMm2) {
        warnings.push({
          type: 'undersized_cable',
          connectionId: analysis.connectionId,
          message: `Section recommandée : ${analysis.recommendedSectionMm2} mm² (actuel : ${conn.sectionMm2} mm²)`,
        });
      }
    }
  }
  
  // 5. Vérifier le dimensionnement batterie
  const batteryStatus = getBatteryStatus(nodes);
  if (batteryStatus === 'critical') {
    warnings.push({
      type: 'low_battery',
      message: 'Capacité batterie insuffisante pour 2 jours d\'autonomie',
    });
  } else if (batteryStatus === 'warning') {
    warnings.push({
      type: 'low_battery',
      message: 'Capacité batterie limitée (moins de 2 jours d\'autonomie)',
    });
  }
  
  // 6. Vérifier l'équilibre production/consommation
  const dailyConsumption = getTotalDailyConsumptionAh(nodes);
  const dailyProduction = getTotalDailyProductionAh(nodes);
  
  if (dailyProduction > 0 && dailyConsumption > 0) {
    const ratio = dailyProduction / dailyConsumption;
    if (ratio < 0.8) {
      warnings.push({
        type: 'unbalanced',
        message: `Production insuffisante (${Math.round(ratio * 100)}% de la consommation)`,
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ----------------------------------------------------------------------------
// Vérifications spécifiques
// ----------------------------------------------------------------------------

/**
 * Vérifie les incompatibilités de voltage entre nodes connectés
 */
function checkVoltageMismatch(
  nodes: ElectricalNode[],
  connections: Connection[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  for (const conn of connections) {
    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);
    
    if (fromNode && toNode && fromNode.voltage !== toNode.voltage) {
      errors.push({
        type: 'voltage_mismatch',
        nodeIds: [fromNode.id, toNode.id],
        connectionId: conn.id,
        message: `Incompatibilité de voltage : ${fromNode.voltage}V ↔ ${toNode.voltage}V`,
      });
    }
  }
  
  return errors;
}

/**
 * Vérifie les nodes non connectés
 */
function checkDisconnectedNodes(
  nodes: ElectricalNode[],
  connections: Connection[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Créer un set de tous les nodes connectés
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }
  
  // Vérifier chaque node (sauf bus et switches qui peuvent être seuls)
  for (const node of nodes) {
    if (node.type === 'bus' || node.type === 'switch' || node.type === 'fuse') {
      continue; // Ces types peuvent exister sans connexion
    }
    
    if (!connectedNodeIds.has(node.id)) {
      warnings.push({
        type: 'voltage_drop', // Réutiliser ce type pour "disconnected"
        nodeIds: [node.id],
        message: `"${node.name}" n'est pas connecté`,
      });
    }
  }
  
  return warnings;
}

// ----------------------------------------------------------------------------
// Vérification de la connectivité
// ----------------------------------------------------------------------------

/**
 * Vérifie si un consommateur est connecté à une source d'énergie
 */
export function isNodeConnectedToSource(
  nodeId: string,
  nodes: ElectricalNode[],
  connections: Connection[]
): boolean {
  const visited = new Set<string>();
  const queue = [nodeId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    const currentNode = nodes.find(n => n.id === currentId);
    if (!currentNode) continue;
    
    // Si on trouve une source, c'est bon
    if (currentNode.type === 'battery' || currentNode.type === 'solar' || 
        currentNode.type === 'alternator' || currentNode.type === 'charger') {
      return true;
    }
    
    // Sinon, ajouter les voisins à la queue
    for (const conn of connections) {
      if (conn.fromNodeId === currentId && !visited.has(conn.toNodeId)) {
        queue.push(conn.toNodeId);
      }
      if (conn.toNodeId === currentId && !visited.has(conn.fromNodeId)) {
        queue.push(conn.fromNodeId);
      }
    }
  }
  
  return false;
}

/**
 * Trouve tous les nodes non alimentés
 */
export function findUnpoweredConsumers(
  nodes: ElectricalNode[],
  connections: Connection[]
): ElectricalNode[] {
  return nodes
    .filter(n => n.type === 'consumer')
    .filter(n => !isNodeConnectedToSource(n.id, nodes, connections));
}

// ----------------------------------------------------------------------------
// Résumé de validation
// ----------------------------------------------------------------------------

/**
 * Génère un résumé textuel de la validation
 */
export function getValidationSummary(validation: CircuitValidation): string {
  if (validation.isValid && validation.warnings.length === 0) {
    return '✅ Circuit valide, aucun problème détecté';
  }
  
  const parts: string[] = [];
  
  if (validation.errors.length > 0) {
    parts.push(`❌ ${validation.errors.length} erreur(s)`);
  }
  
  if (validation.warnings.length > 0) {
    parts.push(`⚠️ ${validation.warnings.length} avertissement(s)`);
  }
  
  return parts.join(', ');
}
