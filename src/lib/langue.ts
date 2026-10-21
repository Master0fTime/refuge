import { KEYS, lire, useStored } from '@/lib/store';

// Langue de l'IA (réponses), de la reconnaissance vocale et de la voix.
// Les écrans et les fiches restent en français pour l'instant : leur traduction est la prochaine étape.

export type Langue = {
  code: 'fr' | 'de' | 'it' | 'en';
  nom: string;
  drapeau: string;
  /** Code de langue de la voix du téléphone. */
  voix: string;
  /** Consigne donnée à l'IA (écrite dans la langue, pour qu'elle s'y tienne). */
  consigne: string;
};

export const LANGUES: Langue[] = [
  { code: 'fr', nom: 'Français', drapeau: '🇫🇷', voix: 'fr-FR', consigne: 'Réponds toujours en français.' },
  { code: 'de', nom: 'Deutsch', drapeau: '🇩🇪', voix: 'de-DE', consigne: 'Antworte immer auf Deutsch (Du-Form), auch wenn die Fiches auf Französisch sind.' },
  { code: 'it', nom: 'Italiano', drapeau: '🇮🇹', voix: 'it-IT', consigne: 'Rispondi sempre in italiano (dai del tu), anche se le schede sono in francese.' },
  { code: 'en', nom: 'English', drapeau: '🇬🇧', voix: 'en-GB', consigne: 'Always answer in English, even though the sheets are in French.' },
];

/** Langue du téléphone si elle est proposée, sinon le français. */
function langueDuTelephone(): Langue['code'] {
  try {
    const code = new Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    return LANGUES.find((l) => l.code === code)?.code ?? 'fr';
  } catch {
    return 'fr';
  }
}

const parCode = (code: string) => LANGUES.find((l) => l.code === code) ?? LANGUES[0];

export const langueActuelle = (): Langue => parCode(lire<string>(KEYS.langue, langueDuTelephone()));

export function useLangue() {
  const [code, setCode] = useStored<string>(KEYS.langue, langueDuTelephone());
  return [parCode(code), setCode] as const;
}

export const consigneLangue = () => langueActuelle().consigne;
