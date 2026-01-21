// ============================================================================
// ElectricBoat v2.0 - Store du projet (données persistantes)
// ============================================================================

import { create } from 'zustand';
import type { 
  Connection, 
  CreateConnectionInput, 
  CreateNodeInput, 
  ElectricalNode, 
  Point, 
  Project, 
  ProjectSettings,
} from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';
import { distance } from '../models/geometry';

// Génération d'ID unique simple
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ----------------------------------------------------------------------------
// Projet vide par défaut
// ----------------------------------------------------------------------------

const createEmptyProject = (): Project => ({
  id: generateId(),
  name: 'Nouveau projet',
  boatTemplateId: 'sailboat-30',
  nodes: [],
  connections: [],
  settings: { ...DEFAULT_SETTINGS },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ----------------------------------------------------------------------------
// Types du store
// ----------------------------------------------------------------------------

type ProjectStore = {
  // État
  project: Project;
  isDirty: boolean;
  
  // Actions projet
  setProject: (project: Project) => void;
  createNewProject: (project: Project) => void;
  loadProject: (project: Project) => void;
  updateProjectName: (name: string) => void;
  setBoatTemplate: (templateId: string) => void;
  setCustomBackground: (uri: string | undefined) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  resetProject: () => void;
  markSaved: () => void;
  
  // Actions nodes
  addNode: (input: CreateNodeInput) => ElectricalNode;
  updateNode: (id: string, updates: Partial<Omit<ElectricalNode, 'type'>>) => void;
  moveNode: (id: string, position: Point) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => ElectricalNode | null;
  
  // Actions connections
  addConnection: (input: CreateConnectionInput) => Connection;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  removeConnection: (id: string) => void;
  
  // Sélecteurs
  getNode: (id: string) => ElectricalNode | undefined;
  getConnection: (id: string) => Connection | undefined;
  getConnectionsForNode: (nodeId: string) => Connection[];
  getConnectedNodes: (nodeId: string) => ElectricalNode[];
};

// ----------------------------------------------------------------------------
// Calcul de longueur de câble
// ----------------------------------------------------------------------------

const calculateCableLength = (
  fromNode: ElectricalNode,
  toNode: ElectricalNode,
  waypoints?: Point[]
): number => {
  const points = [
    fromNode.position,
    ...(waypoints || []),
    toNode.position,
  ];
  
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i], points[i + 1]);
  }
  
  // Conversion pixels vers mètres (1 pixel = 2cm environ)
  const PIXELS_TO_METERS = 0.02;
  return Math.round(total * PIXELS_TO_METERS * 10) / 10;
};

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createEmptyProject(),
  isDirty: false,
  
  // ---------------------------------------------------------------------------
  // Actions projet
  // ---------------------------------------------------------------------------
  
  setProject: (project) => set({ 
    project, 
    isDirty: false 
  }),
  
  createNewProject: (project) => set({ 
    project, 
    isDirty: false 
  }),
  
  loadProject: (project) => set({ 
    project, 
    isDirty: false 
  }),
  
  updateProjectName: (name) => set((state) => ({
    project: { 
      ...state.project, 
      name,
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  setBoatTemplate: (templateId) => set((state) => ({
    project: {
      ...state.project,
      boatTemplateId: templateId,
      customBackground: templateId === 'custom' ? state.project.customBackground : undefined,
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  setCustomBackground: (uri) => set((state) => ({
    project: {
      ...state.project,
      customBackground: uri,
      boatTemplateId: uri ? 'custom' : state.project.boatTemplateId,
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  updateSettings: (settings) => set((state) => ({
    project: {
      ...state.project,
      settings: { ...state.project.settings, ...settings },
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  resetProject: () => set({ 
    project: createEmptyProject(), 
    isDirty: false 
  }),
  
  markSaved: () => set({ isDirty: false }),
  
  // ---------------------------------------------------------------------------
  // Actions nodes
  // ---------------------------------------------------------------------------
  
  addNode: (input) => {
    const node: ElectricalNode = {
      ...input,
      id: generateId(),
    } as ElectricalNode;
    
    set((state) => ({
      project: {
        ...state.project,
        nodes: [...state.project.nodes, node],
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
    
    return node;
  },
  
  updateNode: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      nodes: state.project.nodes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  moveNode: (id, position) => {
    const { project } = get();
    const node = project.nodes.find((n) => n.id === id);
    
    if (!node || node.locked) return;
    
    // Mettre à jour la position du node
    set((state) => ({
      project: {
        ...state.project,
        nodes: state.project.nodes.map((n) =>
          n.id === id ? { ...n, position } : n
        ),
        // Recalculer les longueurs de câbles connectés
        connections: state.project.connections.map((c) => {
          if (c.fromNodeId === id || c.toNodeId === id) {
            const fromNode = c.fromNodeId === id 
              ? { ...node, position } 
              : state.project.nodes.find((n) => n.id === c.fromNodeId);
            const toNode = c.toNodeId === id 
              ? { ...node, position } 
              : state.project.nodes.find((n) => n.id === c.toNodeId);
            
            if (fromNode && toNode) {
              return {
                ...c,
                lengthM: calculateCableLength(fromNode, toNode, c.waypoints),
              };
            }
          }
          return c;
        }),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  },
  
  removeNode: (id) => set((state) => ({
    project: {
      ...state.project,
      nodes: state.project.nodes.filter((n) => n.id !== id),
      // Supprimer aussi les connexions liées
      connections: state.project.connections.filter(
        (c) => c.fromNodeId !== id && c.toNodeId !== id
      ),
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  duplicateNode: (id) => {
    const { project, addNode } = get();
    const node = project.nodes.find((n) => n.id === id);
    
    if (!node) return null;
    
    // Créer une copie avec une position décalée
    const { id: _, ...nodeWithoutId } = node;
    const newNode = addNode({
      ...nodeWithoutId,
      name: `${node.name} (copie)`,
      position: {
        x: node.position.x + 30,
        y: node.position.y + 30,
      },
    });
    
    return newNode;
  },
  
  // ---------------------------------------------------------------------------
  // Actions connections
  // ---------------------------------------------------------------------------
  
  addConnection: (input) => {
    const { project } = get();
    const fromNode = project.nodes.find((n) => n.id === input.fromNodeId);
    const toNode = project.nodes.find((n) => n.id === input.toNodeId);
    
    if (!fromNode || !toNode) {
      throw new Error('Nodes not found for connection');
    }
    
    const connection: Connection = {
      ...input,
      id: generateId(),
      lengthM: calculateCableLength(fromNode, toNode, input.waypoints),
    };
    
    set((state) => ({
      project: {
        ...state.project,
        connections: [...state.project.connections, connection],
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
    
    return connection;
  },
  
  updateConnection: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      connections: state.project.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  removeConnection: (id) => set((state) => ({
    project: {
      ...state.project,
      connections: state.project.connections.filter((c) => c.id !== id),
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),
  
  // ---------------------------------------------------------------------------
  // Sélecteurs
  // ---------------------------------------------------------------------------
  
  getNode: (id) => get().project.nodes.find((n) => n.id === id),
  
  getConnection: (id) => get().project.connections.find((c) => c.id === id),
  
  getConnectionsForNode: (nodeId) => 
    get().project.connections.filter(
      (c) => c.fromNodeId === nodeId || c.toNodeId === nodeId
    ),
  
  getConnectedNodes: (nodeId) => {
    const { project } = get();
    const connections = project.connections.filter(
      (c) => c.fromNodeId === nodeId || c.toNodeId === nodeId
    );
    
    const connectedIds = new Set<string>();
    for (const c of connections) {
      if (c.fromNodeId !== nodeId) connectedIds.add(c.fromNodeId);
      if (c.toNodeId !== nodeId) connectedIds.add(c.toNodeId);
    }
    
    return project.nodes.filter((n) => connectedIds.has(n.id));
  },
}));
