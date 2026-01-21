// ============================================================================
// ElectricBoat v2.0 - Compatibilité avec l'ancien store
// Ce fichier sera supprimé une fois les écrans migrés
// ============================================================================

import { create } from 'zustand';
import type { Device, PowerSource, Cable, Point } from '../models/types';

// Ancien type de projet pour compatibilité
type LegacyProject = {
  id: string;
  name: string;
  backgroundImage?: string;
  devices: Device[];
  sources: PowerSource[];
  cables: Cable[];
};

const emptyProject: LegacyProject = {
  id: 'new',
  name: 'Nouveau projet',
  devices: [],
  sources: [],
  cables: [],
};

type Store = {
  project: LegacyProject;
  setProject: (project: LegacyProject) => void;
  updateProjectName: (name: string) => void;
  
  // Devices
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  moveDevice: (id: string, pos: Point) => void;
  removeDevice: (id: string) => void;
  
  // Sources
  addSource: (source: PowerSource) => void;
  updateSource: (id: string, updates: Partial<PowerSource>) => void;
  removeSource: (id: string) => void;
  
  // Cables
  addCable: (cable: Cable) => void;
  updateCable: (id: string, updates: Partial<Cable>) => void;
  removeCable: (id: string) => void;
  
  // Reset
  resetProject: () => void;
};

export const useStore = create<Store>((set) => ({
  project: emptyProject,
  
  setProject: (project) => set({ project }),
  
  updateProjectName: (name) =>
    set((state) => ({
      project: { ...state.project, name },
    })),
  
  // Devices
  addDevice: (device) =>
    set((state) => ({
      project: {
        ...state.project,
        devices: [...state.project.devices, device],
      },
    })),
    
  updateDevice: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        devices: state.project.devices.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      },
    })),
    
  moveDevice: (id, pos) =>
    set((state) => ({
      project: {
        ...state.project,
        devices: state.project.devices.map((d) =>
          d.id === id ? { ...d, position: pos } : d
        ),
      },
    })),
    
  removeDevice: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        devices: state.project.devices.filter((d) => d.id !== id),
        cables: state.project.cables.filter(
          (c) => c.fromId !== id && c.toId !== id
        ),
      },
    })),
  
  // Sources
  addSource: (source) =>
    set((state) => ({
      project: {
        ...state.project,
        sources: [...state.project.sources, source],
      },
    })),
    
  updateSource: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        sources: state.project.sources.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),
    
  removeSource: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        sources: state.project.sources.filter((s) => s.id !== id),
      },
    })),
  
  // Cables
  addCable: (cable) =>
    set((state) => ({
      project: {
        ...state.project,
        cables: [...state.project.cables, cable],
      },
    })),
    
  updateCable: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        cables: state.project.cables.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    })),
    
  removeCable: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        cables: state.project.cables.filter((c) => c.id !== id),
      },
    })),
  
  // Reset
  resetProject: () => set({ project: emptyProject }),
}));
