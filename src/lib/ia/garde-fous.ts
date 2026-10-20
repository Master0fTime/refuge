// Détection des urgences vitales dans une question : on affiche les fiches fixes et les numéros
// AVANT et INDÉPENDAMMENT de l'IA, qui peut se tromper ou être lente.

export type Alerte = { label: string; fiche?: string; tel?: string };

const REGLES: { motif: RegExp; alerte: Alerte }[] = [
  { motif: /saign|hemorrag|pisse le sang|perd (beaucoup de|du) sang|coupure profonde|artere/, alerte: { label: 'Saignement abondant', fiche: 'hemorragie' } },
  { motif: /respire (plus|pas)|ne respire|arret cardi|crise cardiaque|coeur (s.?est )?arrete|massage cardiaque/, alerte: { label: 'Ne respire pas', fiche: 'rcp' } },
  { motif: /etouff|avale de travers|coince dans la gorge|peut plus (respirer|parler)/, alerte: { label: 'Étouffement', fiche: 'etouffement' } },
  { motif: /inconscient|evanoui|repond (plus|pas)|perdu connaissance|malaise/, alerte: { label: 'Inconscient', fiche: 'pls' } },
  { motif: /brul/, alerte: { label: 'Brûlure', fiche: 'brulure' } },
  { motif: /hypotherm|gele|grelott|congel/, alerte: { label: 'Froid extrême', fiche: 'hypothermie' } },
  { motif: /coup de chaleur|insolation/, alerte: { label: 'Coup de chaleur', fiche: 'coup-chaleur' } },
  { motif: /noy/, alerte: { label: 'Noyade : ne respire pas ?', fiche: 'rcp' } },
  { motif: /avc|paralys|bouche de travers|parle mal d.?un coup/, alerte: { label: 'Signes d’AVC : appeler le 15 / 112 immédiatement', tel: '112' } },
  { motif: /overdose|empoison|intoxi|champignon|monoxyde/, alerte: { label: 'Intoxication : centre antipoison ou 15', tel: '15' } },
  { motif: /suicid|me tuer|en finir|plus envie de vivre/, alerte: { label: 'Tu n’es pas seul·e : 3114 (24 h/24, gratuit)', tel: '3114' } },
  { motif: /violen|agress|frappe|menace/, alerte: { label: 'Danger : 17 ou 112 (SMS au 114 si tu ne peux pas parler)', tel: '17' } },
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
  }).map((r) => r.alerte);
}
