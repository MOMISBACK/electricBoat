// ============================================================================
// ElectricBoat v2.0 - Écran de liste des projets
// ============================================================================

import React, { useCallback, useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Project } from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';
import { useProjectStore } from '../store/useProjectStore';
import { boatTemplates } from '../data/boatTemplates';
import { colors, borderRadius, spacing, typography } from '../theme';

// ----------------------------------------------------------------------------
// Composant de carte de projet
// ----------------------------------------------------------------------------

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onLongPress: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, onLongPress }) => {
  const nodeCount = project.nodes.length;
  const connectionCount = project.connections.length;
  const template = boatTemplates.find(t => t.id === project.boatTemplateId);
  
  return (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>{template?.icon ?? '⛵'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{project.name}</Text>
          <Text style={styles.cardSubtitle}>
            {nodeCount} équipement{nodeCount !== 1 ? 's' : ''} · {connectionCount} câble{connectionCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      
      {/* Aperçu des équipements */}
      {nodeCount > 0 && (
        <View style={styles.nodesPreview}>
          {project.nodes.slice(0, 4).map((node) => (
            <View key={node.id} style={styles.nodeChip}>
              <Text style={styles.nodeChipIcon}>{node.icon}</Text>
              <Text style={styles.nodeChipText} numberOfLines={1}>{node.name}</Text>
            </View>
          ))}
          {nodeCount > 4 && (
            <Text style={styles.moreText}>+{nodeCount - 4}</Text>
          )}
        </View>
      )}
      
      {/* Date de modification */}
      <Text style={styles.dateText}>
        Modifié le {new Date(project.updatedAt).toLocaleDateString('fr-FR')}
      </Text>
    </TouchableOpacity>
  );
};

// ----------------------------------------------------------------------------
// Sélecteur de template de bateau
// ----------------------------------------------------------------------------

interface BoatTemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const BoatTemplateSelector: React.FC<BoatTemplateSelectorProps> = ({ selectedId, onSelect }) => (
  <View style={styles.templateSelector}>
    <Text style={styles.templateLabel}>Type de bateau</Text>
    <View style={styles.templateGrid}>
      {boatTemplates.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={[
            styles.templateOption,
            selectedId === template.id && styles.templateOptionSelected,
          ]}
          onPress={() => onSelect(template.id)}
        >
          <Text style={styles.templateIcon}>{template.icon}</Text>
          <Text style={[
            styles.templateName,
            selectedId === template.id && styles.templateNameSelected,
          ]}>
            {template.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export function ProjectListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { project, createNewProject, loadProject, resetProject } = useProjectStore();
  
  // État local
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(boatTemplates[0].id);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Charger les projets depuis le storage (simulation)
  const loadProjects = useCallback(async () => {
    // TODO: Implémenter la persistance avec expo-file-system
    // Pour l'instant, on garde une liste vide ou le projet courant
    const savedProjects: Project[] = [];
    if (project.id && project.nodes.length > 0) {
      savedProjects.push(project);
    }
    setProjects(savedProjects);
  }, [project]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Créer un nouveau projet
  const handleCreate = () => {
    const name = newProjectName.trim() || `Projet ${projects.length + 1}`;
    const id = Date.now().toString();
    
    const newProject: Project = {
      id,
      name,
      boatTemplateId: selectedTemplate,
      nodes: [],
      connections: [],
      settings: { ...DEFAULT_SETTINGS },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    createNewProject(newProject);
    setShowNewDialog(false);
    setNewProjectName('');
    setSelectedTemplate(boatTemplates[0].id);
    navigation.navigate('Editor', { projectId: id });
  };

  // Ouvrir un projet existant
  const handleOpen = (proj: Project) => {
    loadProject(proj);
    navigation.navigate('Editor', { projectId: proj.id });
  };

  // Supprimer un projet
  const handleDelete = async () => {
    if (!deleteTarget) return;
    // TODO: Implémenter la suppression dans le storage
    setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  const confirmDelete = (proj: Project) => {
    setDeleteTarget(proj);
    setShowDeleteConfirm(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={typography.h1}>Mes projets</Text>
        <Text style={styles.subtitle}>Schémas électriques bateau</Text>
      </View>

      {/* Liste des projets */}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => handleOpen(item)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛥️</Text>
            <Text style={styles.emptyTitle}>Aucun projet</Text>
            <Text style={styles.emptyText}>
              Créez votre premier schéma électrique pour votre bateau
            </Text>
          </View>
        }
      />

      {/* Bouton de création */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowNewDialog(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonIcon}>+</Text>
          <Text style={styles.createButtonText}>Nouveau projet</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de création */}
      <Modal
        visible={showNewDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewDialog(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewDialog(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau projet</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={styles.modalCreate}>Créer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Nom du projet */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du projet</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Voilier Oceanis 40"
                placeholderTextColor={colors.textMuted}
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />
            </View>

            {/* Sélecteur de template */}
            <BoatTemplateSelector
              selectedId={selectedTemplate}
              onSelect={setSelectedTemplate}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteTitle}>Supprimer ce projet ?</Text>
            <Text style={styles.deleteMessage}>
              "{deleteTarget?.name}" sera définitivement supprimé.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancel}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.deleteCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirm}
                onPress={handleDelete}
              >
                <Text style={styles.deleteConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------------------
// Styles
// ----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  projectCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  nodesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  nodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  nodeChipIcon: {
    fontSize: 12,
  },
  nodeChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 80,
  },
  moreText: {
    fontSize: 11,
    color: colors.textMuted,
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  createButtonIcon: {
    fontSize: 24,
    color: colors.surface,
    fontWeight: '300',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  modalCreate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateSelector: {
    marginBottom: spacing.xl,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  templateOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 90,
  },
  templateOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  templateIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  templateName: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  templateNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  deleteDialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  deleteMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deleteCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  deleteConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
  },
});

export default ProjectListScreen;
