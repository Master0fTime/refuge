import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Storage from 'expo-sqlite/kv-store';
import { migrerAncienDossier } from '@/lib/ia/modeles';
import { nouvelId } from '@/lib/id';
import { KEYS, write } from '@/lib/store';
import { c } from '@/lib/theme';
import { profilVide } from '@/lib/types';

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
        <Stack.Screen name="guide" options={{ title: 'Assistant' }} />
        <Stack.Screen name="panique" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="demander" options={{ title: 'Poser une question' }} />
        <Stack.Screen name="ia" options={{ title: 'IA hors ligne' }} />
        <Stack.Screen name="preparer" options={{ title: 'Préparer mon téléphone' }} />
        <Stack.Screen name="partager" options={{ title: 'Partager Refuge' }} />
        <Stack.Screen name="pays" options={{ title: 'Pays et numéros utiles' }} />
        <Stack.Screen name="recevoir" options={{ title: 'Récupérer depuis un proche' }} />
        <Stack.Screen name="fiche/[id]" options={{ title: '' }} />
        <Stack.Screen name="groupe/[id]" options={{ title: 'Groupe' }} />
        <Stack.Screen name="scanner" options={{ title: 'Scanner un QR code', presentation: 'modal' }} />
        <Stack.Screen name="mon-qr" options={{ title: 'Mon QR code' }} />
        <Stack.Screen name="rejoindre" options={{ title: 'Rejoindre le point' }} />
        <Stack.Screen name="carte-urgence" options={{ title: 'Fond d’écran d’urgence' }} />
      </Stack>
    </ThemeProvider>
  );
}
