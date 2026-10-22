import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Storage from 'expo-sqlite/kv-store';
import { migrerAncienDossier } from '@/lib/ia/modeles';
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
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerTintColor: c.text, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
        <Stack.Screen name="scanner" options={{ title: t("Scanner un QR code"), presentation: 'modal' }} />
        <Stack.Screen name="mon-qr" options={{ title: t("Mon QR code") }} />
        <Stack.Screen name="rejoindre" options={{ title: t("Rejoindre le point") }} />
        <Stack.Screen name="carte-urgence" options={{ title: t("Fond d’écran d’urgence") }} />
      </Stack>
    </ThemeProvider>
  );
}
