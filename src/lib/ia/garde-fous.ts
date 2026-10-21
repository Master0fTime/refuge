// Détection des urgences vitales dans une question : on affiche les fiches fixes et les numéros
// AVANT et INDÉPENDAMMENT de l'IA, qui peut se tromper ou être lente.
// Les motifs couvrent le français, l'allemand et l'italien (texte sans accents ni trémas).

import { t } from '@/i18n';
import { localiser } from '@/lib/pays';

// Libellés et numéros contiennent des variables ({secours}, {police}…) remplacées selon le pays.
export type Alerte = { label: string; fiche?: string; tel?: string; route?: '/panique' };

const REGLES: { motif: RegExp; alerte: Alerte }[] = [
  {
    motif: /saign|hemorrag|pisse le sang|perd (beaucoup de|du) sang|coupure profonde|artere|blutet|blutung|sanguin|emorrag/,
    alerte: { label: 'Saignement abondant', fiche: 'hemorragie' },
  },
  {
    motif: /respire (plus|pas)|ne respire|arret cardi|coeur (s.?est )?arrete|massage cardiaque|atmet nicht|keine atmung|herzstillstand|non respira|arresto cardiaco/,
    alerte: { label: 'Ne respire pas', fiche: 'rcp' },
  },
  { motif: /etouff|avale de travers|coince dans la gorge|peut plus (respirer|parler)|erstick|verschluckt|soffoc/, alerte: { label: 'Étouffement', fiche: 'etouffement' } },
  {
    motif: /inconscient|evanoui|repond (plus|pas)|perdu connaissance|malaise|bewusstlos|ohnmacht|incoscient|svenut|non risponde/,
    alerte: { label: 'Inconscient', fiche: 'pls' },
  },
  { motif: /brul|verbrenn|verbruh|ustion|scottat/, alerte: { label: 'Brûlure', fiche: 'brulure' } },
  { motif: /hypotherm|\bgele|grelott|congel|unterkuhl|erfrier|ipotermi|congelat/, alerte: { label: 'Froid extrême', fiche: 'hypothermie' } },
  { motif: /coup de chaleur|insolation|hitzschlag|sonnenstich|colpo di calore/, alerte: { label: 'Coup de chaleur', fiche: 'coup-chaleur' } },
  { motif: /\bnoy|ertrink|annega/, alerte: { label: 'Noyade', fiche: 'noyade' } },
  {
    motif: /\bavc\b|paralys|bouche de travers|parle mal d.?un coup|visage (qui )?tombe|schlaganfall|hirnschlag|lahmung|\bictus\b|paralisi/,
    alerte: { label: 'Signes d’AVC : appeler le {secours} immédiatement', fiche: 'avc' },
  },
  {
    motif: /incendi|ascendi|au feu|flammes?|fumee|ca brule|immeuble brule|maison brule|\bfeuer\b|\bbrand\b|\brauch\b|brennt|fuoco|fiamme|\bfumo\b/,
    alerte: { label: 'Incendie : sortir, rester bas, fermer les portes', fiche: 'incendie-logement' },
  },
  { motif: /odeur de gaz|fuite de gaz|sent le gaz|gasgeruch|riecht nach gas|gasleck|odore di gas|fuga di gas/, alerte: { label: 'Odeur de gaz : ne rien allumer, sortir', fiche: 'fuite-gaz' } },
  {
    motif: /douleur (dans |a )?la poitrine|mal (a|au) (la poitrine|coeur)|infarctus|crise cardiaque|brustschmerz|herzinfarkt|dolore al petto|infarto/,
    alerte: { label: 'Douleur dans la poitrine : appeler le {secours}', fiche: 'infarctus' },
  },
  { motif: /allergi|gonfl|anaphyla|piqure.*(gorge|bouche)|anschwell|geschwollen|allergisch/, alerte: { label: 'Allergie grave ?', fiche: 'allergie-grave' } },
  { motif: /convuls|epilep|crise.*(tremble|secousse)|krampfanfall|krampft|epiless/, alerte: { label: 'Crise de convulsions', fiche: 'epilepsie' } },
  { motif: /electrocut|electrise|choc electrique|courant.*(touche|pris)|stromschlag|stromunfall|folgorat|scossa elettrica/, alerte: { label: 'Choc électrique : couper le courant d’abord', fiche: 'electrocution' } },
  { motif: /monoxyde|groupe electrogene|brasero|kohlenmonoxid|monossido/, alerte: { label: 'Monoxyde de carbone : aérer, sortir', fiche: 'monoxyde' } },
  {
    motif: /overdose|empoison|intoxi|champignon|avale (un |du )?produit|trop de (medicament|cachet)|vergift|pilz|intossic|avvelen|fungh/,
    alerte: { label: 'Intoxication : {antipoisonNom} ({antipoison})', fiche: 'intoxication' },
  },
  {
    motif: /panique|angoiss|j.?ai (tres |trop )?peur|terrifi|j.?arrive (plus|pas) a respirer|coeur (bat|tape) (trop )?(vite|fort)|\bpanik|angstattacke|ich habe angst|panico|attacco d.?ansia|ho paura/,
    alerte: { label: 'Besoin d’aide pour faire face ? Mode « Je panique »', route: '/panique' },
  },
  {
    motif: /suicid|me tuer|en finir|plus envie de vivre|umbringen|nicht mehr leben|suizid|selbstmord|togliermi la vita|farla finita/,
    alerte: { label: 'Tu n’es pas seul·e : {aidePsyNom}, {aidePsy}', tel: '{aidePsy}' },
  },
  {
    motif: /\btirs?\b|coups de feu|explosion|bombard|attentat|terroris|schusse|geschoss|schiesserei|anschlag|\bspari\b|esplosion|bombe/,
    alerte: { label: 'Tirs, explosion : se mettre à l’abri', fiche: 'conflit-tirs' },
  },
  { motif: /violen|agress|frappe|menace|gewalt|uberfall|bedroh|minacc/, alerte: { label: 'Danger : {police} ou 112. {smsSilencieux}', tel: '{police}' } },
];

export function detecter(q: string): Alerte[] {
  const texte = q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const vues = new Set<string>();
  return REGLES.filter(({ motif, alerte }) => {
    const cle = alerte.fiche ?? alerte.label;
    if (!motif.test(texte) || vues.has(cle)) return false;
    vues.add(cle);
    return true;
  }).map(({ alerte: a }) => ({ ...a, label: localiser(t(a.label)), tel: a.tel && localiser(a.tel).replace(/\s/g, '') }));
}
