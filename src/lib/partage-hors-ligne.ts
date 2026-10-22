import Constants from 'expo-constants';
import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { PermissionsAndroid, Platform } from 'react-native';
import { PartageLocal } from '../../modules/partage-local';
import { PACKS_ENCYCLOPEDIE } from '@/lib/encyclopedie';
import { DOSSIER_PARTAGE, estInstalle, formatTaille, MODELES, type Telechargeable } from '@/lib/ia/modeles';
import { MODELES_VOIX } from '@/lib/voix';
import { t } from '@/i18n';

// Partager Refuge sans Internet : Wi-Fi local créé par le téléphone + petit serveur web.
// Seul le dossier `partage/` (packs + page d'accueil) et l'APK sont accessibles :
// la carte de vie, les groupes et les contacts vivent dans SQLite, ailleurs.

export type PackPartage = Telechargeable & { type: 'ia' | 'voix' | 'encyclopedie'; nom: string };
export type Catalogue = { app: 'refuge'; version: string; apkOctets: number; packs: PackPartage[] };

export const partageDisponible = () => PartageLocal !== null;

async function autoriser() {
  if (Platform.OS !== 'android') return;
  const perm =
    Number(Platform.Version) >= 33 ? 'android.permission.NEARBY_WIFI_DEVICES' : PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const r = await PermissionsAndroid.request(perm as typeof PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: t('Wi-Fi local'),
    message: t('Refuge a besoin de cette autorisation pour créer un Wi-Fi local et partager l’appli sans Internet.'),
    buttonPositive: 'OK',
  });
  if (r !== PermissionsAndroid.RESULTS.GRANTED) throw new Error(t('Autorisation refusée : impossible de créer le Wi-Fi local.'));
}

async function packsInstalles(): Promise<PackPartage[]> {
  const out: PackPartage[] = [];
  for (const m of MODELES) if (await estInstalle(m)) out.push({ ...m, type: 'ia', nom: `IA : ${m.nom}`, url: `modeles/${m.fichier}` });
  for (const m of MODELES_VOIX) if (await estInstalle(m)) out.push({ ...m, type: 'voix', nom: m.nom, url: `modeles/${m.fichier}` });
  for (const m of PACKS_ENCYCLOPEDIE)
    if (await estInstalle(m)) out.push({ ...m, type: 'encyclopedie', nom: `Encyclopédie (${m.langue.toUpperCase()})`, url: `modeles/${m.fichier}` });
  return out;
}

async function tailleApk() {
  const info = await FS.getInfoAsync(`file://${PartageLocal!.cheminApk()}`);
  return info.exists ? info.size : 0;
}

const esc = (t: string) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

function pageAccueil(cat: Catalogue) {
  const packs = cat.packs
    .map((p) => `<a class="b s" href="/${esc(p.url)}">${esc(p.nom)} <small>${formatTaille(p.octets)}</small></a>`)
    .join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refuge</title><style>
body{font-family:system-ui,sans-serif;background:#101418;color:#f2f4f5;margin:0;padding:20px;line-height:1.5}
h1{margin:0 0 4px}p{color:#9aa5b1}.b{display:block;padding:18px;border-radius:12px;background:#f59e0b;color:#000;font-weight:700;text-decoration:none;text-align:center;font-size:18px;margin:12px 0}
.s{background:#232c35;color:#f2f4f5;font-size:16px}small{opacity:.7;font-weight:400}ol{padding-left:20px}li{margin:8px 0}
</style></head><body>
<h1>Refuge</h1><p>Appli de survie hors ligne, partagée par un proche, sans Internet.</p>
<a class="b" href="/refuge.apk">1. Télécharger Refuge <small>(${formatTaille(cat.apkOctets)})</small></a>
<ol>
<li>Ouvre le fichier téléchargé. Si le navigateur prévient « fichier non sécurisé », choisis <b>Conserver</b> ou <b>Télécharger quand même</b>.</li>
<li>Android demande d’autoriser l’installation depuis cette source : accepte, puis <b>Installer</b>.</li>
<li>Ouvre Refuge → <b>Préparer mon téléphone</b> → <b>Récupérer depuis un proche</b>, puis scanne le même QR code : l’IA et la voix se copient depuis ce téléphone, en quelques minutes.</li>
</ol>
${packs ? `<p>Ou télécharge les packs à la main :</p>${packs}` : ''}
<p>Version ${esc(cat.version)}</p></body></html>`;
}

let actif = false;

/** Démarre le partage : renvoie le Wi-Fi à rejoindre et l'adresse de la page de téléchargement. */
export async function demarrerPartage() {
  if (!PartageLocal) throw new Error(t('Le partage hors ligne n’est disponible que sur Android.'));
  await autoriser();
  const cat: Catalogue = {
    app: 'refuge',
    version: Constants.expoConfig?.version ?? '?',
    apkOctets: await tailleApk(),
    packs: await packsInstalles(),
  };
  const dossier = await FS.getInfoAsync(DOSSIER_PARTAGE);
  if (!dossier.exists) await FS.makeDirectoryAsync(DOSSIER_PARTAGE, { intermediates: true });
  await FS.writeAsStringAsync(`${DOSSIER_PARTAGE}catalogue.json`, JSON.stringify(cat));
  await FS.writeAsStringAsync(`${DOSSIER_PARTAGE}index.html`, pageAccueil(cat));

  const wifi = await PartageLocal.demarrerWifi();
  const port = PartageLocal.demarrerServeur(DOSSIER_PARTAGE, 8080);
  actif = true;
  // Le Wi-Fi local prend une adresse privée (souvent 192.168.x.x) : on préfère son interface.
  const ips = PartageLocal.adressesIp().map((x) => x.split('|') as [string, string]);
  const choisie =
    ips.find(([n, ip]) => /ap|swlan|softap/i.test(n) && ip.startsWith('192.168.')) ??
    ips.find(([, ip]) => ip.startsWith('192.168.')) ??
    ips.find(([n]) => /wlan/i.test(n)) ??
    ips[0];
  if (!choisie) throw new Error(t('Impossible de trouver l’adresse du Wi-Fi local.'));
  return { ...wifi, url: `http://${choisie[1]}:${port}/`, catalogue: cat };
}

export function arreterPartage() {
  if (!PartageLocal || !actif) return;
  PartageLocal.arreterServeur();
  PartageLocal.arreterWifi();
  actif = false;
}

/** QR code standard de connexion Wi-Fi, reconnu par l'appareil photo d'Android et d'iPhone. */
export const qrWifi = (ssid: string, motDePasse: string) => {
  const e = (t: string) => t.replace(/([\\;,:"])/g, '\\$1');
  return `WIFI:T:WPA;S:${e(ssid)};P:${e(motDePasse)};;`;
};

/** Plan B : envoyer l'APK par Quick Share, Bluetooth… via le menu de partage d'Android. */
export async function envoyerApk() {
  if (!PartageLocal) throw new Error(t('Disponible uniquement sur Android.'));
  const copie = `${FS.cacheDirectory}Refuge.apk`;
  await FS.copyAsync({ from: `file://${PartageLocal.cheminApk()}`, to: copie });
  await Sharing.shareAsync(copie, { mimeType: 'application/vnd.android.package-archive', dialogTitle: t('Envoyer Refuge') });
}

// ───────────── Côté de l'ami qui reçoit ─────────────

export async function lireCatalogue(adresse: string): Promise<{ base: string; catalogue: Catalogue }> {
  const base = adresse.trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)/, 'http://');
  const r = await fetch(`${base}/catalogue.json`);
  if (!r.ok) throw new Error(t('Le téléphone partageur ne répond pas ({status}).', { status: r.status }));
  const catalogue = (await r.json()) as Catalogue;
  if (catalogue.app !== 'refuge') throw new Error(t('Ce n’est pas un partage Refuge.'));
  return { base, catalogue };
}
