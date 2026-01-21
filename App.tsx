import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, View } from 'react-native';
import type { RootStackParamList } from './src/navigation/types';
import { ProjectListScreen } from './src/screens/ProjectListScreenNew';
import { EditorScreen } from './src/screens/EditorScreenNew';
import { EnergySummaryScreen } from './src/screens/EnergySummaryScreen';
import { DeviceLibraryScreen } from './src/screens/DeviceLibraryScreen';
import { SourceLibraryScreen } from './src/screens/SourceLibraryScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

console.log('[App] JS bundle loaded', { time: new Date().toISOString() });

// Error Boundary pour capturer les erreurs de rendu
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[App] ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1a', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            ⚠️ Erreur de l'application
          </Text>
          <Text style={{ color: '#f9fafb', fontSize: 14, textAlign: 'center' }}>
            {this.state.error?.message || 'Une erreur inconnue est survenue'}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
            {this.state.error?.stack?.slice(0, 500)}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('[App] App component rendering...');
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="ProjectList"
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: { fontWeight: '600' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
              }}
            >
            <Stack.Screen
              name="ProjectList"
              component={ProjectListScreen}
              options={{ title: '', headerShown: false }}
            />
            <Stack.Screen
              name="Editor"
              component={EditorScreen}
              options={{ title: '', headerShown: false }}
            />
            <Stack.Screen
              name="EnergySummary"
              component={EnergySummaryScreen}
              options={{ title: 'Synthèse' }}
            />
            <Stack.Screen
              name="DeviceLibrary"
              component={DeviceLibraryScreen}
              options={{ title: 'Équipements' }}
            />
            <Stack.Screen
              name="SourceLibrary"
              component={SourceLibraryScreen}
              options={{ title: 'Sources d\'énergie' }}
            />
          </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
