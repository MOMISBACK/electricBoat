import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// Type de projet compatible avec l'ancien format
// Sera migré vers le nouveau type Project plus tard
type LegacyProject = {
  id: string;
  name: string;
  backgroundImage?: string;
  devices: Array<{
    id: string;
    name: string;
    voltage: 12 | 24;
    powerW?: number;
    currentA?: number;
    dailyHours: number;
    dutyCycle: number;
    position: { x: number; y: number };
  }>;
  sources: Array<{
    id: string;
    type: 'battery' | 'solar' | 'alternator' | 'wind';
    voltage: 12 | 24;
    capacityAh?: number;
    powerW?: number;
    efficiency?: number;
  }>;
  cables: Array<{
    id: string;
    fromId: string;
    toId: string;
    lengthM: number;
    sectionMm2: number;
    maxCurrentA: number;
  }>;
};

// ----------------------------------------------------------------------------
// Web Storage (localStorage)
// ----------------------------------------------------------------------------

const WEB_STORAGE_KEY = 'electricboat_projects';

const getWebProjects = (): LegacyProject[] => {
  try {
    const stored = localStorage.getItem(WEB_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setWebProjects = (projects: LegacyProject[]): void => {
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Failed to save projects to localStorage:', e);
  }
};

// ----------------------------------------------------------------------------
// Native Storage (expo-file-system)
// ----------------------------------------------------------------------------

const BASE_DIR = Platform.OS !== 'web' 
  ? (FileSystem.documentDirectory ?? FileSystem.cacheDirectory)
  : null;

const PROJECTS_DIR = BASE_DIR ? `${BASE_DIR}projects` : '';

async function ensureProjectsDir(): Promise<void> {
  if (Platform.OS === 'web' || !PROJECTS_DIR) return;
  const dirInfo = await FileSystem.getInfoAsync(PROJECTS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PROJECTS_DIR, { intermediates: true });
  }
}

export async function listProjects(): Promise<LegacyProject[]> {
  // Web: utiliser localStorage
  if (Platform.OS === 'web') {
    return getWebProjects();
  }
  
  // Native: utiliser expo-file-system
  await ensureProjectsDir();
  const files = await FileSystem.readDirectoryAsync(PROJECTS_DIR);
  const projects: LegacyProject[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const content = await FileSystem.readAsStringAsync(`${PROJECTS_DIR}/${file}`);
    try {
      const project = JSON.parse(content) as LegacyProject;
      projects.push(project);
    } catch {
      // Ignore invalid project files
    }
  }

  return projects;
}

export async function saveProject(project: LegacyProject): Promise<void> {
  // Web: utiliser localStorage
  if (Platform.OS === 'web') {
    const projects = getWebProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    setWebProjects(projects);
    return;
  }
  
  // Native: utiliser expo-file-system
  await ensureProjectsDir();
  const filePath = `${PROJECTS_DIR}/${project.id}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(project));
}

export async function loadProject(projectId: string): Promise<LegacyProject | null> {
  // Web: utiliser localStorage
  if (Platform.OS === 'web') {
    const projects = getWebProjects();
    return projects.find(p => p.id === projectId) || null;
  }
  
  // Native: utiliser expo-file-system
  await ensureProjectsDir();
  const filePath = `${PROJECTS_DIR}/${projectId}.json`;
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) return null;
  const content = await FileSystem.readAsStringAsync(filePath);
  return JSON.parse(content) as LegacyProject;
}

export async function deleteProject(projectId: string): Promise<void> {
  // Web: utiliser localStorage
  if (Platform.OS === 'web') {
    const projects = getWebProjects();
    setWebProjects(projects.filter(p => p.id !== projectId));
    return;
  }
  
  // Native: utiliser expo-file-system
  await ensureProjectsDir();
  const filePath = `${PROJECTS_DIR}/${projectId}.json`;
  const info = await FileSystem.getInfoAsync(filePath);
  if (info.exists) {
    await FileSystem.deleteAsync(filePath);
  }
}
