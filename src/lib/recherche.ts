import { openDatabaseSync } from 'expo-sqlite';
import { FICHES, rechercher as rechercherSimple, type Fiche } from '@/data/fiches';
import { localiser, paysActuel } from '@/lib/pays';

// Index plein texte (SQLite FTS5) de toutes les fiches, reconstruit quand le contenu change.
// C'est aussi la « mémoire » dans laquelle l'IA locale pioche (RAG).

const db = openDatabaseSync('savoir.db');

export const texteFiche = (f: Fiche) =>
  localiser(
    [
      f.resume,
      ...(f.choix ?? []).map((c) => c.label),
      ...(f.etapes ?? []),
      ...(f.sansSecours ?? []).map((a) => `Si personne ne peut venir (secours injoignables) : ${a}`),
      ...(f.attention ?? []).map((a) => `Attention : ${a}`),
      ...(f.ensuite ?? []).map((a) => `Ensuite : ${a}`),
    ].join('\n'),
  );

// Empreinte du contenu et du pays : si une fiche ou le pays change, l'index est reconstruit.
function empreinte() {
  let h = 0;
  const s = paysActuel().code + FICHES.map((f) => f.id + f.titre + texteFiche(f)).join('|');
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(h);
}

let indexePour: string | null = null;
function indexer() {
  if (indexePour === paysActuel().code) return;
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
      for (const f of FICHES) db.runSync('INSERT INTO fiches_fts (id, titre, contenu) VALUES (?, ?, ?)', f.id, f.titre, texteFiche(f));
      db.runSync('INSERT OR REPLACE INTO meta (cle, valeur) VALUES (?, ?)', 'empreinte', e);
    });
  }
  indexePour = paysActuel().code;
}

// Mots trop courants pour aider la recherche.
const VIDES = new Set(
  'le la les un une des de du d l et ou a au aux en dans sur sous pour par avec sans ce cet cette ces je tu il elle on nous vous ils elles me te se mon ma mes ton ta tes son sa ses est suis es sont ai as avez ont que qui quoi comment quand pourquoi faire fait peut peux veux dois faut pas ne plus tres trop si y'.split(
    ' ',
  ),
);

/** Variante sans accents ni pluriel simple, pour être tolérant aux fautes de frappe courantes. */
function motsCles(q: string) {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length > 1 && !VIDES.has(m))
    .map((m) => (m.length > 4 ? m.replace(/(s|x)$/, '') : m));
}

export type Resultat = { fiche: Fiche; extrait: string };

export function chercher(q: string, limite = 8): Resultat[] {
  const mots = motsCles(q);
  if (!mots.length) return [];
  try {
    indexer();
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
      return fiche ? [{ fiche, extrait: l.extrait }] : [];
    });
  } catch {
    // Repli sans SQLite (ne devrait pas arriver, mais l'appli ne doit jamais rester muette).
    return rechercherSimple(q)
      .slice(0, limite)
      .map((fiche) => ({ fiche, extrait: fiche.resume }));
  }
}
