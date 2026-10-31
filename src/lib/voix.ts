import AudioRecord from '@fugood/react-native-audio-pcm-stream';
import * as Speech from 'expo-speech';
import { PermissionsAndroid, Platform } from 'react-native';
import { initWhisper, type WhisperContext } from 'whisper.rn/index';
import { chemin, estInstalle, ramGo, type Telechargeable } from '@/lib/ia/modeles';
import { langueActuelle } from '@/lib/langue';
import { KEYS, lire } from '@/lib/store';
import { t } from '@/i18n';

// Reconnaissance vocale 100 % hors ligne (whisper.cpp) et lecture des réponses à voix haute.

export type ModeleVoix = Telechargeable & { id: string; nom: string; ramMinGo: number };

export const MODELES_VOIX: ModeleVoix[] = [
  {
    id: 'voix-rapide',
    nom: 'Reconnaissance vocale (rapide)',
    fichier: 'ggml-base-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin',
    octets: 59707625,
    ramMinGo: 0,
  },
  {
    id: 'voix-precise',
    nom: 'Reconnaissance vocale (précise)',
    fichier: 'ggml-small-q5_1.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
    octets: 190085487,
    ramMinGo: 6,
  },
];

export function voixConseillee(): ModeleVoix {
  const ram = ramGo() ?? 4;
  return [...MODELES_VOIX].reverse().find((m) => ram >= m.ramMinGo - 0.5) ?? MODELES_VOIX[0];
}

/** Le meilleur modèle vocal déjà présent sur le téléphone. */
export async function voixInstallee(): Promise<ModeleVoix | null> {
  for (const m of [...MODELES_VOIX].reverse()) if (await estInstalle(m)) return m;
  return null;
}

let contexte: WhisperContext | null = null;
let charge: string | null = null;

async function chargerWhisper() {
  const m = await voixInstallee();
  if (!m) throw new Error(t('La reconnaissance vocale n’est pas installée.'));
  if (contexte && charge === m.id) return contexte;
  await contexte?.release();
  contexte = await initWhisper({ filePath: chemin(m) });
  charge = m.id;
  return contexte;
}

// ───────────── Enregistrement du micro (PCM 16 kHz mono, le format attendu par Whisper) ─────────────

let morceaux: Uint8Array[] = [];
let abonnement: { remove(): void } | null = null;

// Arrêt automatique : après avoir parlé, ~1,5 s de silence termine la phrase.
const SEUIL_VOIX = 900; // amplitude 16 bits au-delà de laquelle on considère qu'il y a de la voix
const SILENCE_FIN_MS = 1500;
const DUREE_MAX_MS = 60_000;

/** Démarre le micro. `onFin` est appelé quand la personne a fini de parler (silence) ou au bout de 60 s. */
export async function demarrerEnregistrement(onFin?: () => void) {
  if (Platform.OS === 'android') {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: t('Micro'),
      message: t('Refuge utilise le micro pour comprendre ta question. Le son reste sur ton téléphone.'),
      buttonPositive: 'OK',
    });
    if (r !== PermissionsAndroid.RESULTS.GRANTED) throw new Error(t('Autorise le micro pour parler à l’IA.'));
  }
  Speech.stop();
  morceaux = [];
  let aParle = false;
  let silenceMs = 0;
  let dureeMs = 0;
  let fini = false;
  const finir = () => {
    if (fini) return;
    fini = true;
    onFin?.();
  };
  // 6 = VOICE_RECOGNITION : source micro optimisée pour la voix (réduction de bruit).
  AudioRecord.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, audioSource: 6, wavFile: 'voix.wav', bufferSize: 4096 });
  abonnement = AudioRecord.on('data', (b64) => {
    const bloc = base64VersOctets(b64);
    morceaux.push(bloc);
    const ms = (bloc.length / 2 / 16000) * 1000;
    dureeMs += ms;
    if (volumeMax(bloc) > SEUIL_VOIX) {
      aParle = true;
      silenceMs = 0;
    } else if (aParle) {
      silenceMs += ms;
    }
    if ((aParle && silenceMs >= SILENCE_FIN_MS) || dureeMs >= DUREE_MAX_MS) finir();
  });
  AudioRecord.start();
  // On charge Whisper pendant que l'utilisateur parle : la transcription démarre plus vite.
  chargerWhisper().catch(() => {});
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const TABLE = new Uint8Array(128);
for (let i = 0; i < B64.length; i++) TABLE[B64.charCodeAt(i)] = i;

function base64VersOctets(b64: string) {
  const n = b64.replace(/=+$/, '').length;
  const out = new Uint8Array(Math.floor((n * 3) / 4));
  let j = 0;
  for (let i = 0; i < n; i += 4) {
    const a = TABLE[b64.charCodeAt(i)];
    const b = TABLE[b64.charCodeAt(i + 1)];
    const c = TABLE[b64.charCodeAt(i + 2)];
    const d = TABLE[b64.charCodeAt(i + 3)];
    out[j++] = (a << 2) | (b >> 4);
    if (j < out.length) out[j++] = ((b & 15) << 4) | (c >> 2);
    if (j < out.length) out[j++] = ((c & 3) << 6) | d;
  }
  return out;
}

/** Arrête le micro et transcrit ce qui a été dit. */
export async function arreterEtTranscrire(): Promise<string> {
  await AudioRecord.stop();
  abonnement?.remove();
  abonnement = null;

  // whisper.rn attend du PCM 16 bits brut (il le convertit lui-même) : on recolle simplement les morceaux.
  const blocs = morceaux;
  morceaux = [];
  const total = blocs.reduce((s, b) => s + b.length, 0);
  const pcm = new Uint8Array(total - (total % 2));
  let k = 0;
  for (const b of blocs) {
    const n = Math.min(b.length, pcm.length - k);
    pcm.set(b.subarray(0, n), k);
    k += n;
  }
  const echantillons = pcm.length / 2;
  if (echantillons < 16000 * 0.5) return ''; // moins d'une demi-seconde : rien d'exploitable
  if (volumeMax(pcm) < 300) throw new Error(t('Le micro n’a capté que du silence. Vérifie qu’aucune autre appli ne l’utilise, puis réessaie.'));

  const ctx = await chargerWhisper();
  const { promise } = ctx.transcribeData(pcm.buffer, {
    language: langueActuelle().code,
    maxThreads: 4,
    // Le contexte aide Whisper à reconnaître le vocabulaire de survie (seulement en français pour l'instant).
    ...(langueActuelle().code === 'fr' ? { prompt: 'Question sur la survie, les premiers secours, l’eau, le feu, la nourriture, la sécurité.' } : {}),
  });
  const { result } = await promise;
  // Whisper note parfois les bruits entre crochets, parenthèses ou astérisques : on les retire.
  return result
    .replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Amplitude maximale (0 à 32767) : sert à détecter un micro muet. */
function volumeMax(pcm: Uint8Array) {
  const v = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let max = 0;
  for (let i = 0; i + 1 < pcm.length; i += 64) max = Math.max(max, Math.abs(v.getInt16(i, true)));
  return max;
}

// ───────────── Lecture à voix haute (synthèse vocale du téléphone, hors ligne) ─────────────

export type ReglageVoix = { identifiant: string | null; vitesse: number; hauteur?: number };
const REGLAGE_DEFAUT: ReglageVoix = { identifiant: null, vitesse: 1, hauteur: 1 };

/** Voix installées pour la langue choisie, les plus naturelles d'abord (hors ligne, qualité « Enhanced »). */
export async function voixFrancaises(): Promise<Speech.Voice[]> {
  const langue = langueActuelle().code;
  const toutes = await Speech.getAvailableVoicesAsync();
  const score = (v: Speech.Voice) =>
    (v.quality === Speech.VoiceQuality.Enhanced ? 4 : 0) +
    (/network/i.test(v.identifier) ? 0 : 2) + // les voix « network » demandent Internet
    (/-(CH|FR|DE|IT|GB)/i.test(v.language) ? 1 : 0);
  // Les voix « network » demandent Internet : hors ligne, le téléphone les remplace par sa voix par défaut,
  // d'où l'impression que toutes les voix se ressemblent. On ne garde qu'une entrée par voix réelle.
  const vues = new Set<string>();
  return toutes
    .filter((v) => v.language.toLowerCase().startsWith(langue) && !/network/i.test(v.identifier))
    .sort((a, b) => score(b) - score(a))
    .filter((v) => {
      const cle = v.identifier.replace(/[-_]local$/i, '').toLowerCase();
      if (vues.has(cle)) return false;
      vues.add(cle);
      return true;
    });
}

/** Petit nom lisible : « Voix B (Google) », « Voix féminine 1 (Samsung)»… */
export function nomVoix(v: Speech.Voice, i: number) {
  const google = /-x-([a-z]{3})-/i.exec(v.identifier);
  if (google) return t('Voix {lettre} (Google)', { lettre: google[1].slice(-1).toUpperCase() });
  const samsung = /SMT([fmlh])(\d+)/i.exec(v.identifier);
  if (samsung) {
    const genre = /[fl]/i.test(samsung[1]) ? t('féminine') : t('masculine');
    return t('Voix {genre} {n} (Samsung)', { genre, n: Number(samsung[2]) + 1 });
  }
  return t('Voix {n}', { n: i + 1 });
}

// Liste des voix par langue, gardée en mémoire (la demander au système est lent).
const cache: Record<string, string[]> = {};
async function voixDeLaLangue() {
  const l = langueActuelle().code;
  if (!cache[l]) cache[l] = (await voixFrancaises()).map((v) => v.identifier);
  return cache[l];
}

/** Parle avec la voix choisie dans les réglages (ou la plus naturelle disponible). */
export async function dire(texte: string, options: { lent?: boolean; finie?: () => void } = {}) {
  const r = lire<ReglageVoix>(KEYS.voix, REGLAGE_DEFAUT);
  const langue = langueActuelle();
  const dispo = await voixDeLaLangue();
  // Une voix choisie pour une autre langue est ignorée : on prend la plus naturelle de la langue.
  const voice = (r.identifiant && dispo.includes(r.identifiant) ? r.identifiant : dispo[0]) ?? undefined;
  Speech.stop();
  Speech.speak(texte, { language: langue.voix, voice, rate: r.vitesse * (options.lent ? 0.9 : 1), pitch: r.hauteur ?? 1, onDone: options.finie, onStopped: options.finie });
}

export function lireReponse(texte: string) {
  dire(texte.replace(/\[\d+\]/g, '').replace(/[*#]/g, ''));
}

export const arreterLecture = () => Speech.stop();
