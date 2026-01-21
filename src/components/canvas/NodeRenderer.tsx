// ============================================================================
// ElectricBoat v2.0 - Rendu d'un node électrique sur le canvas
// ============================================================================

import React, { useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { G, Circle, Rect, Text as SvgText, Path } from 'react-native-svg';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedProps, runOnJS } from 'react-native-reanimated';

import type { ElectricalNode, Point, EditorMode } from '../../models/types';
import { colors } from '../../theme';
import { snapToGrid } from '../../models/geometry';

// Animated components
const AnimatedG = Animated.createAnimatedComponent(G);

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface NodeRendererProps {
  node: ElectricalNode;
  isSelected: boolean;
  boatTransform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  editorMode: EditorMode;
  onTap?: () => void;
  onDragEnd?: (position: Point) => void;
}

// ----------------------------------------------------------------------------
// Constantes
// ----------------------------------------------------------------------------

const NODE_SIZE = 40;
const ICON_SIZE = 24;

// Couleurs par type de node
const nodeColors: Record<ElectricalNode['type'], string> = {
  consumer: colors.warning,
  battery: colors.success,
  solar: colors.info,
  alternator: colors.primary,
  charger: colors.accent,
  bus: colors.textSecondary,
  inverter: colors.accent,
  fuse: colors.error,
  switch: colors.textMuted,
};

// Icônes par type (émojis simplifiés en paths SVG serait mieux, mais pour l'instant on utilise du texte)
const nodeIcons: Record<ElectricalNode['type'], string> = {
  consumer: '💡',
  battery: '🔋',
  solar: '☀️',
  alternator: '⚡',
  charger: '🔌',
  bus: '⬛',
  inverter: '🔄',
  fuse: '⚠️',
  switch: '🔘',
};

// ----------------------------------------------------------------------------
// Composant
// ----------------------------------------------------------------------------

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  boatTransform,
  editorMode,
  onTap,
  onDragEnd,
}) => {
  // Position avec transformation
  const screenX = boatTransform.offsetX + node.position.x * boatTransform.scale;
  const screenY = boatTransform.offsetY + node.position.y * boatTransform.scale;
  
  // Shared values pour le drag
  const translateX = useSharedValue(screenX);
  const translateY = useSharedValue(screenY);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  
  // Ref pour tracker le drag sur le web (empêche le clic après drag)
  const wasDraggingRef = useRef(false);

  // Couleur du node
  const nodeColor = nodeColors[node.type] || colors.primary;
  const nodeIcon = node.icon || nodeIcons[node.type];

  // Callback pour fin de drag (doit être appelé depuis le thread JS)
  const handleDragEnd = useCallback((x: number, y: number) => {
    // Marquer qu'on vient de drag (pour empêcher le clic sur le web)
    wasDraggingRef.current = true;
    setTimeout(() => { wasDraggingRef.current = false; }, 100);
    
    if (onDragEnd) {
      // Convertir en coordonnées canvas
      const canvasX = (x - boatTransform.offsetX) / boatTransform.scale;
      const canvasY = (y - boatTransform.offsetY) / boatTransform.scale;
      // Snap to grid
      const snapped = snapToGrid({ x: canvasX, y: canvasY }, 10);
      onDragEnd(snapped);
    }
  }, [onDragEnd, boatTransform]);

  // Gesture: Tap
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (onTap) {
        runOnJS(onTap)();
      }
    });

  // Gesture: Long press + drag (en mode placement uniquement)
  const dragGesture = Gesture.Pan()
    .enabled(editorMode === 'placement' && !node.locked)
    .minDistance(5)
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(handleDragEnd)(translateX.value, translateY.value);
    });

  // Combiner les gestures
  const composedGesture = Gesture.Race(dragGesture, tapGesture);

  // Taille adaptée au zoom
  const size = NODE_SIZE / boatTransform.scale;
  const iconSize = ICON_SIZE / boatTransform.scale;
  const strokeWidth = 2 / boatTransform.scale;
  const fontSize = 10 / boatTransform.scale;

  // Props animées pour le groupe
  const animatedProps = useAnimatedProps(() => ({
    x: translateX.value,
    y: translateY.value,
  }));

  // Props pour le clic compatible web
  const webClickProps = Platform.OS === 'web' 
    ? {
        onClick: (e: any) => {
          e.stopPropagation(); // Empêcher la propagation au canvas
          e.preventDefault();
          e._nodeHandled = true; // Marquer l'événement comme traité par un node
          // Ne pas déclencher le tap si on vient de terminer un drag
          if (wasDraggingRef.current) return;
          onTap && onTap();
        },
        onMouseDown: (e: any) => {
          // Marquer le début d'un potentiel drag
          if (editorMode === 'placement' && !node.locked) {
            wasDraggingRef.current = false;
          }
        },
        style: { cursor: editorMode === 'placement' ? 'grab' : 'pointer' } as any,
      }
    : {};

  return (
    <GestureDetector gesture={composedGesture}>
      <G
        x={screenX}
        y={screenY}
      >
        {/* Cercle de sélection */}
        {isSelected && (
          <Circle
            cx={0}
            cy={0}
            r={size / 2 + 4 / boatTransform.scale}
            fill="transparent"
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={`${4 / boatTransform.scale},${4 / boatTransform.scale}`}
          />
        )}

        {/* Fond du node */}
        <Circle
          cx={0}
          cy={0}
          r={size / 2}
          fill={colors.surface}
          stroke={nodeColor}
          strokeWidth={strokeWidth}
        />

        {/* Indicateur de couleur (petit cercle en haut) */}
        <Circle
          cx={0}
          cy={-size / 2 + 6 / boatTransform.scale}
          r={4 / boatTransform.scale}
          fill={nodeColor}
        />

        {/* Icône */}
        <SvgText
          x={0}
          y={2 / boatTransform.scale}
          fontSize={iconSize}
          textAnchor="middle"
          alignmentBaseline="central"
        >
          {nodeIcon}
        </SvgText>

        {/* Nom du node (en dessous) */}
        <SvgText
          x={0}
          y={size / 2 + 12 / boatTransform.scale}
          fontSize={fontSize}
          fill={colors.text}
          textAnchor="middle"
          fontWeight={isSelected ? 'bold' : 'normal'}
        >
          {node.name.length > 12 ? node.name.substring(0, 10) + '...' : node.name}
        </SvgText>

        {/* Badge de puissance/capacité */}
        {(node.type === 'consumer' && node.powerW) && (
          <G>
            <Rect
              x={size / 4}
              y={-size / 2 - 8 / boatTransform.scale}
              width={24 / boatTransform.scale}
              height={12 / boatTransform.scale}
              rx={4 / boatTransform.scale}
              fill={colors.warning}
            />
            <SvgText
              x={size / 4 + 12 / boatTransform.scale}
              y={-size / 2 - 2 / boatTransform.scale}
              fontSize={8 / boatTransform.scale}
              fill={colors.surface}
              textAnchor="middle"
            >
              {node.powerW}W
            </SvgText>
          </G>
        )}

        {(node.type === 'battery' && node.capacityAh) && (
          <G>
            <Rect
              x={size / 4}
              y={-size / 2 - 8 / boatTransform.scale}
              width={28 / boatTransform.scale}
              height={12 / boatTransform.scale}
              rx={4 / boatTransform.scale}
              fill={colors.success}
            />
            <SvgText
              x={size / 4 + 14 / boatTransform.scale}
              y={-size / 2 - 2 / boatTransform.scale}
              fontSize={8 / boatTransform.scale}
              fill={colors.surface}
              textAnchor="middle"
            >
              {node.capacityAh}Ah
            </SvgText>
          </G>
        )}

        {/* Indicateur de verrouillage */}
        {node.locked && (
          <SvgText
            x={-size / 2 + 4 / boatTransform.scale}
            y={-size / 2 + 4 / boatTransform.scale}
            fontSize={10 / boatTransform.scale}
          >
            🔒
          </SvgText>
        )}

        {/* Zone cliquable invisible pour la compatibilité web */}
        <Rect
          x={-size / 2 - 5}
          y={-size / 2 - 5}
          width={size + 10}
          height={size + 25}
          fill="transparent"
          {...webClickProps}
        />
      </G>
    </GestureDetector>
  );
};

export default NodeRenderer;
