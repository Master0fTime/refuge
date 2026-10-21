import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Pressable, Text, type ColorValue } from 'react-native';
import type { IconName } from '@/components/ui';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

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
        // Partager l'appli doit se trouver en un geste, depuis n'importe quel onglet.
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/partager')}
            hitSlop={10}
            accessibilityLabel="Partager Refuge à un proche"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: c.cardAlt }}>
            <Ionicons name="share-social" size={20} color={c.accent} />
            <Text style={{ color: c.text, fontWeight: '700' }}>{t('Partager')}</Text>
          </Pressable>
        ),
      }}>
      <Tabs.Screen name="index" options={{ title: t('Urgence'), tabBarIcon: icone('alert-circle') }} />
      <Tabs.Screen name="savoir" options={{ title: t('Savoir'), tabBarIcon: icone('book') }} />
      <Tabs.Screen name="carte" options={{ title: t('Carte'), tabBarIcon: icone('map') }} />
      <Tabs.Screen name="groupe" options={{ title: t('Groupe'), tabBarIcon: icone('people') }} />
      <Tabs.Screen name="outils" options={{ title: t('Outils'), tabBarIcon: icone('flashlight') }} />
      <Tabs.Screen name="moi" options={{ title: t('Moi'), headerTitle: t('Carte de vie'), tabBarIcon: icone('id-card') }} />
    </Tabs>
  );
}
