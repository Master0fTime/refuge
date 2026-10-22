import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { DOSSIER, estInstalle, type Telechargeable } from '@/lib/ia/modeles';
import { langueActuelle, type Langue } from '@/lib/langue';
import { motsCles, termes } from '@/lib/recherche';

// Encyclopédie hors ligne : la partie médecine de Wikipédia, réduite à l'essentiel (introduction,
// symptômes, traitement, premiers secours, prévention). Fabriquée par outils/encyclopedie/ à partir des
// fichiers Kiwix, publiée sur GitHub Releases. Contenu sous licence CC BY-SA 4.0 (auteurs de Wikipédia).

export type PackEncyclopedie = Telechargeable & { langue: Langue['code']; articles: number };

const RELEASE = 'https://github.com/Master0fTime/refuge/releases/download/encyclopedie-2026-10';
const pack = (langue: 'fr' | 'de' | 'it', octets: number, articles: number): PackEncyclopedie => ({
  langue,
  fichier: `encyclopedie-${langue}-2026-10.db`,
  url: `${RELEASE}/encyclopedie-${langue}-2026-10.db`,
  octets,
  articles,
});

export const PACKS_ENCYCLOPEDIE: PackEncyclopedie[] = [pack('fr', 55_074_816, 36_899), pack('de', 39_174_144, 17_760), pack('it', 28_520_448, 14_735)];

/** Le pack de la langue choisie (le français pour une langue sans pack). */
export function packEncyclopedie(code: Langue['code'] = langueActuelle().code) {
  return PACKS_ENCYCLOPEDIE.find((p) => p.langue === code) ?? PACKS_ENCYCLOPEDIE[0];
}

export const encyclopedieInstallee = () => estInstalle(packEncyclopedie());

export const LICENCE = 'Wikipédia, CC BY-SA 4.0';

// Une connexion par fichier, ouverte à la première recherche puis réutilisée.
const ouvertes = new Map<string, SQLiteDatabase>();
async function base(): Promise<SQLiteDatabase | null> {
  const p = packEncyclopedie();
  if (ouvertes.has(p.fichier)) return ouvertes.get(p.fichier)!;
  if (!(await estInstalle(p))) return null;
  const db = openDatabaseSync(p.fichier, undefined, DOSSIER.replace(/^file:\/\//, ''));
  ouvertes.set(p.fichier, db);
  return db;
}

/** À appeler avant de supprimer ou remplacer un pack : le fichier ne doit plus être ouvert. */
export function fermer() {
  for (const db of ouvertes.values()) db.closeSync();
  ouvertes.clear();
}

export type PassageEncyclopedie = { article: number; titre: string; texte: string; extrait: string };

/** Cherche les passages qui répondent le mieux à la question. Sans pack installé : aucun résultat. */
export async function chercherEncyclopedie(q: string, limite = 3): Promise<PassageEncyclopedie[]> {
  const exacts = motsCles(q);
  // Plus les synonymes et corrections (vocabulaire des fiches), pour la recherche large.
  const mots = [...new Set([...exacts, ...termes(q)])];
  if (!mots.length) return [];
  // Préfixe seulement pour les mots longs (« hémorragi* » → hémorragie, hémorragique) :
  // sur un mot court, « vespa* » attraperait aussi « vespasiani ».
  const terme = (m: string) => (m.length >= 6 ? `"${m}"*` : `"${m}"`);
  try {
    const db = await base();
    if (!db) return [];
    // Le titre compte beaucoup : « Hypothermie » doit passer avant un article qui la cite en passant.
    const requete = (expr: string) =>
      db.getAllSync<PassageEncyclopedie>(
        `SELECT article, titre, texte, snippet(passage, 1, '', '', '…', 16) AS extrait
         FROM passage WHERE passage MATCH ? ORDER BY bm25(passage, 6.0, 1.0) LIMIT ?`,
        expr,
        limite * 3,
      );
    // D'abord les passages qui contiennent tous les mots de la question, puis la recherche large.
    const lignes = [...(exacts.length > 1 ? requete(exacts.map(terme).join(' AND ')) : []), ...requete(mots.map(terme).join(' OR '))];
    // Un seul passage par article : mieux vaut trois articles différents que trois fois le même.
    const vus = new Set<number>();
    return lignes.filter((l) => !vus.has(l.article) && vus.add(l.article)).slice(0, limite);
  } catch {
    return [];
  }
}

export type Article = { titre: string; passages: string[] };

export async function lireArticle(id: number): Promise<Article | null> {
  const db = await base();
  if (!db) return null;
  const a = db.getFirstSync<{ titre: string }>('SELECT titre FROM article WHERE id = ?', id);
  if (!a) return null;
  const ps = db.getAllSync<{ texte: string }>('SELECT texte FROM passage WHERE article = ? ORDER BY rowid', id);
  return { titre: a.titre, passages: ps.map((p) => p.texte) };
}

