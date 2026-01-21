// ============================================================================
// ElectricBoat v2.0 - Rendu des câbles/connexions
// ============================================================================

import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { G, Path, Circle, Rect, Text as SvgText, Defs, Marker, Line } from 'react-native-svg';

import type { Connection, ElectricalNode, Point } from '../../models/types';
import { colors } from '../../theme';
import { midpoint, orthogonalPath } from '../../models/geometry';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface CableRendererProps {
  connections: Connection[];
  nodes: ElectricalNode[];
  selectedConnectionId?: string;
  editorMode?: 'view' | 'placement' | 'cabling' | 'analysis';
  boatTransform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  onConnectionTap?: (connectionId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
}

// ----------------------------------------------------------------------------
// Utilitaires
// ----------------------------------------------------------------------------

// Couleur selon la validité du câble
const getCableColor = (connection: Connection): string => {
  if (connection.voltageDrop && connection.voltageDrop > 3) {
    return colors.error; // Chute de tension trop importante
  }
  if (connection.voltageDrop && connection.voltageDrop > 2) {
    return colors.warning; // Avertissement
  }
  return colors.primary;
};

// Épaisseur selon la section
const getCableWidth = (sectionMm2: number, scale: number): number => {
  const baseWidth = Math.min(Math.max(sectionMm2 / 4, 1), 6);
  return baseWidth / scale;
};

// ----------------------------------------------------------------------------
// Composant pour un câble individuel
// ----------------------------------------------------------------------------

interface SingleCableProps {
  connection: Connection;
  fromNode: ElectricalNode;
  toNode: ElectricalNode;
  isSelected: boolean;
  editorMode?: 'view' | 'placement' | 'cabling' | 'analysis';
  boatTransform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  onTap?: () => void;
  onDelete?: () => void;
}

const SingleCable: React.FC<SingleCableProps> = ({
  connection,
  fromNode,
  toNode,
  isSelected,
  editorMode,
  boatTransform,
  onTap,
  onDelete,
}) => {
  // Positions transformées
  const from: Point = {
    x: boatTransform.offsetX + fromNode.position.x * boatTransform.scale,
    y: boatTransform.offsetY + fromNode.position.y * boatTransform.scale,
  };
  const to: Point = {
    x: boatTransform.offsetX + toNode.position.x * boatTransform.scale,
    y: boatTransform.offsetY + toNode.position.y * boatTransform.scale,
  };

  // Générer le path (ligne droite ou orthogonale selon les waypoints)
  const pathD = useMemo(() => {
    if (connection.waypoints && connection.waypoints.length > 0) {
      // Chemin avec waypoints
      const waypoints = connection.waypoints.map(wp => ({
        x: boatTransform.offsetX + wp.x * boatTransform.scale,
        y: boatTransform.offsetY + wp.y * boatTransform.scale,
      }));

      let d = `M ${from.x} ${from.y}`;
      waypoints.forEach(wp => {
        d += ` L ${wp.x} ${wp.y}`;
      });
      d += ` L ${to.x} ${to.y}`;
      return d;
    }

    // Chemin orthogonal simple
    const path = orthogonalPath(from, to);
    let d = `M ${path[0].x} ${path[0].y}`;
    for (let i = 1; i < path.length; i++) {
      d += ` L ${path[i].x} ${path[i].y}`;
    }
    return d;
  }, [from, to, connection.waypoints, boatTransform]);

  // Milieu du câble pour l'étiquette
  const mid = midpoint(from, to);

  // Points pour les indicateurs + et -
  const plusOffset = 18 / boatTransform.scale;
  const minusOffset = 18 / boatTransform.scale;

  const cableColor = getCableColor(connection);
  const cableWidth = getCableWidth(connection.sectionMm2, boatTransform.scale);
  const strokeWidth = 1 / boatTransform.scale;

  // Size for + and - indicators (bigger for visibility)
  const indicatorRadius = 14 / boatTransform.scale;

  // Calculer angle du câble pour orienter les indicateurs
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length; // Vecteur perpendiculaire
  const perpY = dx / length;
  const spacing = 4 / boatTransform.scale;

  // Déterminer si le fromNode est une source (pour afficher + vers la source)
  const isFromSource = ['battery', 'solar', 'alternator', 'charger'].includes(fromNode.type);

  return (
    <G {...(Platform.OS !== 'web' ? { onPress: onTap } : {})}>
      {/* Halo de sélection */}
      {isSelected && (
        <Path
          d={pathD}
          fill="none"
          stroke={colors.primary}
          strokeWidth={cableWidth * 4 + 6 / boatTransform.scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />
      )}

      {/* Câble POSITIF (rouge) - au-dessus */}
      <Path
        d={pathD}
        fill="none"
        stroke="#ef4444"
        strokeWidth={cableWidth + 0.5 / boatTransform.scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${perpX * spacing}, ${perpY * spacing})`}
      />

      {/* Câble NÉGATIF (bleu foncé) - en-dessous */}
      <Path
        d={pathD}
        fill="none"
        stroke="#1e3a8a"
        strokeWidth={cableWidth + 0.5 / boatTransform.scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${-perpX * spacing}, ${-perpY * spacing})`}
      />

      {/* Étiquette + côté SOURCE (toujours à gauche du câble, côté batterie) */}
      <G>
        {/* Fond rectangle rouge */}
        <Rect
          x={(isFromSource ? from.x : to.x) - 10 / boatTransform.scale}
          y={(isFromSource ? from.y : to.y) - 28 / boatTransform.scale}
          width={20 / boatTransform.scale}
          height={14 / boatTransform.scale}
          rx={4 / boatTransform.scale}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={1.5 / boatTransform.scale}
        />
        <SvgText
          x={isFromSource ? from.x : to.x}
          y={(isFromSource ? from.y : to.y) - 18 / boatTransform.scale}
          fontSize={12 / boatTransform.scale}
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          +
        </SvgText>
      </G>

      {/* Étiquette - côté CONSOMMATEUR (toujours à droite du câble, côté appareil) */}
      <G>
        {/* Fond rectangle bleu */}
        <Rect
          x={(isFromSource ? to.x : from.x) - 10 / boatTransform.scale}
          y={(isFromSource ? to.y : from.y) - 28 / boatTransform.scale}
          width={20 / boatTransform.scale}
          height={14 / boatTransform.scale}
          rx={4 / boatTransform.scale}
          fill="#1e3a8a"
          stroke="#ffffff"
          strokeWidth={1.5 / boatTransform.scale}
        />
        <SvgText
          x={isFromSource ? to.x : from.x}
          y={(isFromSource ? to.y : from.y) - 18 / boatTransform.scale}
          fontSize={12 / boatTransform.scale}
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          −
        </SvgText>
      </G>

      {/* Points de connexion source (rouge) */}
      <Circle
        cx={isFromSource ? from.x : to.x}
        cy={isFromSource ? from.y : to.y}
        r={6 / boatTransform.scale}
        fill="#ef4444"
        stroke="#ffffff"
        strokeWidth={2 / boatTransform.scale}
      />

      {/* Points de connexion consommateur (bleu) */}
      <Circle
        cx={isFromSource ? to.x : from.x}
        cy={isFromSource ? to.y : from.y}
        r={6 / boatTransform.scale}
        fill="#1e3a8a"
        stroke="#ffffff"
        strokeWidth={2 / boatTransform.scale}
      />

      {/* Bouton de suppression (mode câblage) - visible quand sélectionné */}
      {editorMode === 'cabling' && onDelete && (
        <G
          {...(Platform.OS !== 'web' ? { onPress: onDelete } : {})}
        >
          <Circle
            cx={mid.x}
            cy={mid.y}
            r={isSelected ? 18 / boatTransform.scale : 14 / boatTransform.scale}
            fill={isSelected ? '#dc2626' : '#6b7280'}
            stroke="#ffffff"
            strokeWidth={2 / boatTransform.scale}
            opacity={isSelected ? 1 : 0.7}
          />
          <SvgText
            x={mid.x}
            y={mid.y + 5 / boatTransform.scale}
            fontSize={isSelected ? 14 / boatTransform.scale : 12 / boatTransform.scale}
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="middle"
          >
            ✕
          </SvgText>
          {Platform.OS === 'web' && (
            <Circle
              cx={mid.x}
              cy={mid.y}
              r={isSelected ? 18 / boatTransform.scale : 14 / boatTransform.scale}
              fill="transparent"
              // @ts-ignore
              onClick={(e: any) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
              // @ts-ignore
              style={{ cursor: 'pointer' }}
            />
          )}
        </G>
      )}

      {/* Étiquette de section (au milieu) - seulement si pas de bouton suppression */}
      {isSelected && editorMode !== 'cabling' && (
        <G>
          <Circle
            cx={mid.x}
            cy={mid.y}
            r={12 / boatTransform.scale}
            fill={colors.surface}
            stroke={cableColor}
            strokeWidth={strokeWidth}
          />
          <SvgText
            x={mid.x}
            y={mid.y + 3 / boatTransform.scale}
            fontSize={8 / boatTransform.scale}
            fill={colors.text}
            textAnchor="middle"
          >
            {connection.sectionMm2}mm²
          </SvgText>
        </G>
      )}

      {/* Indicateur de chute de tension */}
      {connection.voltageDrop && connection.voltageDrop > 2 && (
        <G>
          <Circle
            cx={mid.x + 16 / boatTransform.scale}
            cy={mid.y}
            r={8 / boatTransform.scale}
            fill={connection.voltageDrop > 3 ? colors.error : colors.warning}
          />
          <SvgText
            x={mid.x + 16 / boatTransform.scale}
            y={mid.y + 3 / boatTransform.scale}
            fontSize={6 / boatTransform.scale}
            fill={colors.surface}
            textAnchor="middle"
          >
            {connection.voltageDrop.toFixed(1)}%
          </SvgText>
        </G>
      )}

      {/* Zone cliquable invisible pour le web */}
      {Platform.OS === 'web' && (
        <Path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(cableWidth + 10 / boatTransform.scale, 15 / boatTransform.scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
          // @ts-ignore - onClick est supporté sur le web mais pas dans les types
          onClick={(e: any) => {
            e.stopPropagation();
            e.preventDefault();
            e._nodeHandled = true; // Marquer comme traité
            onTap && onTap();
          }}
          // @ts-ignore - style avec cursor est pour le web
          style={{ cursor: 'pointer' }}
        />
      )}
    </G>
  );
};

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const CableRenderer: React.FC<CableRendererProps> = ({
  connections,
  nodes,
  selectedConnectionId,
  editorMode,
  boatTransform,
  onConnectionTap,
  onConnectionDelete,
}) => {
  // Créer un map pour accès rapide aux nodes
  const nodeMap = useMemo(() => {
    return new Map(nodes.map(n => [n.id, n]));
  }, [nodes]);

  // Filtrer les connexions valides (dont les deux nodes existent)
  const validConnections = useMemo(() => {
    return connections.filter(c =>
      nodeMap.has(c.fromNodeId) && nodeMap.has(c.toNodeId)
    );
  }, [connections, nodeMap]);

  return (
    <G>
      {validConnections.map(connection => {
        const fromNode = nodeMap.get(connection.fromNodeId)!;
        const toNode = nodeMap.get(connection.toNodeId)!;

        return (
          <SingleCable
            key={connection.id}
            connection={connection}
            fromNode={fromNode}
            toNode={toNode}
            isSelected={connection.id === selectedConnectionId}
            editorMode={editorMode}
            boatTransform={boatTransform}
            onTap={() => onConnectionTap?.(connection.id)}
            onDelete={() => onConnectionDelete?.(connection.id)}
          />
        );
      })}
    </G>
  );
};

export default CableRenderer;
