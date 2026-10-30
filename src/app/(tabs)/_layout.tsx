import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Pressable, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '@/components/ui';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

const icone =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <Ionicons name={name} size={26} color={color as string} />;

/** Le bouton SOS dépasse de la barre, au centre : en un geste depuis n'importe quel écran. */
function BoutonSOS({ onPress }: { onPress?: (e: never) => void }) {
  return (
    <Pressable
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        onPress?.(e as never);
      }}
      accessibilityRole="button"
      accessibilityLabel={t('Urgence')}
      style={{ flex: 1, alignItems: 'center' }}>
      {({ pressed }) => (
        <View
          style={{
            marginTop: -22,
            width: 66,
            height: 66,
            borderRadius: 33,
            backgroundColor: c.danger,
            borderWidth: 4,
            borderColor: c.bg,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.92 : 1 }],
          }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 }}>SOS</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function TabsLayout() {
  // Hauteur explicite + marge des boutons Android (gestes ou 3 boutons) : sinon la barre passe dessous.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border, height: 64 + insets.bottom, paddingBottom: insets.bottom + 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen name="index" options={{ title: t('Accueil'), headerShown: false, tabBarIcon: icone('apps') }} />
      <Tabs.Screen name="moi" options={{ title: t('Ma santé'), headerTitle: t('Carte de vie'), tabBarIcon: icone('id-card') }} />
      <Tabs.Screen
        name="sos"
        options={{ title: t('Urgence'), tabBarLabel: () => null, tabBarButton: (p) => <BoutonSOS onPress={p.onPress as never} /> }}
      />
      <Tabs.Screen name="groupe" options={{ title: t('Groupe'), tabBarIcon: icone('people') }} />
      <Tabs.Screen name="partage" options={{ title: t('Partager'), headerTitle: t('Partager Refuge'), tabBarIcon: icone('share-social') }} />
    </Tabs>
  );
}
