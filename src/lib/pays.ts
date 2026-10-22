import { PAYS, paysDuTelephone, type Pays } from '@/data/pays';
import { t } from '@/i18n';
import { langueActuelle, type Langue } from '@/lib/langue';
import { KEYS, lire, useStored } from '@/lib/store';

const parCode = (code: string) => PAYS.find((p) => p.code === code) ?? PAYS[0];

export const paysActuel = (): Pays => parCode(lire<string>(KEYS.pays, paysDuTelephone()));

export function usePays() {
  const [code, setCode] = useStored<string>(KEYS.pays, paysDuTelephone());
  return [parCode(code), setCode] as const;
}

// Les morceaux de phrase autour des numéros, dans chaque langue.
const MOTS: Record<Langue['code'], { ou: (n: string) => string; smsOu: (n: string) => string; smsSilencieux: (n?: string) => string }> = {
  fr: {
    ou: (n) => `112 (ou le ${n})`,
    smsOu: (n) => `SMS au ${n}, ou `,
    smsSilencieux: (n) => (n ? `Si tu ne peux pas parler : SMS au ${n}.` : 'Si tu ne peux pas parler, chuchote ou laisse la ligne ouverte.'),
  },
  de: {
    ou: (n) => `112 (oder ${n})`,
    smsOu: (n) => `SMS an ${n} oder `,
    smsSilencieux: (n) => (n ? `Wenn du nicht sprechen kannst: SMS an ${n}.` : 'Wenn du nicht sprechen kannst, flüstere oder lass die Leitung offen.'),
  },
  it: {
    ou: (n) => `112 (o il ${n})`,
    smsOu: (n) => `SMS al ${n} oppure `,
    smsSilencieux: (n) => (n ? `Se non puoi parlare: SMS al ${n}.` : 'Se non puoi parlare, sussurra o lascia la linea aperta.'),
  },
  en: {
    ou: (n) => `112 (or ${n})`,
    smsOu: (n) => `text ${n}, or `,
    smsSilencieux: (n) => (n ? `If you cannot speak: text ${n}.` : 'If you cannot speak, whisper or leave the line open.'),
  },
};

function variables(p: Pays): Record<string, string> {
  const m = MOTS[langueActuelle().code];
  return {
    urgence: '112',
    secours: p.ambulance === '112' ? '112' : m.ou(p.ambulance),
    police: p.police,
    pompiers: p.pompiers,
    ambulance: p.ambulance,
    antipoison: p.antipoison,
    antipoisonNom: t(p.antipoisonNom),
    aidePsy: p.aidePsy,
    aidePsyNom: t(p.aidePsyNom),
    radios: t(p.radios),
    alerteApp: t(p.alerteApp),
    orgsAide: t(p.orgsAide),
    smsOu: p.sms ? m.smsOu(p.sms) : '',
    smsSilencieux: m.smsSilencieux(p.sms),
  };
}

/** Remplace {secours}, {police}… par les numéros et noms du pays choisi (dans la langue choisie). */
export function localiser(texte: string, p: Pays = paysActuel()) {
  const v = variables(p);
  return texte.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
}

/** Résumé du pays pour l'IA : elle donne alors les bons numéros et les bonnes organisations. */
export function resumePays(p: Pays = paysActuel()) {
  return [
    `Pays de l'utilisateur : ${p.nom}.`,
    `Numéros : urgence 112, ambulance ${p.ambulance}, police ${p.police}, pompiers ${p.pompiers}, ${p.antipoisonNom} ${p.antipoison}, ${p.aidePsyNom} ${p.aidePsy}${p.sms ? `, SMS d'urgence ${p.sms}` : ''}${p.autres.map((a) => `, ${a.nom} ${a.numero}`).join('')}.`,
    `Alertes : ${p.alerteApp}. Radios : ${p.radios}. Aide alimentaire et sociale : ${p.orgsAide}.`,
    p.abris ? `Abris : ${p.abris}` : '',
    p.provisions ? `Réserves conseillées : ${p.provisions}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Version très courte pour l'IA : chaque mot de consigne ralentit la réponse sur un téléphone. */
export function resumePaysCourt(p: Pays = paysActuel()) {
  return `Pays : ${p.nom}. Urgence 112, ambulance ${p.ambulance}, police ${p.police}, pompiers ${p.pompiers}, intoxication ${p.antipoison}, écoute ${p.aidePsy}.`;
}
