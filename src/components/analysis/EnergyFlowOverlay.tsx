// ============================================================================
// ElectricBoat v2.0 - Visualisation des flux énergétiques
// ============================================================================

import React, { useMemo } from 'react';
import { G, Circle, Text as SvgText, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

import type { ElectricalNode, Connection, CableAnalysis } from '../../models/types';
import { colors } from '../../theme';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface EnergyFlowOverlayProps {
  nodes: ElectricalNode[];
  connections: Connection[];
  cableAnalyses: CableAnalysis[];
  visible: boolean;
}

// ----------------------------------------------------------------------------
// Couleurs selon l'état
// ----------------------------------------------------------------------------

const getFlowColor = (voltageDropPercent: number): string => {
  if (voltageDropPercent >= 5) return '#ef4444';
  if (voltageDropPercent >= 3) return '#f59e0b';
  return '#22c55e';
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'battery': return '🔋';
    case 'solar': return '☀️';
    case 'alternator': return '⚡';
    case 'consumer': return '💡';
    case 'charger': return '🔌';
    case 'bus': return '⊕';
    default: return '•';
  }
};

// ----------------------------------------------------------------------------
// Summary Panel Component (left side table)
// ----------------------------------------------------------------------------

interface SummaryPanelProps {
  nodes: ElectricalNode[];
  cableAnalyses: CableAnalysis[];
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ nodes, cableAnalyses }) => {
  // Calculate totals
  const consumers = nodes.filter(n => n.type === 'consumer');
  const batteries = nodes.filter(n => n.type === 'battery');
  const solarPanels = nodes.filter(n => n.type === 'solar');

  const totalPowerW = consumers.reduce((sum, c) => {
    const power = (c as any).powerW ?? ((c as any).currentA ?? 0) * c.voltage;
    return sum + power;
  }, 0);

  const totalBatteryAh = batteries.reduce((sum, b) => sum + ((b as any).capacityAh ?? 0), 0);
  const totalSolarW = solarPanels.reduce((sum, p) => sum + ((p as any).maxPowerW ?? 0), 0);

  const highDropCount = cableAnalyses.filter(a => a.voltageDropPercent >= 3).length;

  const panelWidth = 180;
  const rowHeight = 22;
  const headerHeight = 28;
  const startY = 60;

  // Data rows
  const rows = [
    { label: 'Équipements', value: `${nodes.length}`, color: '#9ca3af' },
    { label: 'Consommateurs', value: `${consumers.length}`, color: '#f97316' },
    { label: 'Puissance totale', value: `${totalPowerW.toFixed(0)} W`, color: '#ef4444' },
    { label: 'Batteries', value: `${totalBatteryAh.toFixed(0)} Ah`, color: '#22c55e' },
    { label: 'Solaire', value: `${totalSolarW.toFixed(0)} Wc`, color: '#facc15' },
    { label: 'Câbles', value: `${cableAnalyses.length}`, color: '#60a5fa' },
    { label: 'Chute > 3%', value: `${highDropCount}`, color: highDropCount > 0 ? '#ef4444' : '#22c55e' },
  ];

  const totalHeight = headerHeight + rows.length * rowHeight + 10;

  return (
    <G>
      {/* Panel background */}
      <Rect
        x={10}
        y={startY}
        width={panelWidth}
        height={totalHeight}
        rx={8}
        ry={8}
        fill="#1f2937"
        opacity={0.95}
      />

      {/* Header */}
      <Rect
        x={10}
        y={startY}
        width={panelWidth}
        height={headerHeight}
        rx={8}
        ry={8}
        fill="#374151"
      />
      <Rect
        x={10}
        y={startY + headerHeight - 8}
        width={panelWidth}
        height={8}
        fill="#374151"
      />

      <SvgText
        x={20}
        y={startY + 18}
        fontSize={12}
        fontWeight="bold"
        fill="#f9fafb"
      >
        📊 Résumé
      </SvgText>

      {/* Data rows */}
      {rows.map((row, index) => {
        const y = startY + headerHeight + index * rowHeight + 16;
        return (
          <G key={row.label}>
            {/* Alternating row background */}
            {index % 2 === 0 && (
              <Rect
                x={10}
                y={startY + headerHeight + index * rowHeight}
                width={panelWidth}
                height={rowHeight}
                fill="#374151"
                opacity={0.3}
              />
            )}
            {/* Label */}
            <SvgText
              x={18}
              y={y}
              fontSize={10}
              fill="#9ca3af"
            >
              {row.label}
            </SvgText>
            {/* Value */}
            <SvgText
              x={panelWidth - 5}
              y={y}
              fontSize={11}
              fontWeight="600"
              fill={row.color}
              textAnchor="end"
            >
              {row.value}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
};

// ----------------------------------------------------------------------------
// Cable status indicator (simplified)
// ----------------------------------------------------------------------------

interface CableStatusProps {
  fromNode: ElectricalNode;
  toNode: ElectricalNode;
  analysis?: CableAnalysis;
}

const CableStatusIndicator: React.FC<CableStatusProps> = ({ fromNode, toNode, analysis }) => {
  if (!analysis) return null;

  const midX = (fromNode.position.x + toNode.position.x) / 2;
  const midY = (fromNode.position.y + toNode.position.y) / 2;

  const hasIssue = analysis.status !== 'ok' || analysis.voltageDropPercent >= 3;
  if (!hasIssue) return null; // Only show indicators for problematic cables

  const statusColor = getFlowColor(analysis.voltageDropPercent);

  return (
    <G>
      <Circle
        cx={midX}
        cy={midY - 15}
        r={10}
        fill={statusColor}
        stroke="#ffffff"
        strokeWidth={1.5}
      />
      <SvgText
        x={midX}
        y={midY - 11}
        fontSize={7}
        fontWeight="bold"
        fill="#ffffff"
        textAnchor="middle"
      >
        {analysis.voltageDropPercent.toFixed(1)}%
      </SvgText>
    </G>
  );
};

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const EnergyFlowOverlay: React.FC<EnergyFlowOverlayProps> = ({
  nodes,
  connections,
  cableAnalyses,
  visible,
}) => {
  if (!visible) return null;

  // Map des analyses par connection ID
  const analysisMap = useMemo(() => {
    const map = new Map<string, CableAnalysis>();
    cableAnalyses.forEach(a => map.set(a.connectionId, a));
    return map;
  }, [cableAnalyses]);

  // Map des nodes par ID
  const nodeMap = useMemo(() => {
    const map = new Map<string, ElectricalNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  return (
    <G>
      {/* Summary panel on the left */}
      <SummaryPanel nodes={nodes} cableAnalyses={cableAnalyses} />

      {/* Status indicators only for problematic cables */}
      {connections.map((conn) => {
        const fromNode = nodeMap.get(conn.fromNodeId);
        const toNode = nodeMap.get(conn.toNodeId);
        const analysis = analysisMap.get(conn.id);

        if (!fromNode || !toNode) return null;

        return (
          <CableStatusIndicator
            key={`status-${conn.id}`}
            fromNode={fromNode}
            toNode={toNode}
            analysis={analysis}
          />
        );
      })}
    </G>
  );
};

export default EnergyFlowOverlay;

