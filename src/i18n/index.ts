import type { Fiche } from '@/data/fiches';
import type { LieuId, Probleme } from '@/data/guide';
import { langueActuelle, useLangue, type Langue } from '@/lib/langue';
import { FICHES_DE } from './fiches.de';
import { FICHES_IT } from './fiches.it';
import { GUIDE_DE } from './guide.de';
import { GUIDE_IT } from './guide.it';
import { UI_DE } from './ui.de';
import { UI_IT } from './ui.it';

// Traduction : le texte FRANÇAIS sert de clé. Une traduction absente laisse simplement le français,
// pour que l'appli ne montre jamais d'écran vide.

type Code = Langue['code'];

const UI: Partial<Record<Code, Record<string, string>>> = { de: UI_DE, it: UI_IT };

function remplir(texte: string, valeurs?: Record<string, string | number>) {
  return valeurs ? texte.replace(/\{(\w+)\}/g, (m, k: string) => (k in valeurs ? String(valeurs[k]) : m)) : texte;
}

/** Traduit un texte d'interface. Les {variables} sont remplacées par `valeurs`. */
export function t(fr: string, valeurs?: Record<string, string | number>, code: Code = langueActuelle().code) {
  return remplir(UI[code]?.[fr] ?? fr, valeurs);
}

/** Version « hook » : l'écran se met à jour dès qu'on change de langue. */
export function useT() {
  const [langue] = useLangue();
  return (fr: string, valeurs?: Record<string, string | number>) => t(fr, valeurs, langue.code);
}

// ───────────── Fiches ─────────────

export type FicheTraduite = {
  titre: string;
  resume: string;
  choix?: string[];
  etapes?: string[];
  sansSecours?: string[];
  attention?: string[];
  ensuite?: string[];
};

const FICHES_TRAD: Partial<Record<Code, Record<string, FicheTraduite>>> = { de: FICHES_DE, it: FICHES_IT };

/** La fiche dans la langue choisie (champ par champ : ce qui n'est pas traduit reste en français). */
export function traduireFiche(f: Fiche, code: Code = langueActuelle().code): Fiche {
  const tr = FICHES_TRAD[code]?.[f.id];
  if (!tr) return f;
  return {
    ...f,
    titre: tr.titre,
    resume: tr.resume,
    choix: f.choix?.map((c, i) => ({ ...c, label: tr.choix?.[i] ?? c.label })),
    etapes: tr.etapes ?? f.etapes,
    sansSecours: tr.sansSecours ?? f.sansSecours,
    attention: tr.attention ?? f.attention,
    ensuite: tr.ensuite ?? f.ensuite,
  };
}

// ───────────── Assistant guidé ─────────────

export type ConseilsTraduits = { immediat?: string[]; ensuite?: string[] };
export type ProblemeTraduit = {
  label: string;
  tri?: { question: string; options: string[] };
  commun: ConseilsTraduits;
  lieux?: Record<string, ConseilsTraduits>;
};
export type GuideTraduit = { lieux: Record<string, string>; problemes: Record<string, ProblemeTraduit> };

const GUIDE_TRAD: Partial<Record<Code, GuideTraduit>> = { de: GUIDE_DE, it: GUIDE_IT };

export const guideTraduit = (code: Code = langueActuelle().code) => GUIDE_TRAD[code];

type Conseils = { immediat?: string[]; ensuite?: string[]; fiches?: string[] };
const traduireConseils = <C extends Conseils>(c: C, tr?: ConseilsTraduits): C => ({
  ...c,
  immediat: tr?.immediat ?? c.immediat,
  ensuite: tr?.ensuite ?? c.ensuite,
});

/** Un problème de l'assistant dans la langue choisie (même structure, textes traduits). */
export function traduireProbleme(p: Probleme, code: Code = langueActuelle().code): Probleme {
  const g = GUIDE_TRAD[code]?.problemes[p.id];
  if (!g) return p;
  return {
    ...p,
    label: g.label,
    tri: p.tri && {
      question: g.tri?.question ?? p.tri.question,
      options: p.tri.options.map((o, i) => ({ ...o, label: g.tri?.options[i] ?? o.label })),
    },
    commun: traduireConseils(p.commun, g.commun),
    lieux:
      p.lieux &&
      (Object.fromEntries(Object.entries(p.lieux).map(([k, c]) => [k, c && traduireConseils(c, g.lieux?.[k])])) as Probleme['lieux']),
  };
}

export const nomLieu = (id: LieuId, label: string, code: Code = langueActuelle().code) => GUIDE_TRAD[code]?.lieux[id] ?? label;
