import * as Application from 'expo-application';
import * as FS from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DERNIER_APK, type VersionApk } from '@/data/version';
import { KEYS, lire, useStored, write } from '@/lib/store';
import { t } from '@/i18n';

// Deux sortes de mises à jour, un seul bouton pour l'utilisateur :
// 1. contenu et code (fiches, écrans, IA) : EAS Update, appliqué en redémarrant l'appli ;
// 2. nouvelle version complète (nouveaux modules natifs) : l'APK est téléchargé puis installé
//    par l'appli elle-même. Android demande seulement de confirmer, les données sont conservées.
//    Les APK sont publiés sur GitHub Releases (liens permanents), sous le nom refuge-<versionCode>.apk.

const RELEASES = 'https://api.github.com/repos/Master0fTime/refuge/releases/latest';

export function versionInstallee() {
  return {
    version: Application.nativeApplicationVersion ?? '?',
    build: Number(Application.nativeBuildVersion ?? 0),
    /** Date du contenu en cours : la mise à jour automatique installée, ou celle de l'APK d'origine. */
    contenu: Updates.isEmbeddedLaunch ? null : (Updates.createdAt ?? null),
    idContenu: Updates.updateId?.slice(0, 8) ?? null,
  };
}

/** Le plus récent des APK connus : celui de GitHub (dernière vérification) ou celui reçu en mise à jour automatique. */
function plusRecent(enLigne: VersionApk | null) {
  if (Platform.OS !== 'android') return null;
  const apk = [DERNIER_APK, enLigne].reduce<VersionApk | null>((a, b) => (b && (!a || b.versionCode > a.versionCode) ? b : a), null);
  return apk && apk.versionCode > versionInstallee().build ? apk : null;
}

/** Un APK plus récent est-il connu ? (sans réseau : on garde le résultat de la dernière vérification) */
export const apkDisponible = () => plusRecent(lire<VersionApk | null>(KEYS.apkGithub, null));

/** Demande à GitHub la dernière version publiée. Sans Internet, rien ne change. */
export async function chercherApk() {
  if (__DEV__ || Platform.OS !== 'android') return;
  const arret = new AbortController();
  const minuteur = setTimeout(() => arret.abort(), 8000); // pas d'attente infinie sur un réseau saturé
  try {
    const r = await fetch(RELEASES, { headers: { Accept: 'application/vnd.github+json' }, signal: arret.signal });
    if (!r.ok) return;
    const rel = await r.json();
    for (const a of rel.assets ?? []) {
      const m = /^refuge-(\d+)\.apk$/.exec(a.name);
      if (!m) continue;
      write<VersionApk>(KEYS.apkGithub, {
        versionCode: Number(m[1]),
        version: String(rel.tag_name).replace(/^v/, ''),
        url: a.browser_download_url,
        octets: a.size,
        date: rel.published_at,
      });
      return;
    }
  } catch {
    // Hors ligne ou GitHub injoignable : on réessaiera à la prochaine ouverture.
  } finally {
    clearTimeout(minuteur);
  }
}

/** Version « hook » : vérifie GitHub à l'ouverture de l'écran et se met à jour dès qu'un APK est trouvé. */
export function useApkDisponible() {
  const [enLigne] = useStored<VersionApk | null>(KEYS.apkGithub, null);
  useEffect(() => {
    chercherApk();
  }, []);
  return plusRecent(enLigne);
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
  if (!apk) throw new Error(t("Aucune nouvelle version complète à installer."));
  const dest = `${FS.cacheDirectory}refuge-${apk.versionCode}.apk`;
  const info = await FS.getInfoAsync(dest);
  if (!info.exists || info.size < apk.octets * 0.99) {
    const tache = FS.createDownloadResumable(apk.url, dest, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) =>
      onProgres(totalBytesWritten / (totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : apk.octets)),
    );
    const r = await tache.downloadAsync();
    if (!r || r.status >= 400) throw new Error(t("Téléchargement impossible : vérifie ta connexion et réessaie."));
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
