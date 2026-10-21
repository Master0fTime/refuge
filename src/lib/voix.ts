import AudioRecord from '@fugood/react-native-audio-pcm-stream';
import * as Speech from 'expo-speech';
import { PermissionsAndroid, Platform } from 'react-native';
import { initWhisper, type WhisperContext } from 'whisper.rn/index';
import { chemin, estInstalle, ramGo, type Telechargeable } from '@/lib/ia/modeles';

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
  if (!m) throw new Error('La reconnaissance vocale n’est pas installée.');
  if (contexte && charge === m.id) return contexte;
  await contexte?.release();
  contexte = await initWhisper({ filePath: chemin(m) });
  charge = m.id;
  return contexte;
}

// ───────────── Enregistrement du micro (PCM 16 kHz mono, le format attendu par Whisper) ─────────────

let morceaux: string[] = [];
let abonnement: { remove(): void } | null = null;

export async function demarrerEnregistrement() {
  if (Platform.OS === 'android') {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Micro',
      message: 'Refuge utilise le micro pour comprendre ta question. Le son reste sur ton téléphone.',
      buttonPositive: 'OK',
    });
    if (r !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Autorise le micro pour parler à l’IA.');
  }
  Speech.stop();
  morceaux = [];
  // 6 = VOICE_RECOGNITION : source micro optimisée pour la voix (réduction de bruit).
  AudioRecord.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, audioSource: 6, wavFile: 'voix.wav', bufferSize: 4096 });
  abonnement = AudioRecord.on('data', (b64) => morceaux.push(b64));
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

  // Entiers 16 bits little-endian → flottants entre -1 et 1.
  const blocs = morceaux.map(base64VersOctets);
  morceaux = [];
  const total = blocs.reduce((s, b) => s + b.length, 0);
  const pcm = new Float32Array(Math.floor(total / 2));
  let k = 0;
  for (const b of blocs) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    for (let i = 0; i + 1 < b.length; i += 2) pcm[k++] = v.getInt16(i, true) / 32768;
  }
  if (pcm.length < 16000 * 0.5) return ''; // moins d'une demi-seconde : rien d'exploitable

  const ctx = await chargerWhisper();
  const { promise } = ctx.transcribeData(pcm.buffer, {
    language: 'fr',
    maxThreads: 4,
    prompt: 'Question en français sur la survie, les premiers secours, l’eau, le feu, la nourriture, la sécurité.',
  });
  const { result } = await promise;
  // Whisper note parfois les silences ou la musique entre crochets : on les retire.
  return result.replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

// ───────────── Lecture à voix haute (voix du système, hors ligne en général) ─────────────

export function lire(texte: string) {
  Speech.stop();
  Speech.speak(texte.replace(/\[\d+\]/g, '').replace(/[*#]/g, ''), { language: 'fr-FR', rate: 1.0 });
}

export const arreterLecture = () => Speech.stop();
