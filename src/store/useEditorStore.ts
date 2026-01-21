// ============================================================================
// ElectricBoat v2.0 - Store de l'éditeur (état UI transitoire)
// ============================================================================

import { create } from 'zustand';
import type { Point, EditorMode } from '../models/types';

// Ré-exporter EditorMode pour la compatibilité
export type { EditorMode } from '../models/types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type SelectionType = 'node' | 'connection' | 'zone';

export type Selection = {
  type: SelectionType;
  id: string;
};

export type PendingConnection = {
  fromNodeId: string;
  fromPort?: string;
  tempEndPoint?: Point;
};

export type CanvasTransform = {
  scale: number;
  panX: number;
  panY: number;
};

// ----------------------------------------------------------------------------
// Store de l'éditeur
// ----------------------------------------------------------------------------

type EditorStore = {
  // Mode d'interaction
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  
  // Sélection
  selection: Selection | null;
  multiSelection: Selection[];
  setSelection: (selection: Selection | null) => void;
  addToSelection: (selection: Selection) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Câblage en cours
  pendingConnection: PendingConnection | null;
  startConnection: (fromNodeId: string, fromPort?: string) => void;
  updateConnectionEndPoint: (point: Point) => void;
  cancelConnection: () => void;
  completedConnection: () => void;
  
  // Transformation du canvas (zoom/pan)
  transform: CanvasTransform;
  setTransform: (transform: Partial<CanvasTransform>) => void;
  resetTransform: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  
  // Panneau des propriétés
  propertiesPanelOpen: boolean;
  setPropertiesPanelOpen: (open: boolean) => void;
  togglePropertiesPanel: () => void;
  
  // Bibliothèque
  libraryOpen: boolean;
  setLibraryOpen: (open: boolean) => void;
  toggleLibrary: () => void;
  selectedLibraryCategory: string | null;
  setSelectedLibraryCategory: (categoryId: string | null) => void;
  
  // Drag & drop depuis la bibliothèque
  draggingTemplate: { templateIndex: number; categoryId: string } | null;
  setDraggingTemplate: (template: { templateIndex: number; categoryId: string } | null) => void;
  
  // Grille
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  toggleGrid: () => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  
  // Affichage
  showZones: boolean;
  setShowZones: (show: boolean) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  showFlowAnimation: boolean;
  setShowFlowAnimation: (show: boolean) => void;
  
  // Toast / messages
  toast: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideToast: () => void;
  
  // Undo/Redo (préparation)
  canUndo: boolean;
  canRedo: boolean;
};

// ----------------------------------------------------------------------------
// Valeurs par défaut
// ----------------------------------------------------------------------------

const DEFAULT_TRANSFORM: CanvasTransform = {
  scale: 1,
  panX: 0,
  panY: 0,
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ---------------------------------------------------------------------------
  // Mode
  // ---------------------------------------------------------------------------
  
  mode: 'view',
  setMode: (mode) => {
    set({ 
      mode,
      // Annuler le câblage en cours si on change de mode
      pendingConnection: null,
    });
  },
  
  // ---------------------------------------------------------------------------
  // Sélection
  // ---------------------------------------------------------------------------
  
  selection: null,
  multiSelection: [],
  
  setSelection: (selection) => set({ 
    selection,
    multiSelection: selection ? [selection] : [],
  }),
  
  addToSelection: (selection) => set((state) => {
    const exists = state.multiSelection.some((s) => s.id === selection.id);
    if (exists) return state;
    
    return {
      selection,
      multiSelection: [...state.multiSelection, selection],
    };
  }),
  
  removeFromSelection: (id) => set((state) => {
    const newMulti = state.multiSelection.filter((s) => s.id !== id);
    return {
      selection: state.selection?.id === id ? (newMulti[0] ?? null) : state.selection,
      multiSelection: newMulti,
    };
  }),
  
  clearSelection: () => set({ 
    selection: null, 
    multiSelection: [] 
  }),
  
  isSelected: (id) => get().multiSelection.some((s) => s.id === id),
  
  // ---------------------------------------------------------------------------
  // Câblage en cours
  // ---------------------------------------------------------------------------
  
  pendingConnection: null,
  
  startConnection: (fromNodeId, fromPort) => set({
    pendingConnection: { fromNodeId, fromPort },
  }),
  
  updateConnectionEndPoint: (point) => set((state) => {
    if (!state.pendingConnection) return state;
    return {
      pendingConnection: {
        ...state.pendingConnection,
        tempEndPoint: point,
      },
    };
  }),
  
  cancelConnection: () => set({ pendingConnection: null }),
  
  completedConnection: () => set({ pendingConnection: null }),
  
  // ---------------------------------------------------------------------------
  // Transformation canvas
  // ---------------------------------------------------------------------------
  
  transform: DEFAULT_TRANSFORM,
  
  setTransform: (transform) => set((state) => ({
    transform: { ...state.transform, ...transform },
  })),
  
  resetTransform: () => set({ transform: DEFAULT_TRANSFORM }),
  
  zoomIn: () => set((state) => ({
    transform: {
      ...state.transform,
      scale: Math.min(MAX_ZOOM, state.transform.scale + ZOOM_STEP),
    },
  })),
  
  zoomOut: () => set((state) => ({
    transform: {
      ...state.transform,
      scale: Math.max(MIN_ZOOM, state.transform.scale - ZOOM_STEP),
    },
  })),
  
  zoomToFit: () => set({ transform: DEFAULT_TRANSFORM }),
  
  // ---------------------------------------------------------------------------
  // Panneau propriétés
  // ---------------------------------------------------------------------------
  
  propertiesPanelOpen: false,
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  togglePropertiesPanel: () => set((state) => ({ 
    propertiesPanelOpen: !state.propertiesPanelOpen 
  })),
  
  // ---------------------------------------------------------------------------
  // Bibliothèque
  // ---------------------------------------------------------------------------
  
  libraryOpen: false,
  setLibraryOpen: (open) => set({ libraryOpen: open }),
  toggleLibrary: () => set((state) => ({ libraryOpen: !state.libraryOpen })),
  
  selectedLibraryCategory: null,
  setSelectedLibraryCategory: (categoryId) => set({ 
    selectedLibraryCategory: categoryId 
  }),
  
  // ---------------------------------------------------------------------------
  // Drag & drop
  // ---------------------------------------------------------------------------
  
  draggingTemplate: null,
  setDraggingTemplate: (template) => set({ draggingTemplate: template }),
  
  // ---------------------------------------------------------------------------
  // Grille
  // ---------------------------------------------------------------------------
  
  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  
  snapToGrid: true,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  
  gridSize: 20,
  setGridSize: (size) => set({ gridSize: size }),
  
  // ---------------------------------------------------------------------------
  // Affichage
  // ---------------------------------------------------------------------------
  
  showZones: true,
  setShowZones: (show) => set({ showZones: show }),
  
  showLabels: true,
  setShowLabels: (show) => set({ showLabels: show }),
  
  showFlowAnimation: false,
  setShowFlowAnimation: (show) => set({ showFlowAnimation: show }),
  
  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------
  
  toast: null,
  
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    
    // Auto-hide après 3 secondes
    setTimeout(() => {
      set((state) => {
        if (state.toast?.message === message) {
          return { toast: null };
        }
        return state;
      });
    }, 3000);
  },
  
  hideToast: () => set({ toast: null }),
  
  // ---------------------------------------------------------------------------
  // Undo/Redo (stub pour plus tard)
  // ---------------------------------------------------------------------------
  
  canUndo: false,
  canRedo: false,
}));
