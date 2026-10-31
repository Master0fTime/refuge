import * as Notifications from 'expo-notifications';
import { DarkTheme, router, Stack, ThemeProvider, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Storage from 'expo-sqlite/kv-store';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { migrerAncienDossier } from '@/lib/ia/modeles';
import { relancerSiBesoin } from '@/lib/maillage';
import { nouvelId } from '@/lib/id';
import { KEYS, write } from '@/lib/store';
import { c } from '@/lib/theme';
import { profilVide } from '@/lib/types';
import { t } from '@/i18n';

// Au premier lancement : crée l'identifiant unique de l'utilisateur (sert à le reconnaître dans les groupes).
if (!Storage.getItemSync(KEYS.profil)) write(KEYS.profil, profilVide(nouvelId()));
migrerAncienDossier().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: c.bg, card: c.bg, primary: c.accent, text: c.text, border: c.border },
};

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // La messagerie Bluetooth reprend toute seule si elle était allumée.
    relancerSiBesoin();
    // Toucher la notification d'un message ouvre la discussion.
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as Href);
    });
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerTintColor: c.text, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bienvenue" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="autorisations" options={{ title: t('Autorisations') }} />
        <Stack.Screen name="reglages" options={{ title: t('Réglages') }} />
        <Stack.Screen name="savoir" options={{ title: t('Secours') }} />
        <Stack.Screen name="carte" options={{ title: t('Carte') }} />
        <Stack.Screen name="outils" options={{ title: t('Outils') }} />
        <Stack.Screen name="complements" options={{ title: t('Discuter sans réseau') }} />
        <Stack.Screen name="guide" options={{ title: t("Assistant") }} />
        <Stack.Screen name="rcp" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="panique" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="demander" options={{ title: t('Poser une question') }} />
        <Stack.Screen name="ia" options={{ title: t("IA hors ligne") }} />
        <Stack.Screen name="preparer" options={{ title: t('Préparer mon téléphone') }} />
        <Stack.Screen name="partager" options={{ title: t("Partager Refuge") }} />
        <Stack.Screen name="pays" options={{ title: t('Pays, langue et numéros') }} />
        <Stack.Screen name="reglages-voix" options={{ title: t('Voix de l’IA') }} />
        <Stack.Screen name="cartes" options={{ title: t("Cartes hors ligne") }} />
        <Stack.Screen name="mises-a-jour" options={{ title: t("Mises à jour") }} />
        <Stack.Screen name="recevoir" options={{ title: t("Récupérer depuis un proche") }} />
        <Stack.Screen name="fiche/[id]" options={{ title: '' }} />
        <Stack.Screen name="article/[id]" options={{ title: t('Encyclopédie') }} />
        <Stack.Screen name="groupe/[id]" options={{ title: t('Groupe') }} />
        <Stack.Screen name="discussion/[id]" options={{ title: t('Discussion') }} />
        <Stack.Screen name="scanner" options={{ title: t("Scanner un QR code"), presentation: 'modal' }} />
        <Stack.Screen name="mon-qr" options={{ title: t("Mon QR code") }} />
        <Stack.Screen name="rejoindre" options={{ title: t("Rejoindre le point") }} />
        <Stack.Screen name="carte-urgence" options={{ title: t("Fond d’écran d’urgence") }} />
      </Stack>
      {/* Bande opaque derrière les boutons Android : le texte ne défile plus dessous, illisible. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom, backgroundColor: c.card }} />
    </ThemeProvider>
  );
}
