// ============================================================================
// ElectricBoat v2.0 - Écran d'édition du schéma électrique
// ============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import type { Point, ElectricalNode, NodeTemplate } from '../models/types';
import { useProjectStore } from '../store/useProjectStore';
import { useEditorStore } from '../store/useEditorStore';
import { colors, spacing } from '../theme';

// Composants
import { BoatCanvas } from '../components/canvas';
import { Toolbar, NodeLibraryPanel, PropertiesPanel } from '../components/editor';
import { AnalysisPanel } from '../components/analysis';
import { Toast, type ToastType } from '../components';

// ============================================================================
// Composant principal
// ============================================================================

export function EditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { projectId } = route.params as { projectId: string };

  // Stores
  const {
    project,
    isDirty,
    addNode,
    moveNode,
    addConnection,
    removeConnection,
    markSaved,
  } = useProjectStore();

  const {
    mode,
    selection,
    setSelection,
    clearSelection,
    libraryOpen,
    toggleLibrary,
    setLibraryOpen,
    pendingConnection,
    startConnection,
    cancelConnection,
    showToast,
    hideToast,
    toast: editorToast,
  } = useEditorStore();

  // State local
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [propertiesVisible, setPropertiesVisible] = useState(false);
  const [analysisVisible, setAnalysisVisible] = useState(false);

  // Layout handler
  const handleCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  // Handler: Tap sur un node
  const handleNodeTap = useCallback((nodeId: string) => {
    if (mode === 'cabling') {
      // Mode câblage: créer une connexion
      if (!pendingConnection) {
        // Premier node sélectionné
        startConnection(nodeId);
        showToast('Sélectionnez le second équipement', 'info');
      } else if (pendingConnection.fromNodeId !== nodeId) {
        // Second node: créer la connexion
        addConnection({
          fromNodeId: pendingConnection.fromNodeId,
          toNodeId: nodeId,
          sectionMm2: 2.5, // Section par défaut
          cableType: 'single', // Type par défaut
        });
        cancelConnection();
        showToast('Câble créé', 'success');
      }
    } else {
      // Autres modes: sélectionner le node
      setSelection({ type: 'node', id: nodeId });
      setPropertiesVisible(true);
    }
  }, [mode, pendingConnection, startConnection, addConnection, cancelConnection, setSelection, showToast]);

  // Handler: Tap sur le canvas
  const handleCanvasTap = useCallback((position: Point) => {
    if (mode === 'placement') {
      // En mode placement, désélectionner (la bibliothèque s'ouvre via le bouton +)
      clearSelection();
    } else if (mode === 'cabling' && pendingConnection) {
      // Annuler la connexion en cours
      cancelConnection();
      showToast('Connexion annulée', 'info');
    } else {
      // Désélectionner
      clearSelection();
    }
  }, [mode, pendingConnection, cancelConnection, clearSelection, showToast]);

  // Handler: Drag d'un node terminé
  const handleNodeDragEnd = useCallback((nodeId: string, position: Point) => {
    moveNode(nodeId, position);
  }, [moveNode]);

  // Handler: Tap sur un câble
  const handleConnectionTap = useCallback((connectionId: string) => {
    setSelection({ type: 'connection', id: connectionId });
  }, [setSelection]);

  // Handler: Suppression d'un câble
  const handleConnectionDelete = useCallback((connectionId: string) => {
    removeConnection(connectionId);
    clearSelection();
    showToast('Câble supprimé', 'success');
  }, [removeConnection, clearSelection, showToast]);

  // Handler: Sélection d'un node depuis la bibliothèque
  const handleSelectNodeFromLibrary = useCallback((template: NodeTemplate, position: Point) => {
    showToast(`${template.name} ajouté`, 'success');
  }, [showToast]);

  // Handler: Fermer bibliothèque
  const handleCloseLibrary = useCallback(() => {
    setLibraryOpen(false);
  }, [setLibraryOpen]);

  // Handler: Sauvegarde
  const handleSave = useCallback(async () => {
    try {
      markSaved();
      showToast('Projet sauvegardé', 'success');
    } catch (error) {
      showToast('Erreur de sauvegarde', 'error');
    }
  }, [markSaved, showToast]);

  // Handler: Fermer le panneau propriétés
  const handleCloseProperties = useCallback(() => {
    setPropertiesVisible(false);
  }, []);

  // Handler: Ouvrir/fermer le panneau d'analyse
  const handleToggleAnalysis = useCallback(() => {
    setAnalysisVisible(prev => !prev);
  }, []);

  // Handler: Retour à la liste des projets
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Effet: Ouvrir les propriétés quand une sélection change
  useEffect(() => {
    if (selection?.id) {
      setPropertiesVisible(true);
    }
  }, [selection?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Barre d'outils */}
      <Toolbar
        onBack={handleBack}
        onSave={handleSave}
        onAnalysis={handleToggleAnalysis}
      />

      {/* Canvas */}
      <View style={styles.canvasContainer} onLayout={handleCanvasLayout}>
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <BoatCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            onNodeTap={handleNodeTap}
            onCanvasTap={handleCanvasTap}
            onNodeDragEnd={handleNodeDragEnd}
            onConnectionTap={handleConnectionTap}
            onConnectionDelete={handleConnectionDelete}
          />
        )}

        {/* Indicateur de mode câblage */}
        {mode === 'cabling' && pendingConnection && (
          <View style={styles.cablingIndicator}>
            <Text style={styles.cablingText}>
              🔌 Sélectionnez le second équipement
            </Text>
          </View>
        )}

        {/* Bouton flottant pour ajouter */}
        {mode === 'placement' && (
          <TouchableOpacity
            style={styles.fab}
            onPress={toggleLibrary}
            activeOpacity={0.8}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Panneau de bibliothèque */}
      <NodeLibraryPanel
        visible={libraryOpen}
        onClose={handleCloseLibrary}
        onSelectNode={handleSelectNodeFromLibrary}
      />

      {/* Panneau de propriétés */}
      <PropertiesPanel
        visible={propertiesVisible}
        onClose={handleCloseProperties}
      />

      {/* Panneau d'analyse */}
      <AnalysisPanel
        visible={analysisVisible}
        onClose={() => setAnalysisVisible(false)}
      />

      {/* Toast notifications */}
      {editorToast && (
        <Toast
          message={editorToast.message}
          type={editorToast.type}
          visible={true}
          onHide={hideToast}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  cablingIndicator: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cablingText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: colors.surface,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default EditorScreen;
