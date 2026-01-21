import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Device, PowerSource, Cable } from '../models/types';
import type { RootStackParamList } from '../navigation/types';
import { deleteProject, listProjects, saveProject } from '../storage/projectStorage';
import { useStore } from '../store/useStore';
import { Button, Card, ConfirmDialog, Toast, type ToastType } from '../components';
import { colors, borderRadius, spacing, typography } from '../theme';

// Type legacy pour compatibilité
type LegacyProject = {
  id: string;
  name: string;
  backgroundImage?: string;
  devices: Device[];
  sources: PowerSource[];
  cables: Cable[];
};

export function ProjectListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setProject = useStore((state) => state.setProject);
  const [projects, setProjects] = useState<LegacyProject[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<LegacyProject | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const load = useCallback(async () => {
    const items = await listProjects();
    setProjects(items.sort((a, b) => b.id.localeCompare(a.id)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleCreate = async () => {
    const name = newProjectName.trim() || `Projet ${projects.length + 1}`;
    const id = Date.now().toString();
    const project: LegacyProject = {
      id,
      name,
      devices: [],
      sources: [],
      cables: [],
    };
    await saveProject(project);
    setProject(project);
    setShowNewDialog(false);
    setNewProjectName('');
    navigation.navigate('Editor', { projectId: id });
  };

  const handleOpen = (project: LegacyProject) => {
    setProject(project);
    navigation.navigate('Editor', { projectId: project.id });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProject(deleteTarget.id);
    setDeleteTarget(null);
    setToast({ message: 'Projet supprimé', type: 'success' });
    void load();
  };

  const getProjectStats = (project: LegacyProject) => {
    const deviceCount = project.devices.length;
    const sourceCount = project.sources.length;
    return `${deviceCount} appareil${deviceCount !== 1 ? 's' : ''} · ${sourceCount} source${sourceCount !== 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={typography.h1}>Mes projets</Text>
        <Text style={styles.subtitle}>
          Schémas électriques voilier
        </Text>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card
            icon="⚡"
            title={item.name}
            subtitle={getProjectStats(item)}
            onPress={() => handleOpen(item)}
            onLongPress={() => setDeleteTarget(item)}
            variant="elevated"
            rightElement={
              <Text style={styles.chevron}>›</Text>
            }
          >
            {item.devices.length > 0 && (
              <View style={styles.devicePreview}>
                {item.devices.slice(0, 3).map((d) => (
                  <View key={d.id} style={styles.deviceChip}>
                    <Text style={styles.deviceChipText}>{d.name}</Text>
                  </View>
                ))}
                {item.devices.length > 3 && (
                  <Text style={styles.moreText}>
                    +{item.devices.length - 3}
                  </Text>
                )}
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛥️</Text>
            <Text style={styles.emptyTitle}>Aucun projet</Text>
            <Text style={styles.emptyText}>
              Créez votre premier schéma électrique
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Button
          title="Nouveau projet"
          icon="+"
          onPress={() => setShowNewDialog(true)}
          size="lg"
          fullWidth
        />
      </View>

      {/* New Project Dialog */}
      {showNewDialog && (
        <ConfirmDialog
          visible={showNewDialog}
          title="Nouveau projet"
          message=""
          confirmText="Créer"
          cancelText="Annuler"
          onConfirm={handleCreate}
          onCancel={() => {
            setShowNewDialog(false);
            setNewProjectName('');
          }}
        />
      )}

      {showNewDialog && (
        <View style={styles.inputOverlay}>
          <TextInput
            style={styles.input}
            value={newProjectName}
            onChangeText={setNewProjectName}
            placeholder="Nom du projet"
            placeholderTextColor={colors.textMuted}
            autoFocus
            onSubmitEditing={handleCreate}
          />
        </View>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Supprimer le projet ?"
        message={`"${deleteTarget?.name}" sera définitivement supprimé.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={true}
          onHide={() => setToast(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
  },
  devicePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  deviceChip: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  deviceChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  moreText: {
    fontSize: 11,
    color: colors.textMuted,
    alignSelf: 'center',
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
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputOverlay: {
    position: 'absolute',
    top: '45%',
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 1001,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
