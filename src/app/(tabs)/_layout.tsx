import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import type { IconName } from '@/components/ui';
import { c } from '@/lib/theme';

const icone =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <Ionicons name={name} size={26} color={color as string} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Urgence', tabBarIcon: icone('alert-circle') }} />
      <Tabs.Screen name="savoir" options={{ title: 'Savoir', tabBarIcon: icone('book') }} />
      <Tabs.Screen name="groupe" options={{ title: 'Groupe', tabBarIcon: icone('people') }} />
      <Tabs.Screen name="outils" options={{ title: 'Outils', tabBarIcon: icone('flashlight') }} />
      <Tabs.Screen name="moi" options={{ title: 'Carte de vie', tabBarIcon: icone('id-card') }} />
    </Tabs>
  );
}
