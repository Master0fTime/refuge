import * as Application from 'expo-application';
import * as FS from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { DERNIER_APK } from '@/data/version';

// Deux sortes de mises à jour, un seul bouton pour l'utilisateur :
// 1. contenu et code (fiches, écrans, IA) : EAS Update, appliqué en redémarrant l'appli ;
// 2. nouvelle version complète (nouveaux modules natifs) : l'APK est téléchargé puis installé
//    par l'appli elle-même. Android demande seulement de confirmer, les données sont conservées.

export function versionInstallee() {
  return {
    version: Application.nativeApplicationVersion ?? '?',
    build: Number(Application.nativeBuildVersion ?? 0),
    /** Date du contenu en cours : la mise à jour automatique installée, ou celle de l'APK d'origine. */
    contenu: Updates.isEmbeddedLaunch ? null : (Updates.createdAt ?? null),
    idContenu: Updates.updateId?.slice(0, 8) ?? null,
  };
}

/** Un APK plus récent est-il connu (par les données reçues en mise à jour automatique) ? */
export function apkDisponible() {
  if (Platform.OS !== 'android' || !DERNIER_APK) return null;
  return DERNIER_APK.versionCode > versionInstallee().build ? DERNIER_APK : null;
}

export type EtatContenu = 'a-jour' | 'disponible' | 'prete' | 'hors-ligne' | 'indisponible';

/** Cherche une mise à jour de contenu et la télécharge si elle existe (sans redémarrer). */
export async function verifierContenu(): Promise<EtatContenu> {
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

export const appliquerContenu = () => Updates.reloadAsync();

/** Télécharge le nouvel APK puis ouvre l'installeur Android. */
export async function installerApk(onProgres: (fraction: number) => void) {
  const apk = apkDisponible();
  if (!apk) throw new Error('Aucune nouvelle version complète à installer.');
  const dest = `${FS.cacheDirectory}refuge-${apk.versionCode}.apk`;
  const info = await FS.getInfoAsync(dest);
  if (!info.exists || info.size < apk.octets * 0.99) {
    const tache = FS.createDownloadResumable(apk.url, dest, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) =>
      onProgres(totalBytesWritten / (totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : apk.octets)),
    );
    const r = await tache.downloadAsync();
    if (!r || r.status >= 400) throw new Error('Téléchargement impossible. Le lien a peut-être expiré : réessaie plus tard.');
  }
  onProgres(1);
  const uri = await FS.getContentUriAsync(dest);
  // 1 = FLAG_GRANT_READ_URI_PERMISSION : l'installeur Android a le droit de lire le fichier.
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: uri,
    flags: 1,
    type: 'application/vnd.android.package-archive',
  });
}
