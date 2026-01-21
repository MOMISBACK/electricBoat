import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, G, Line, Path, Text as SvgText, Rect } from 'react-native-svg';
import type { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { loadProject, saveProject } from '../storage/projectStorage';
import type { Cable, Device } from '../models/types';
import { deviceCurrent } from '../utils/calculations';
import { Button, SegmentedControl, Toast, ConfirmDialog, BottomSheet, type ToastType } from '../components';
import { colors, borderRadius, spacing } from '../theme';

const MODES = {
  PLACEMENT: 'placement',
  CABLAGE: 'cablage',
  ANALYSE: 'analyse',
} as const;

type Mode = (typeof MODES)[keyof typeof MODES];

const MODE_SEGMENTS = [
  { key: MODES.PLACEMENT, label: 'Placement', icon: '📍' },
  { key: MODES.CABLAGE, label: 'Câblage', icon: '🔌' },
  { key: MODES.ANALYSE, label: 'Analyse', icon: '📊' },
];

export function EditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { projectId } = route.params as { projectId: string };

  const project = useStore((state) => state.project);
  const setProject = useStore((state) => state.setProject);
  const moveDevice = useStore((state) => state.moveDevice);
  const addCable = useStore((state) => state.addCable);
  const removeDevice = useStore((state) => state.removeDevice);
  const removeCable = useStore((state) => state.removeCable);

  const [mode, setMode] = useState<Mode>(MODES.PLACEMENT);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [pendingCableFrom, setPendingCableFrom] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [showDeviceSheet, setShowDeviceSheet] = useState(false);

  const dragOffset = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (project.id === projectId) return;
    void (async () => {
      const stored = await loadProject(projectId);
      if (stored) setProject(stored);
    })();
  }, [project.id, projectId, setProject]);

  const deviceById = useMemo(
    () => new Map(project.devices.map((d) => [d.id, d] as const)),
    [project.devices]
  );

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const handleDevicePress = (deviceId: string) => {
    if (mode === MODES.CABLAGE) {
      if (!pendingCableFrom) {
        setPendingCableFrom(deviceId);
        setToast({ message: 'Sélectionnez le second appareil', type: 'info' });
        return;
      }
      if (pendingCableFrom && pendingCableFrom !== deviceId) {
        const from = deviceById.get(pendingCableFrom);
        const to = deviceById.get(deviceId);
        if (from && to) {
          const lengthM = distance(from.position, to.position) / 50; // Scale px to m
          const cable: Cable = {
            id: Date.now().toString(),
            fromId: from.id,
            toId: to.id,
            lengthM: Math.round(lengthM * 10) / 10,
            sectionMm2: 2.5,
            maxCurrentA: 15,
          };
          addCable(cable);
          setToast({ message: 'Câble créé', type: 'success' });
        }
        setPendingCableFrom(null);
        return;
      }
    }

    if (mode === MODES.PLACEMENT) {
      setSelectedDeviceId(deviceId);
      setShowDeviceSheet(true);
    }

    if (mode === MODES.ANALYSE) {
      setSelectedDeviceId(deviceId);
      setShowDeviceSheet(true);
    }
  };

  const handleDeviceLongPress = (device: Device) => {
    setDeleteTarget(device);
  };

  const handleCanvasPress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (mode === MODES.PLACEMENT && selectedDeviceId) {
      moveDevice(selectedDeviceId, {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      });
      setSelectedDeviceId(null);
      setShowDeviceSheet(false);
    }
    if (mode === MODES.CABLAGE && pendingCableFrom) {
      setPendingCableFrom(null);
    }
  };

  const handleSave = async () => {
    await saveProject(project);
    setToast({ message: 'Projet sauvegardé', type: 'success' });
  };

  const handleDeleteDevice = () => {
    if (deleteTarget) {
      removeDevice(deleteTarget.id);
      setDeleteTarget(null);
      setToast({ message: 'Appareil supprimé', type: 'success' });
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as Mode);
    setPendingCableFrom(null);
    setSelectedDeviceId(null);
    setShowDeviceSheet(false);
  };

  const selectedDevice = selectedDeviceId ? deviceById.get(selectedDeviceId) : null;

  const getDeviceColor = (device: Device, isSelected: boolean, isPending: boolean) => {
    if (isSelected) return colors.warning;
    if (isPending) return colors.accent;
    return colors.deviceConsumer;
  };

  const getCableColor = (cable: Cable) => {
    const from = deviceById.get(cable.fromId);
    const to = deviceById.get(cable.toId);
    const maxCurrent = Math.max(
      from ? deviceCurrent(from) : 0,
      to ? deviceCurrent(to) : 0
    );
    if (maxCurrent > cable.maxCurrentA) return colors.cableError;
    return colors.cable;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Mode Selector */}
      <View style={styles.modeContainer}>
        <SegmentedControl
          segments={MODE_SEGMENTS}
          selectedKey={mode}
          onSelect={handleModeChange}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Équipements"
          icon="⚡"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('DeviceLibrary')}
        />
        <Button
          title="Sources"
          icon="🔋"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('SourceLibrary')}
        />
        <Button
          title="Synthèse"
          icon="📊"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('EnergySummary')}
        />
        <Button
          title=""
          icon="💾"
          size="sm"
          variant="primary"
          onPress={handleSave}
        />
      </View>

      {/* Canvas */}
      <Pressable style={styles.canvas} onLayout={handleCanvasLayout} onPress={handleCanvasPress}>
        <Svg width={canvasSize.width} height={canvasSize.height}>
          {/* Grid pattern */}
          {Array.from({ length: Math.ceil(canvasSize.width / 40) }).map((_, i) => (
            <Line
              key={`vg-${i}`}
              x1={i * 40}
              y1={0}
              x2={i * 40}
              y2={canvasSize.height}
              stroke={colors.surfaceHighlight}
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          ))}
          {Array.from({ length: Math.ceil(canvasSize.height / 40) }).map((_, i) => (
            <Line
              key={`hg-${i}`}
              x1={0}
              y1={i * 40}
              x2={canvasSize.width}
              y2={i * 40}
              stroke={colors.surfaceHighlight}
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          ))}

          {/* Cables */}
          {project.cables.map((cable) => {
            const from = deviceById.get(cable.fromId);
            const to = deviceById.get(cable.toId);
            if (!from || !to) return null;
            return (
              <G key={cable.id}>
                <Line
                  x1={from.position.x}
                  y1={from.position.y}
                  x2={to.position.x}
                  y2={to.position.y}
                  stroke={getCableColor(cable)}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <SvgText
                  x={(from.position.x + to.position.x) / 2}
                  y={(from.position.y + to.position.y) / 2 - 8}
                  fontSize={10}
                  fill={colors.textSecondary}
                  textAnchor="middle"
                >
                  {cable.lengthM}m
                </SvgText>
              </G>
            );
          })}

          {/* Pending cable line */}
          {pendingCableFrom && (
            <Circle
              cx={deviceById.get(pendingCableFrom)?.position.x ?? 0}
              cy={deviceById.get(pendingCableFrom)?.position.y ?? 0}
              r={28}
              fill="transparent"
              stroke={colors.accent}
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}

          {/* Devices */}
          {project.devices.map((device) => {
            const isSelected = device.id === selectedDeviceId;
            const isPending = device.id === pendingCableFrom;
            const color = getDeviceColor(device, isSelected, isPending);

            // Créer les props de clic compatibles web
            const clickProps = Platform.OS === 'web' 
              ? {
                  onClick: () => handleDevicePress(device.id),
                  onContextMenu: (e: any) => {
                    e.preventDefault();
                    handleDeviceLongPress(device);
                  },
                  style: { cursor: 'pointer' } as any,
                }
              : {
                  onPress: () => handleDevicePress(device.id),
                  onLongPress: () => handleDeviceLongPress(device),
                };

            return (
              <G key={device.id}>
                <Circle
                  cx={device.position.x}
                  cy={device.position.y}
                  r={22}
                  fill={color}
                  opacity={0.9}
                />
                <Circle
                  cx={device.position.x}
                  cy={device.position.y}
                  r={22}
                  fill="transparent"
                  stroke={isSelected ? colors.textPrimary : 'transparent'}
                  strokeWidth={2}
                />
                <SvgText
                  x={device.position.x}
                  y={device.position.y + 5}
                  fontSize={16}
                  fill={colors.textPrimary}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  ⚡
                </SvgText>
                <SvgText
                  x={device.position.x}
                  y={device.position.y + 38}
                  fontSize={11}
                  fill={colors.textPrimary}
                  textAnchor="middle"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {device.name.length > 12 ? device.name.slice(0, 10) + '…' : device.name}
                </SvgText>
                <SvgText
                  x={device.position.x}
                  y={device.position.y + 52}
                  fontSize={9}
                  fill={colors.textSecondary}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {device.powerW ? `${device.powerW}W` : `${device.currentA}A`}
                </SvgText>
                {/* Zone cliquable invisible pour la compatibilité web */}
                <Rect
                  x={device.position.x - 25}
                  y={device.position.y - 25}
                  width={50}
                  height={80}
                  fill="transparent"
                  {...clickProps}
                />
              </G>
            );
          })}
        </Svg>
      </Pressable>

      {/* Hint Bar */}
      <View style={styles.hintBar}>
        {mode === MODES.PLACEMENT && (
          <Text style={styles.hint}>
            {selectedDeviceId
              ? '📍 Touchez le plan pour déplacer'
              : '👆 Touchez un appareil pour le sélectionner'}
          </Text>
        )}
        {mode === MODES.CABLAGE && (
          <Text style={styles.hint}>
            {pendingCableFrom
              ? '🔗 Sélectionnez le second appareil'
              : '👆 Sélectionnez le premier appareil'}
          </Text>
        )}
        {mode === MODES.ANALYSE && (
          <Text style={styles.hint}>
            📊 Touchez un appareil pour voir ses détails
          </Text>
        )}
      </View>

      {/* Device Detail Sheet */}
      <BottomSheet
        visible={showDeviceSheet && selectedDevice !== null}
        onClose={() => {
          setShowDeviceSheet(false);
          setSelectedDeviceId(null);
        }}
        title={selectedDevice?.name}
      >
        {selectedDevice && (
          <View style={styles.sheetContent}>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Tension</Text>
              <Text style={styles.sheetValue}>{selectedDevice.voltage}V</Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Puissance/Courant</Text>
              <Text style={styles.sheetValue}>
                {selectedDevice.powerW
                  ? `${selectedDevice.powerW}W`
                  : `${selectedDevice.currentA}A`}
              </Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Heures/jour</Text>
              <Text style={styles.sheetValue}>{selectedDevice.dailyHours}h</Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Duty cycle</Text>
              <Text style={styles.sheetValue}>
                {Math.round(selectedDevice.dutyCycle * 100)}%
              </Text>
            </View>
            <View style={styles.sheetActions}>
              <Button
                title="Supprimer"
                variant="danger"
                icon="🗑️"
                onPress={() => {
                  setShowDeviceSheet(false);
                  setDeleteTarget(selectedDevice);
                }}
              />
            </View>
          </View>
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Supprimer l'appareil ?"
        message={`"${deleteTarget?.name}" et ses câbles seront supprimés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteDevice}
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

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modeContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  canvas: {
    flex: 1,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  hintBar: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sheetContent: {
    gap: spacing.sm,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sheetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sheetActions: {
    marginTop: spacing.lg,
  },
});
