import { openDatabaseSync } from 'expo-sqlite';
import { FICHES, rechercher as rechercherSimple, type Fiche } from '@/data/fiches';
import { traduireFiche } from '@/i18n';
import { langueActuelle } from '@/lib/langue';
import { localiser, paysActuel } from '@/lib/pays';

// Index plein texte (SQLite FTS5) de toutes les fiches, reconstruit quand le contenu change.
// C'est aussi la « mémoire » dans laquelle l'IA locale pioche (RAG).

const db = openDatabaseSync('savoir.db');

export const texteFiche = (fiche: Fiche) => {
  const f = traduireFiche(fiche);
  return localiser(
    [
      f.resume,
      ...(f.choix ?? []).map((c) => c.label),
      ...(f.etapes ?? []),
      ...(f.sansSecours ?? []).map((a) => `Si personne ne peut venir (secours injoignables) : ${a}`),
      ...(f.attention ?? []).map((a) => `Attention : ${a}`),
      ...(f.ensuite ?? []).map((a) => `Ensuite : ${a}`),
    ].join('\n'),
  );
};

/** Pays + langue : l'index de recherche dépend des deux (numéros et textes traduits). */
const contexteIndex = () => `${paysActuel().code}-${langueActuelle().code}`;

// Empreinte du contenu, du pays et de la langue : si l'un change, l'index est reconstruit.
function empreinte() {
  let h = 0;
  const s = contexteIndex() + FICHES.map((f) => f.id + traduireFiche(f).titre + texteFiche(f)).join('|');
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(h);
}

let indexePour: string | null = null;
function indexer() {
  if (indexePour === contexteIndex()) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS meta (cle TEXT PRIMARY KEY, valeur TEXT);
    CREATE VIRTUAL TABLE IF NOT EXISTS fiches_fts USING fts5(
      id UNINDEXED, titre, contenu, tokenize = 'unicode61 remove_diacritics 2'
    );
  `);
  const e = empreinte();
  const actuelle = db.getFirstSync<{ valeur: string }>('SELECT valeur FROM meta WHERE cle = ?', 'empreinte');
  if (actuelle?.valeur !== e) {
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM fiches_fts');
      for (const f of FICHES) db.runSync('INSERT INTO fiches_fts (id, titre, contenu) VALUES (?, ?, ?)', f.id, traduireFiche(f).titre, texteFiche(f));
      db.runSync('INSERT OR REPLACE INTO meta (cle, valeur) VALUES (?, ?)', 'empreinte', e);
    });
  }
  indexePour = contexteIndex();
}

// Mots trop courants (ou de politesse) pour aider la recherche.
const VIDES = new Set(
  'le la les un une des de du d l et ou a au aux en dans sur sous pour par avec sans ce cet cette ces je tu il elle on nous vous ils elles me te se mon ma mes ton ta tes son sa ses est suis es sont ai as avez ont que qui quoi comment quand pourquoi faire fait peut peux veux dois faut pas ne plus tres trop si y aide aider moi toi sais sait savoir besoin vais va salut bonjour alors explique voila juste rien chose truc'.split(
    ' ',
  ),
);
// Les mêmes en allemand et en italien (texte sans accents ni trémas).
for (const m of (
  'der die das den dem des ein eine einen einem einer und oder in im an am auf mit ohne von vom zu zum zur fur ist sind bin bist hat habe haben ich du er sie es wir ihr mein dein sein was wie wann warum wo kann konnen muss soll will nicht kein keine sehr auch noch hilfe helfen bitte mir mich dir dich hallo ' +
  'il lo la gli le un uno una di da del della dei delle in nel nella su sul sulla con per tra fra e o che chi cosa come quando perche dove sono sei ha hanno ho io tu lui lei noi voi loro mio mia tuo tua suo sua non piu molto anche aiuto aiutare posso puoi devo deve fare ciao'
).split(' '))
  VIDES.add(m);

/** Variante sans accents ni pluriel simple, pour être tolérant aux fautes de frappe courantes. */
export function motsCles(q: string) {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length > 1 && !VIDES.has(m))
    .map((m) => (m.length > 4 ? m.replace(/(s|x)$/, '') : m));
}

// Synonymes : les mots de tous les jours vers ceux des fiches.
const SYNONYMES: Record<string, string[]> = {
  incendie: ['feu', 'fumee', 'flamme'],
  feu: ['incendie', 'flamme'],
  fumee: ['incendie', 'monoxyde'],
  brule: ['brulure', 'incendie'],
  gaz: ['fuite', 'odeur'],
  coeur: ['cardiaque', 'infarctus', 'poitrine'],
  poitrine: ['infarctus', 'cardiaque'],
  infarctus: ['cardiaque', 'poitrine'],
  avc: ['attaque', 'cerebrale', 'visage', 'parole'],
  paralyse: ['avc'],
  allergie: ['anaphylactique', 'gonflement'],
  gonfle: ['allergie', 'anaphylactique'],
  convulsion: ['epilepsie', 'crise'],
  epilepsie: ['convulsion'],
  diabete: ['hypoglycemie', 'sucre', 'insuline'],
  asthme: ['respirer', 'inhalateur'],
  serpent: ['vipere', 'morsure'],
  vipere: ['serpent', 'morsure'],
  guepe: ['piqure', 'abeille'],
  tique: ['piqure', 'lyme'],
  chien: ['morsure'],
  inondation: ['crue', 'eau'],
  crue: ['inondation'],
  seisme: ['tremblement', 'terre'],
  tremblement: ['seisme'],
  courant: ['electricite', 'blackout', 'panne'],
  electricite: ['blackout', 'courant', 'electrisation'],
  panne: ['blackout', 'courant'],
  electrocute: ['electrisation', 'courant'],
  tempete: ['orage', 'vent'],
  orage: ['tempete', 'foudre'],
  nucleaire: ['radioactivite', 'iode'],
  chimique: ['toxique', 'nuage'],
  attentat: ['attaque', 'echapper', 'cacher'],
  terroriste: ['attentat', 'attaque'],
  tir: ['tirs', 'attaque', 'balle'],
  bombe: ['explosion', 'bombardement'],
  explosion: ['bombardement', 'tirs', 'decombres'],
  agression: ['violence', 'agresse'],
  agresse: ['agression', 'violence'],
  vole: ['agression'],
  disparu: ['perdu', 'enfant'],
  noye: ['noyade'],
  empoisonne: ['intoxication', 'antipoison'],
  champignon: ['intoxication'],
  medicament: ['intoxication', 'traitement'],
  fievre: ['temperature'],
  evanoui: ['malaise', 'inconscient'],
  malaise: ['evanouissement'],
  tete: ['coup', 'crane'],
  nez: ['saignement'],
  oeil: ['yeux'],
  yeux: ['oeil'],
  angoisse: ['panique', 'peur'],
  panique: ['peur', 'angoisse'],
  faim: ['manger', 'nourriture'],
  soif: ['eau', 'boire'],
  froid: ['hypothermie', 'chaleur'],
  chaud: ['chaleur', 'canicule'],
};

// Vocabulaire des fiches, pour corriger les fautes de frappe et de dictée (« ascendie » → « incendie »).
let vocabulaire: string[] | null = null;
function vocab() {
  if (!vocabulaire) {
    const tous = new Set<string>();
    for (const f of FICHES) for (const m of motsCles(`${f.titre} ${texteFiche(f)}`)) if (m.length >= 5) tous.add(m);
    vocabulaire = [...tous];
  }
  return vocabulaire;
}

function distance(a: string, b: string) {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function corriger(mot: string) {
  const v = vocab();
  if (mot.length < 5 || v.some((x) => x.startsWith(mot))) return mot;
  let meilleur = mot;
  let min = mot.length >= 7 ? 3 : 2;
  for (const x of v) {
    if (Math.abs(x.length - mot.length) > 2) continue;
    const d = distance(mot, x);
    if (d < min) {
      min = d;
      meilleur = x;
    }
  }
  return meilleur;
}

/** Mots de la question, corrigés et enrichis de leurs synonymes. */
export function termes(q: string) {
  const out = new Set<string>();
  for (const brut of motsCles(q)) {
    const m = corriger(brut);
    out.add(m);
    for (const s of SYNONYMES[m] ?? []) out.add(s);
  }
  return [...out];
}

export type Resultat = { fiche: Fiche; extrait: string };

function requete(mots: string[], limite: number): Resultat[] {
  // Préfixe (mot*) pour attraper « saign » → saignement, saigne… ; OR pour rester tolérant.
  const match = mots.map((m) => `"${m}"*`).join(' OR ');
  const lignes = db.getAllSync<{ id: string; extrait: string }>(
    `SELECT id, snippet(fiches_fts, 2, '', '', '…', 16) AS extrait
     FROM fiches_fts WHERE fiches_fts MATCH ?
     ORDER BY bm25(fiches_fts, 0, 6.0, 1.0) LIMIT ?`,
    match,
    limite,
  );
  return lignes.flatMap((l) => {
    const fiche = FICHES.find((f) => f.id === l.id);
    return fiche ? [{ fiche: traduireFiche(fiche), extrait: l.extrait }] : [];
  });
}

/**
 * Cherche d'abord avec la question seule. Le contexte (messages précédents) ne sert qu'à compléter
 * une relance courte (« et si je n'ai pas de corde ? »), pour ne pas ramener d'anciens sujets.
 */
export function chercher(q: string, limite = 8, contexte = ''): Resultat[] {
  const mots = termes(q);
  try {
    indexer();
    let res = mots.length ? requete(mots, limite) : [];
    if (contexte && (motsCles(q).length <= 3 || res.length < 2)) {
      const vus = new Set(res.map((r) => r.fiche.id));
      const plus = requete(termes(contexte), limite).filter((r) => !vus.has(r.fiche.id));
      res = [...res, ...plus].slice(0, limite);
    }
    return res;
  } catch {
    // Repli sans SQLite (ne devrait pas arriver, mais l'appli ne doit jamais rester muette).
    return rechercherSimple(q)
      .slice(0, limite)
      .map((fiche) => ({ fiche, extrait: fiche.resume }));
  }
}
