import { PAYS, paysDuTelephone, type Pays } from '@/data/pays';
import { KEYS, lire, useStored } from '@/lib/store';

const parCode = (code: string) => PAYS.find((p) => p.code === code) ?? PAYS[0];

export const paysActuel = (): Pays => parCode(lire<string>(KEYS.pays, paysDuTelephone()));

export function usePays() {
  const [code, setCode] = useStored<string>(KEYS.pays, paysDuTelephone());
  return [parCode(code), setCode] as const;
}

function variables(p: Pays): Record<string, string> {
  return {
    urgence: '112',
    secours: p.ambulance === '112' ? '112' : `112 (ou le ${p.ambulance})`,
    police: p.police,
    pompiers: p.pompiers,
    ambulance: p.ambulance,
    antipoison: p.antipoison,
    antipoisonNom: p.antipoisonNom,
    aidePsy: p.aidePsy,
    aidePsyNom: p.aidePsyNom,
    radios: p.radios,
    alerteApp: p.alerteApp,
    orgsAide: p.orgsAide,
    smsOu: p.sms ? `SMS au ${p.sms}, ou ` : '',
    smsSilencieux: p.sms
      ? `Si tu ne peux pas parler : SMS au ${p.sms}.`
      : 'Si tu ne peux pas parler, chuchote ou laisse la ligne ouverte.',
  };
}

/** Remplace {secours}, {police}… par les numéros et noms du pays choisi. */
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
