// Détection des urgences vitales dans une question : on affiche les fiches fixes et les numéros
// AVANT et INDÉPENDAMMENT de l'IA, qui peut se tromper ou être lente.

import { localiser } from '@/lib/pays';

// Libellés et numéros contiennent des variables ({secours}, {police}…) remplacées selon le pays.
export type Alerte = { label: string; fiche?: string; tel?: string; route?: '/panique' };

const REGLES: { motif: RegExp; alerte: Alerte }[] = [
  { motif: /saign|hemorrag|pisse le sang|perd (beaucoup de|du) sang|coupure profonde|artere/, alerte: { label: 'Saignement abondant', fiche: 'hemorragie' } },
  { motif: /respire (plus|pas)|ne respire|arret cardi|crise cardiaque|coeur (s.?est )?arrete|massage cardiaque/, alerte: { label: 'Ne respire pas', fiche: 'rcp' } },
  { motif: /etouff|avale de travers|coince dans la gorge|peut plus (respirer|parler)/, alerte: { label: 'Étouffement', fiche: 'etouffement' } },
  { motif: /inconscient|evanoui|repond (plus|pas)|perdu connaissance|malaise/, alerte: { label: 'Inconscient', fiche: 'pls' } },
  { motif: /brul/, alerte: { label: 'Brûlure', fiche: 'brulure' } },
  { motif: /hypotherm|gele|grelott|congel/, alerte: { label: 'Froid extrême', fiche: 'hypothermie' } },
  { motif: /coup de chaleur|insolation/, alerte: { label: 'Coup de chaleur', fiche: 'coup-chaleur' } },
  { motif: /noy/, alerte: { label: 'Noyade', fiche: 'noyade' } },
  { motif: /avc|paralys|bouche de travers|parle mal d.?un coup|visage (qui )?tombe/, alerte: { label: 'Signes d’AVC : appeler le {secours} immédiatement', fiche: 'avc' } },
  { motif: /incendi|ascendi|au feu|flammes?|fumee|ca brule|immeuble brule|maison brule/, alerte: { label: 'Incendie : sortir, rester bas, fermer les portes', fiche: 'incendie-logement' } },
  { motif: /odeur de gaz|fuite de gaz|sent le gaz/, alerte: { label: 'Odeur de gaz : ne rien allumer, sortir', fiche: 'fuite-gaz' } },
  { motif: /douleur (dans |a )?la poitrine|mal (a|au) (la poitrine|coeur)|infarctus|crise cardiaque/, alerte: { label: 'Douleur dans la poitrine : appeler le {secours}', fiche: 'infarctus' } },
  { motif: /allergi|gonfl|anaphyla|piqure.*(gorge|bouche)/, alerte: { label: 'Allergie grave ?', fiche: 'allergie-grave' } },
  { motif: /convuls|epilep|crise.*(tremble|secousse)/, alerte: { label: 'Crise de convulsions', fiche: 'epilepsie' } },
  { motif: /electrocut|electrise|electrique|courant.*(touche|pris)/, alerte: { label: 'Choc électrique : couper le courant d’abord', fiche: 'electrocution' } },
  { motif: /monoxyde|groupe electrogene|brasero/, alerte: { label: 'Monoxyde de carbone : aérer, sortir', fiche: 'monoxyde' } },
  { motif: /overdose|empoison|intoxi|champignon|avale (un |du )?produit|trop de (medicament|cachet)/, alerte: { label: 'Intoxication : {antipoisonNom} ({antipoison})', fiche: 'intoxication' } },
  { motif: /panique|angoiss|j.?ai (tres |trop )?peur|terrifi|j.?arrive (plus|pas) a respirer|coeur (bat|tape) (trop )?(vite|fort)/, alerte: { label: 'Besoin d’aide pour faire face ? Mode « Je panique »', route: '/panique' } },
  { motif: /suicid|me tuer|en finir|plus envie de vivre/, alerte: { label: 'Tu n’es pas seul·e : {aidePsyNom}, {aidePsy}', tel: '{aidePsy}' } },
  { motif: /tirs?|coups de feu|explosion|bombard|attentat|terroris/, alerte: { label: 'Tirs, explosion : se mettre à l’abri', fiche: 'conflit-tirs' } },
  { motif: /violen|agress|frappe|menace/, alerte: { label: 'Danger : {police} ou 112. {smsSilencieux}', tel: '{police}' } },
];

export function detecter(q: string): Alerte[] {
  const t = q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const vues = new Set<string>();
  return REGLES.filter(({ motif, alerte }) => {
    const cle = alerte.fiche ?? alerte.label;
    if (!motif.test(t) || vues.has(cle)) return false;
    vues.add(cle);
    return true;
  }).map(({ alerte: a }) => ({ ...a, label: localiser(a.label), tel: a.tel && localiser(a.tel).replace(/\s/g, '') }));
}
