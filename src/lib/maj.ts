import * as Updates from 'expo-updates';

// Mises à jour du contenu et du code (fiches, écrans, IA) via EAS Update, tant qu'Internet est là.
// Sans réseau, l'appli démarre simplement avec la dernière version déjà téléchargée.

export type EtatMaj = 'a-jour' | 'prete' | 'hors-ligne' | 'indisponible';

export async function verifierMaj(): Promise<EtatMaj> {
  if (__DEV__ || !Updates.isEnabled) return 'indisponible';
  try {
    const r = await Updates.checkForUpdateAsync();
    if (!r.isAvailable) return 'a-jour';
    await Updates.fetchUpdateAsync();
    return 'prete';
  } catch {
    return 'hors-ligne';
  }
}

export const redemarrer = () => Updates.reloadAsync();
