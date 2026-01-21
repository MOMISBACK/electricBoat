// ============================================================================
// ElectricBoat v2.0 - Canvas principal du bateau
// ============================================================================

import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { 
  Defs, 
  G, 
  Path, 
  Pattern, 
  Rect,
  ClipPath,
} from 'react-native-svg';
import { 
  Gesture, 
  GestureDetector,
  GestureUpdateEvent,
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';
import { boatTemplates, getBoatTemplate } from '../../data/boatTemplates';
import { colors } from '../../theme';
import { NodeRenderer } from './NodeRenderer';
import { CableRenderer } from './CableRenderer';
import { EnergyFlowOverlay } from '../analysis/EnergyFlowOverlay';
import { analyzeAllCables } from '../../utils/calculations/cables';
import type { Point } from '../../models/types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface BoatCanvasProps {
  width: number;
  height: number;
  onNodeTap?: (nodeId: string) => void;
  onCanvasTap?: (position: Point) => void;
  onNodeDragEnd?: (nodeId: string, position: Point) => void;
  onConnectionTap?: (connectionId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
}

// ----------------------------------------------------------------------------
// Grille de fond
// ----------------------------------------------------------------------------

const GridPattern: React.FC<{ cellSize: number }> = ({ cellSize }) => (
  <Defs>
    <Pattern
      id="grid"
      width={cellSize}
      height={cellSize}
      patternUnits="userSpaceOnUse"
    >
      <Path
        d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
        fill="none"
        stroke={colors.border}
        strokeWidth={0.5}
        opacity={0.5}
      />
    </Pattern>
    <Pattern
      id="gridMajor"
      width={cellSize * 5}
      height={cellSize * 5}
      patternUnits="userSpaceOnUse"
    >
      <Path
        d={`M ${cellSize * 5} 0 L 0 0 0 ${cellSize * 5}`}
        fill="none"
        stroke={colors.border}
        strokeWidth={1}
        opacity={0.3}
      />
    </Pattern>
  </Defs>
);

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export const BoatCanvas: React.FC<BoatCanvasProps> = ({
  width,
  height,
  onNodeTap,
  onCanvasTap,
  onNodeDragEnd,
  onConnectionTap,
  onConnectionDelete,
}) => {
  const { project } = useProjectStore();
  const { 
    transform, 
    setTransform, 
    showGrid, 
    mode,
    selection,
  } = useEditorStore();

  // Shared values pour les animations
  const scale = useSharedValue(transform.scale);
  const translateX = useSharedValue(transform.panX);
  const translateY = useSharedValue(transform.panY);
  
  // Valeurs de départ pour les gestures
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Template du bateau
  const template = useMemo(() => {
    return getBoatTemplate(project.boatTemplateId) || boatTemplates[0];
  }, [project.boatTemplateId]);

  // Analyses des câbles (pour le mode analyse)
  const cableAnalyses = useMemo(() => {
    if (mode !== 'analysis') return [];
    return analyzeAllCables(project.connections, project.nodes);
  }, [project.connections, project.nodes, mode]);

  // Calculer la transformation pour centrer le bateau
  const boatTransform = useMemo(() => {
    const [vx, vy, vw, vh] = template.viewBox.split(' ').map(Number);
    const boatScale = Math.min(
      (width * 0.8) / vw,
      (height * 0.8) / vh
    ) * (template.defaultScale ?? 1);
    
    const offsetX = (width - vw * boatScale) / 2;
    const offsetY = (height - vh * boatScale) / 2;
    
    return {
      scale: boatScale,
      offsetX,
      offsetY,
      viewBox: { x: vx, y: vy, width: vw, height: vh },
    };
  }, [template, width, height]);

  // Gesture: Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
      const newScale = Math.min(Math.max(startScale.value * e.scale, 0.5), 4);
      scale.value = newScale;
    })
    .onEnd(() => {
      setTransform({
        scale: scale.value,
        panX: translateX.value,
        panY: translateY.value,
      });
    });

  // Gesture: Pan
  const panGesture = Gesture.Pan()
    .minPointers(mode === 'view' ? 1 : 2) // 1 finger in view mode, 2 otherwise
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      setTransform({
        scale: scale.value,
        panX: translateX.value,
        panY: translateY.value,
      });
    });

  // Gesture: Tap sur le canvas
  const tapGesture = Gesture.Tap()
    .onEnd((e: GestureUpdateEvent<TapGestureHandlerEventPayload>) => {
      if (onCanvasTap && (mode === 'placement' || mode === 'cabling')) {
        // Convertir les coordonnées écran en coordonnées canvas
        const canvasX = (e.x - translateX.value) / scale.value;
        const canvasY = (e.y - translateY.value) / scale.value;
        onCanvasTap({ x: canvasX, y: canvasY });
      }
    });

  // Combiner les gestures
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(panGesture, tapGesture)
  );

  // Style animé pour le conteneur SVG
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Handler pour le tap sur un node
  const handleNodeTap = useCallback((nodeId: string) => {
    if (onNodeTap) {
      onNodeTap(nodeId);
    }
  }, [onNodeTap]);

  // Handler pour le drag d'un node
  const handleNodeDragEnd = useCallback((nodeId: string, position: Point) => {
    if (onNodeDragEnd) {
      onNodeDragEnd(nodeId, position);
    }
  }, [onNodeDragEnd]);

  // Handler pour le clic sur le canvas (web)
  const handleWebCanvasClick = useCallback((event: any) => {
    if (Platform.OS !== 'web') return;
    
    // Vérifier si l'événement a été marqué comme traité par un node/câble
    if (event.defaultPrevented || event._nodeHandled) {
      return;
    }
    
    // Vérifier que le clic est sur le fond du canvas, pas sur un élément interactif
    const target = event.target;
    const currentTarget = event.currentTarget;
    
    // Si c'est un clic direct sur le conteneur ou sur le SVG principal, c'est OK
    // Sinon, vérifier qu'on n'est pas sur un élément de node
    if (target !== currentTarget) {
      // Chercher si on est dans un groupe de node (G avec des circles)
      let el = target;
      while (el && el !== currentTarget) {
        // Si on trouve un cercle ou un rect qui n'est pas la grille, c'est un élément interactif
        const tagName = el.tagName?.toLowerCase();
        if (tagName === 'circle' || 
            (tagName === 'rect' && !el.getAttribute('fill')?.startsWith('url(#grid'))) {
          return; // C'est un clic sur un node ou câble, ignorer
        }
        el = el.parentElement;
      }
    }
    
    if (onCanvasTap && (mode === 'placement' || mode === 'cabling')) {
      const rect = currentTarget.getBoundingClientRect();
      const canvasX = (event.clientX - rect.left - translateX.value) / scale.value;
      const canvasY = (event.clientY - rect.top - translateY.value) / scale.value;
      onCanvasTap({ x: canvasX, y: canvasY });
    }
  }, [mode, onCanvasTap, translateX, translateY, scale]);

  // Props pour le conteneur sur le web
  const webContainerProps = Platform.OS === 'web' 
    ? { 
        onClick: handleWebCanvasClick,
        style: [styles.canvasContainer, { cursor: mode === 'view' ? 'grab' : 'crosshair' }] as any,
      }
    : { style: styles.canvasContainer };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View {...webContainerProps}>
          <Animated.View style={[styles.svgContainer, animatedStyle]}>
            <Svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
            >
              {/* Grille de fond */}
              {showGrid && (
                <>
                  <GridPattern cellSize={20} />
                  <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="url(#grid)"
                  />
                  <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="url(#gridMajor)"
                  />
                </>
              )}

              {/* Groupe transformé pour le bateau */}
              <G
                transform={`translate(${boatTransform.offsetX}, ${boatTransform.offsetY}) scale(${boatTransform.scale})`}
              >
                {/* Contour du bateau */}
                <Path
                  d={template.outlinePath}
                  fill={colors.surface}
                  stroke={colors.primary}
                  strokeWidth={2 / boatTransform.scale}
                />

                {/* Zones du bateau (cockpit, cabine, etc.) */}
                {(template.zones ?? []).map((zone) => (
                  <Path
                    key={zone.id}
                    d={zone.path}
                    fill={zone.fill || 'transparent'}
                    stroke={colors.textSecondary}
                    strokeWidth={1 / boatTransform.scale}
                    strokeDasharray={zone.dashed ? '4,4' : undefined}
                    opacity={0.5}
                  />
                ))}
              </G>

              {/* Câbles/Connexions */}
              <CableRenderer
                connections={project.connections}
                nodes={project.nodes}
                selectedConnectionId={selection?.type === 'connection' ? selection.id : undefined}
                editorMode={mode}
                boatTransform={boatTransform}
                onConnectionTap={onConnectionTap}
                onConnectionDelete={onConnectionDelete}
              />

              {/* Nodes/Équipements */}
              {project.nodes.map((node) => (
                <NodeRenderer
                  key={node.id}
                  node={node}
                  isSelected={selection?.type === 'node' && selection.id === node.id}
                  boatTransform={boatTransform}
                  editorMode={mode}
                  onTap={() => handleNodeTap(node.id)}
                  onDragEnd={(pos) => handleNodeDragEnd(node.id, pos)}
                />
              ))}

              {/* Overlay des flux énergétiques (mode analyse) */}
              <EnergyFlowOverlay
                nodes={project.nodes}
                connections={project.connections}
                cableAnalyses={cableAnalyses}
                visible={mode === 'analysis'}
              />
            </Svg>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

// ----------------------------------------------------------------------------
// Styles
// ----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default BoatCanvas;
