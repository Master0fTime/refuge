import type { IconName } from '@/components/ui';

// Contenu v0.1 : rédigé à partir de sources publiques (ATP 3-50.21 Survival, Ready.gov / CDC,
// référentiels français de premiers secours). Les fiches médicales DOIVENT être relues
// par un professionnel de santé avant toute publication.

export type Categorie = { id: string; nom: string; icone: IconName; couleur: string };

export const CATEGORIES: Categorie[] = [
  { id: 'vital', nom: 'Urgences vitales', icone: 'heart', couleur: '#ef4444' },
  { id: 'soins', nom: 'Soins et blessures', icone: 'medkit', couleur: '#f87171' },
  { id: 'eau', nom: 'Eau', icone: 'water', couleur: '#38bdf8' },
  { id: 'feu', nom: 'Feu', icone: 'flame', couleur: '#f97316' },
  { id: 'abri', nom: 'Abri et chaleur', icone: 'home', couleur: '#a3e635' },
  { id: 'orientation', nom: 'Orientation', icone: 'compass', couleur: '#facc15' },
  { id: 'comms', nom: 'Communiquer sans Internet', icone: 'radio', couleur: '#c084fc' },
  { id: 'prepa', nom: 'Se préparer', icone: 'bag-handle', couleur: '#22c55e' },
];

export type Fiche = {
  id: string;
  titre: string;
  cat: string;
  resume: string;
  /** Embranchements « selon ce que tu as » : chaque choix ouvre une autre fiche. */
  choix?: { label: string; fiche: string }[];
  etapes?: string[];
  attention?: string[];
  ensuite?: string[];
  liees?: string[];
  source: string;
};

export const FICHES: Fiche[] = [
  // ───────────── URGENCES VITALES ─────────────
  {
    id: 'hemorragie',
    titre: 'Saignement abondant',
    cat: 'vital',
    resume: 'Le sang coule en flot ou imbibe un tissu en quelques secondes. Chaque minute compte.',
    etapes: [
      'Faire allonger la victime. Te protéger les mains si possible (gants, sac plastique).',
      'Appuyer FORT et directement sur la plaie avec la main ou un tissu plié. Ne pas relâcher.',
      'Faire appeler le 112 (ou le 15) par quelqu’un d’autre, ou utiliser le haut-parleur.',
      'Si tu dois libérer tes mains : remplacer la main par un pansement compressif (tissu épais serré par une bande, une ceinture, une manche).',
      'Membre seulement : si la compression ne suffit pas ou est impossible, poser un garrot 5 à 7 cm au-dessus de la plaie (jamais sur une articulation). Serrer jusqu’à l’arrêt du saignement.',
      'Garrot improvisé : bande de tissu large (au moins 4 cm), nouer, glisser un bâton dans le nœud, tourner jusqu’à l’arrêt du saignement, bloquer le bâton.',
      'Noter l’HEURE de pose du garrot (sur la peau, au stylo ou au feutre). Ne jamais le desserrer soi-même.',
      'Couvrir la victime, surveiller la conscience et la respiration.',
    ],
    attention: [
      'Ne jamais retirer un objet planté dans une plaie : comprimer autour.',
      'Fil, ficelle ou câble fin comme garrot : interdit (cela coupe les chairs).',
    ],
    liees: ['plaie', 'pls', 'rcp'],
    source: 'Référentiels de premiers secours (PSC1) ; ATP 3-50.21.',
  },
  {
    id: 'rcp',
    titre: 'Ne respire pas : massage cardiaque',
    cat: 'vital',
    resume: 'La personne ne répond pas et ne respire pas (ou respire anormalement, par « hoquets »).',
    etapes: [
      'Appeler le 112 / 15 immédiatement, haut-parleur activé. Demander un défibrillateur (DAE) si quelqu’un est là.',
      'Allonger la victime sur le dos, sur une surface dure.',
      'Mains l’une sur l’autre, au centre de la poitrine, bras tendus.',
      'Appuyer de 5 à 6 cm, 100 à 120 fois par minute (le rythme de « Stayin’ Alive »). Laisser la poitrine remonter entre chaque appui.',
      'Si tu sais le faire : 30 compressions puis 2 insufflations. Sinon, compressions seules sans t’arrêter.',
      'Dès que le DAE arrive : l’allumer et suivre la voix.',
      'Ne t’arrête pas avant l’arrivée des secours ou la reprise d’une respiration normale. Relaie-toi toutes les 2 minutes si possible.',
    ],
    attention: ['Enfant ou nourrisson : 5 insufflations d’abord, puis 30 compressions et 2 insufflations, avec une seule main (enfant) ou deux doigts (nourrisson), sur 1/3 de l’épaisseur du thorax.'],
    liees: ['pls', 'etouffement'],
    source: 'Recommandations ERC / PSC1.',
  },
  {
    id: 'etouffement',
    titre: 'S’étouffe (ne peut plus parler ni tousser)',
    cat: 'vital',
    resume: 'Obstruction totale : la personne porte les mains à la gorge, ne peut ni parler, ni tousser, ni respirer.',
    etapes: [
      'Si elle tousse fort : l’encourager à tousser, ne rien faire d’autre.',
      'Sinon : la pencher en avant, donner jusqu’à 5 claques vigoureuses dans le dos, entre les omoplates, avec le plat de la main.',
      'Si ça ne marche pas : 5 compressions abdominales. Se placer derrière elle, poing au creux de l’estomac (au-dessus du nombril), tirer fort vers soi et vers le haut.',
      'Alterner 5 claques et 5 compressions jusqu’au désengorgement.',
      'Si elle perd connaissance : appeler le 112 et commencer le massage cardiaque.',
    ],
    attention: [
      'Femme enceinte ou personne obèse : compressions au milieu de la poitrine (pas sur le ventre).',
      'Nourrisson : sur l’avant-bras, tête plus basse que le corps, 5 claques dans le dos puis 5 compressions thoraciques avec 2 doigts.',
    ],
    liees: ['rcp'],
    source: 'Recommandations ERC / PSC1.',
  },
  {
    id: 'pls',
    titre: 'Inconscient mais respire : PLS',
    cat: 'vital',
    resume: 'La personne ne répond pas mais respire normalement : la mettre sur le côté pour que sa langue ou ses vomissements ne l’étouffent pas.',
    etapes: [
      'Vérifier la respiration : regarder le ventre se soulever, écouter et sentir le souffle pendant 10 secondes.',
      'Retirer les lunettes. Mettre le bras le plus proche de toi à angle droit, paume vers le haut.',
      'Prendre l’autre main, la placer dos contre la joue opposée et la maintenir.',
      'Relever la jambe opposée (genou plié, pied au sol), puis tirer sur ce genou pour faire rouler la victime vers toi.',
      'Ouvrir la bouche vers le sol, tête légèrement basculée en arrière.',
      'Appeler le 112, couvrir la victime, vérifier la respiration régulièrement.',
    ],
    attention: ['Si la respiration s’arrête : remettre sur le dos et commencer le massage cardiaque.'],
    liees: ['rcp', 'hypothermie'],
    source: 'Référentiels PSC1.',
  },
  {
    id: 'brulure',
    titre: 'Brûlure',
    cat: 'vital',
    resume: 'Refroidir vite, longtemps, avec de l’eau tempérée.',
    etapes: [
      'Éteindre les flammes (rouler au sol, couverture). Éloigner de la source.',
      'Refroidir à l’eau tempérée (15 à 25 °C) pendant 20 minutes, dans les 20 premières minutes si possible.',
      'Retirer bagues, montres et vêtements non collés avant que ça gonfle.',
      'Couvrir avec un film alimentaire, un sac plastique propre ou un tissu propre et humide.',
      'Grave si : plus grande que la moitié de la paume de la victime, sur le visage, les mains, les articulations ou les parties génitales, peau blanche ou noire, ou brûlure électrique ou chimique → 112.',
    ],
    attention: [
      'Pas de glace, de beurre, de dentifrice ni de corps gras.',
      'Ne pas percer les cloques.',
      'Brûlure chimique : rincer à l’eau 20 minutes au moins, en retirant les vêtements contaminés.',
    ],
    liees: ['plaie', 'hypothermie'],
    source: 'Référentiels PSC1.',
  },
  {
    id: 'hypothermie',
    titre: 'Froid extrême (hypothermie)',
    cat: 'vital',
    resume: 'Frissons, puis confusion, maladresse, somnolence. Quand les frissons s’arrêtent, c’est grave.',
    etapes: [
      'Mettre à l’abri du vent et de l’humidité. ISOLER DU SOL (sac, branches, carton, mousse) : le sol vole plus de chaleur que l’air.',
      'Retirer les vêtements mouillés et remplacer par du sec. Couvrir la tête et la nuque.',
      'Envelopper : couverture de survie (face dorée côté corps), couvertures, duvet, ou peau contre peau avec une autre personne.',
      'Réchauffer le tronc d’abord (bouillottes ou bouteilles chaudes emballées : aisselles, poitrine, aine).',
      'Si conscient et capable d’avaler : boissons chaudes et sucrées.',
      'Manipuler doucement en cas de forte somnolence : un cœur très refroidi est fragile. Appeler le 112.',
    ],
    attention: ['Pas d’alcool.', 'Ne pas frictionner les membres.', 'Ne pas faire marcher une personne en hypothermie sévère.'],
    liees: ['abri-improvise', 'feu-choisir', 'pls'],
    source: 'ATP 3-50.21 ; recommandations de secours en montagne.',
  },
  {
    id: 'coup-chaleur',
    titre: 'Coup de chaleur',
    cat: 'vital',
    resume: 'Peau très chaude, confusion, maux de tête, nausées, parfois plus de transpiration. Urgence vitale.',
    etapes: [
      'Appeler le 112. Mettre à l’ombre, dans l’endroit le plus frais possible.',
      'Déshabiller au maximum.',
      'Refroidir tout de suite : arroser ou asperger d’eau et ventiler (éventail, vent). Linges mouillés et froids au cou, aux aisselles et à l’aine.',
      'Si conscient : faire boire de l’eau fraîche par petites gorgées.',
      'Si inconscient et respire : PLS et continuer à refroidir.',
    ],
    liees: ['pls', 'eau-trouver'],
    source: 'Santé publique France ; CDC.',
  },

  // ───────────── SOINS ─────────────
  {
    id: 'plaie',
    titre: 'Soigner une plaie',
    cat: 'soins',
    resume: 'Qu’as-tu sous la main ?',
    choix: [
      { label: 'J’ai une trousse de secours', fiche: 'plaie-trousse' },
      { label: 'Je n’ai rien (ou presque)', fiche: 'plaie-sans-rien' },
      { label: 'Ça saigne beaucoup', fiche: 'hemorragie' },
    ],
    attention: ['Morsure d’animal, plaie au visage, profonde, très sale ou par un objet rouillé : consulter dès que possible (risques de rage et de tétanos).'],
    source: 'Référentiels PSC1 ; OMS.',
  },
  {
    id: 'plaie-trousse',
    titre: 'Plaie : avec une trousse',
    cat: 'soins',
    resume: 'Nettoyer, désinfecter, protéger, surveiller.',
    etapes: [
      'Se laver les mains (ou mettre des gants).',
      'Rincer la plaie abondamment à l’eau potable ou au sérum physiologique pour chasser la saleté.',
      'Nettoyer du centre vers l’extérieur avec une compresse et de l’eau savonneuse, puis rincer.',
      'Désinfecter avec un antiseptique incolore (chlorhexidine, povidone iodée).',
      'Couvrir d’un pansement propre. Le changer chaque jour, ou s’il est mouillé ou sale.',
    ],
    ensuite: ['Surveiller les signes d’infection pendant plusieurs jours : voir la fiche « Plaie infectée ».'],
    liees: ['plaie-infectee'],
    source: 'Référentiels PSC1.',
  },
  {
    id: 'plaie-sans-rien',
    titre: 'Plaie : sans matériel',
    cat: 'soins',
    resume: 'L’eau propre est ton meilleur désinfectant. La quantité compte plus que tout.',
    etapes: [
      'Faire bouillir de l’eau puis la laisser tiédir (ou eau en bouteille). À défaut, eau la plus claire possible.',
      'Rincer longuement en versant de haut : au moins 1 litre pour une plaie moyenne. Percer le bouchon d’une bouteille pour faire un jet.',
      'Savon autour de la plaie (pas dedans si possible), puis rincer.',
      'Retirer les débris visibles avec une pince ou des doigts propres, rincer à nouveau.',
      'Couvrir avec le tissu le plus propre que tu as : tissu bouilli et séché, ou repassé au fer chaud, ou l’intérieur d’un vêtement propre.',
      'Changer le pansement chaque jour et le faire bouillir avant de le réutiliser.',
    ],
    attention: [
      'NE PAS fermer (scotch, colle) une plaie sale, une morsure ou une plaie de plus de 6 heures : l’infection serait enfermée dedans.',
      'Pas de terre, de cendre, d’urine ni de plantes inconnues sur la plaie.',
    ],
    ensuite: ['Surveiller chaque jour l’apparition de signes d’infection.'],
    liees: ['plaie-infectee', 'eau-purifier'],
    source: 'OMS (soins en situation isolée) ; ATP 3-50.21.',
  },
  {
    id: 'plaie-infectee',
    titre: 'Plaie infectée : les signes',
    cat: 'soins',
    resume: 'Une infection se repère souvent entre 1 et 3 jours après la blessure.',
    etapes: [
      'Signes locaux : rougeur qui s’étend, chaleur, gonflement, douleur qui augmente, pus, mauvaise odeur.',
      'Que faire : ouvrir le pansement, rincer abondamment chaque jour, laisser sortir le pus, garder couvert et propre.',
      'Tracer au stylo le bord de la rougeur pour voir si elle avance.',
    ],
    attention: [
      'URGENT : trainée rouge qui remonte le membre, fièvre, frissons, confusion, ou peau noire ou qui crépite. Il faut des antibiotiques et un médecin au plus vite.',
    ],
    liees: ['plaie-sans-rien'],
    source: 'OMS.',
  },

  // ───────────── EAU ─────────────
  {
    id: 'eau-trouver',
    titre: 'Trouver de l’eau',
    cat: 'eau',
    resume: 'Il faut 2 à 3 litres par jour et par personne pour boire, plus s’il fait chaud ou si tu fais un effort.',
    etapes: [
      'En ville : chauffe-eau (souvent 100 à 200 L, robinet de vidange en bas), réservoirs des WC (pas la cuvette), tuyaux de l’immeuble (ouvrir le robinet le plus bas), piscines (pour l’hygiène, ou à purifier).',
      'Pluie : bâches, toits, sacs plastique en entonnoir vers un récipient. C’est l’eau naturelle la plus sûre.',
      'Nature : descendre les pentes, suivre la végétation plus verte, les chemins d’animaux, le vol des oiseaux le matin et le soir.',
      'Rosée : passer un tissu sur l’herbe à l’aube et l’essorer.',
      'Transpiration des plantes : sac plastique fermé autour d’une branche feuillue au soleil, coin vers le bas.',
      'Creuser à l’extérieur d’un virage de rivière à sec : l’eau remonte parfois dans le trou.',
    ],
    attention: [
      'Ne jamais boire d’eau de mer ni d’urine : cela déshydrate davantage.',
      'Toute eau naturelle doit être purifiée.',
      'Garder l’eau dans le corps : rester à l’ombre, bouger aux heures fraîches, ne pas manger si tu n’as pas d’eau.',
    ],
    liees: ['eau-purifier'],
    source: 'ATP 3-50.21 ; Ready.gov.',
  },
  {
    id: 'eau-purifier',
    titre: 'Rendre l’eau buvable',
    cat: 'eau',
    resume: 'Qu’as-tu pour la traiter ?',
    etapes: [
      'D’abord : si l’eau est trouble, la laisser reposer puis la filtrer à travers un tissu plié (t-shirt, filtre à café).',
      'ÉBULLITION (le plus sûr) : faire bouillir à gros bouillons 1 minute, et 3 minutes au-dessus de 2 000 m d’altitude. Laisser refroidir couvert.',
      'EAU DE JAVEL NON PARFUMÉE : pour une Javel à 2,6 % (bouteille du commerce), 4 à 5 gouttes par litre. Pour une Javel à 6 %, 2 gouttes par litre. Doubler la dose si l’eau est trouble ou froide. Attendre 30 minutes : une légère odeur de chlore doit rester, sinon refaire une dose et attendre 15 minutes.',
      'PASTILLES : suivre la notice (souvent 30 minutes à 4 heures d’attente).',
      'SOLEIL (méthode SODIS) : bouteille en plastique transparent (PET) d’au maximum 2 L, eau claire, posée en plein soleil 6 heures (2 jours si le ciel est couvert).',
      'FILTRE de randonnée : suivre la notice. Il ne retire en général pas les virus.',
    ],
    attention: [
      'Eau polluée par des produits chimiques (carburant, industrie) : ni l’ébullition ni la Javel ne la rendent buvable.',
      'Filtre improvisé (sable, charbon) : il clarifie l’eau mais ne la désinfecte pas. Il faut ensuite la faire bouillir ou la traiter.',
    ],
    liees: ['eau-trouver', 'feu-choisir'],
    source: 'CDC ; Ready.gov ; OMS (SODIS).',
  },

  // ───────────── FEU ─────────────
  {
    id: 'feu-choisir',
    titre: 'Faire du feu',
    cat: 'feu',
    resume: 'Qu’as-tu sous la main ? Dans tous les cas, prépare d’abord ton bois (fiche « Préparer son feu »).',
    choix: [
      { label: 'Un briquet ou des allumettes', fiche: 'feu-briquet' },
      { label: 'Une pierre à feu (ferrocérium) ou un silex', fiche: 'feu-ferro' },
      { label: 'Du soleil + une loupe, des lunettes ou une bouteille', fiche: 'feu-loupe' },
      { label: 'Une pile + de la paille de fer ou un emballage alu', fiche: 'feu-pile' },
      { label: 'RIEN du tout', fiche: 'feu-friction' },
      { label: 'Tout est mouillé', fiche: 'feu-mouille' },
    ],
    liees: ['feu-preparer'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'feu-preparer',
    titre: 'Préparer son feu (étape commune)',
    cat: 'feu',
    resume: '90 % des échecs viennent d’une préparation bâclée. Il faut 3 tas de bois AVANT d’allumer.',
    etapes: [
      'Emplacement : abrité du vent, loin des branches basses et de l’herbe sèche. Gratter jusqu’à la terre nue, entourer de pierres sèches (jamais de pierres de rivière : elles peuvent éclater).',
      'Tas 1, l’AMADOU (prend une étincelle) : herbe très sèche, écorce de bouleau, duvet de massette (quenouille), coton, papier, mouchoir, coton imbibé de vaseline, champignon amadouvier.',
      'Tas 2, le PETIT BOIS : brindilles mortes de l’épaisseur d’une allumette à celle d’un crayon, qui cassent net (« crac »). Deux grosses poignées.',
      'Tas 3, le COMBUSTIBLE : bois du pouce au poignet, puis plus gros. Prendre le bois mort encore sur les arbres, plus sec que celui du sol.',
      'Monter en tipi : amadou au centre, petit bois autour en cône, en laissant une ouverture face au vent.',
      'Allumer l’amadou par en dessous, souffler doucement à la base, ajouter le bois progressivement du plus fin au plus gros.',
    ],
    attention: ['Ne jamais laisser un feu sans surveillance. Éteindre à l’eau et remuer jusqu’à ce que les cendres soient froides au toucher.'],
    liees: ['feu-choisir'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'feu-briquet',
    titre: 'Feu au briquet ou aux allumettes',
    cat: 'feu',
    resume: 'Le plus simple, à condition d’économiser : chaque allumette compte.',
    etapes: [
      'Tout préparer avant (amadou, petit bois, combustible).',
      'Se mettre dos au vent, accroupi, faire écran avec le corps et les mains.',
      'Allumette : la tenir tête vers le bas pour que la flamme remonte sur le bois.',
      'Approcher la flamme sous l’amadou, pas dessus.',
      'Briquet vide de gaz : la molette fait encore des étincelles sur un amadou très fin (coton, duvet).',
    ],
    attention: ['Allumettes : les garder au sec dans un sachet fermé ou une petite boîte étanche.'],
    liees: ['feu-preparer', 'feu-ferro'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'feu-ferro',
    titre: 'Feu à la pierre à feu ou au silex',
    cat: 'feu',
    resume: 'Fonctionne même mouillée, des milliers de fois.',
    etapes: [
      'Préparer un nid d’amadou très fin et très sec (duvet, coton, écorce de bouleau grattée en poudre).',
      'Ferrocérium : poser la pointe de la tige dans l’amadou, gratter fermement avec le dos d’un couteau ou le grattoir, en TIRANT la tige vers soi (pour ne pas disperser le nid).',
      'Silex et acier : frapper l’acier (dos de lame carbone) contre l’arête du silex. Les étincelles tombent sur du tissu carbonisé ou de l’amadouvier, qui garde une braise.',
      'Braise : la placer dans un nid d’herbe sèche, refermer le nid et souffler doucement jusqu’à la flamme.',
    ],
    liees: ['feu-preparer'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'feu-loupe',
    titre: 'Feu avec le soleil',
    cat: 'feu',
    resume: 'Ciel dégagé et soleil haut (entre 10 h et 15 h) nécessaires.',
    etapes: [
      'Lentille possible : loupe, lunettes de lecture (de presbyte, pas de myope), lentille d’appareil photo, sachet transparent ou bouteille remplie d’eau très claire.',
      'Fond de canette poli (au dentifrice ou au chocolat, longtemps) : fait un miroir concave.',
      'Concentrer le point de lumière le plus PETIT possible sur un amadou SOMBRE (bois carbonisé, champignon, tissu foncé).',
      'Ne pas bouger, parfois 30 secondes ou plus, jusqu’à la fumée puis la braise. Transférer dans le nid et souffler.',
    ],
    liees: ['feu-preparer'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'feu-pile',
    titre: 'Feu avec une pile',
    cat: 'feu',
    resume: 'Un court-circuit chauffe un métal fin jusqu’à l’incandescence.',
    etapes: [
      'Pile 9 V + paille de fer (laine d’acier fine) : frotter les 2 bornes sur la laine d’acier, qui s’embrase aussitôt. La poser dans l’amadou.',
      'Pile AA + emballage aluminium de chewing-gum : découper une bande en forme de nœud papillon (2 mm au centre). Côté métal : un bout sur le + et l’autre sur le −. Le centre s’enflamme.',
      'Batterie de voiture + 2 câbles : rapprocher les extrémités au-dessus de l’amadou pour faire une étincelle.',
    ],
    attention: ['Ça brûle les doigts : tenir avec un tissu. Ne jamais garder la paille de fer dans la même poche qu’une pile 9 V.'],
    liees: ['feu-preparer'],
    source: 'Techniques d’autonomie courantes.',
  },
  {
    id: 'feu-friction',
    titre: 'Feu sans rien : l’arc à feu',
    cat: 'feu',
    resume: 'La méthode sans matériel la plus fiable. Difficile : compte 30 minutes à 1 heure la première fois.',
    etapes: [
      'BOIS : sec, mort, tendre et non résineux (tilleul, saule, peuplier, lierre, clématite, sureau). La planche et la tige peuvent être du même bois.',
      'PLANCHE : 2 cm d’épaisseur. Creuser un petit trou près du bord, puis une encoche en « V » (1/8 du cercle) du trou jusqu’au bord.',
      'TIGE : droite, de la grosseur d’un pouce, environ 25 cm, pointe arrondie en bas et pointue en haut.',
      'APPUI (pour le haut de la tige) : une pierre creuse, un morceau de bois dur ou un coquillage. Graisser avec une feuille ou du sébum (le front, le nez).',
      'ARC : une branche souple de la longueur du bras, une corde (lacet, paracorde, ceinture fine) pas trop tendue.',
      'Écorce ou feuille sous l’encoche pour récupérer la braise. Pied gauche sur la planche, poignet calé contre le tibia.',
      'Enrouler la tige dans la corde, mouvements LONGS et RÉGULIERS, en appuyant de plus en plus fort. De la poudre noire remplit l’encoche, puis il y a beaucoup de fumée.',
      'Quand la fumée continue sans que tu scies : c’est une braise. Attendre 10 secondes, la transférer dans le nid d’herbe sèche et souffler doucement.',
    ],
    attention: [
      'Sans corde : technique du « foret à main » (rouler la tige entre les paumes), beaucoup plus difficile.',
      'Entraîne-toi MAINTENANT, tant que tu n’es pas en situation réelle.',
    ],
    liees: ['feu-preparer', 'feu-mouille'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'feu-mouille',
    titre: 'Feu quand tout est mouillé',
    cat: 'feu',
    resume: 'Il reste du sec : il faut savoir où chercher.',
    etapes: [
      'Bois mort encore sur pied, ou branches basses mortes sous les conifères (protégées par l’arbre).',
      'Fendre le bois : le cœur est sec. Faire des copeaux et des « bâtons à plumes » (fines lamelles qui restent attachées).',
      'Écorce de bouleau : elle brûle même humide (huiles naturelles).',
      'Résine (pin, épicéa) : très inflammable, en coulures sur les troncs blessés ou dans les souches (bois gras).',
      'Faire une plateforme de branches pour isoler le feu du sol mouillé.',
      'Mettre le bois humide autour du feu pour qu’il sèche avant de l’ajouter.',
    ],
    liees: ['feu-preparer', 'feu-choisir'],
    source: 'ATP 3-50.21.',
  },

  // ───────────── ABRI ─────────────
  {
    id: 'priorites',
    titre: 'Les priorités : la règle des 3',
    cat: 'abri',
    resume: 'Dans l’ordre, en règle générale : on meurt en 3 minutes sans air, en 3 heures sans abri dans le froid ou la chaleur extrêmes, en 3 jours sans eau, en 3 semaines sans nourriture.',
    etapes: [
      '1. SÉCURITÉ : s’éloigner du danger immédiat (feu, eau qui monte, bâtiment fragile, route).',
      '2. SOINS VITAUX : saignements, respiration.',
      '3. ABRI ET TEMPÉRATURE : se protéger du froid, du vent, de la pluie ou du soleil.',
      '4. EAU.',
      '5. SIGNALER ET COMMUNIQUER : se faire trouver, prévenir ses proches.',
      '6. NOURRITURE : la moins urgente.',
      'Garder le moral : S.T.O.P. → S’arrêter, Te calmer (respirer), Observer, Planifier.',
    ],
    liees: ['abri-improvise', 'eau-trouver', 'comms-signaux'],
    source: 'ATP 3-50.21.',
  },
  {
    id: 'abri-improvise',
    titre: 'Abri improvisé',
    cat: 'abri',
    resume: 'Petit, isolé du sol, coupé du vent. Plus il est petit, plus il est chaud.',
    etapes: [
      'Emplacement : à l’abri du vent, pas au fond d’un vallon (air froid, inondation), pas sous des branches mortes, loin des cours d’eau.',
      'ISOLER DU SOL d’abord : 15 à 30 cm de branchages, feuilles mortes, fougères, cartons. Le sol fait perdre plus de chaleur que l’air.',
      'Appentis : une perche horizontale (entre 2 arbres), branches en pente côté vent, couvertes de feuillage de bas en haut, comme des tuiles.',
      'Hutte de feuilles : une perche faîtière posée sur une souche ; des branches de chaque côté ; tout recouvrir d’au moins 60 cm de feuilles. Juste la taille de ton corps.',
      'Bâche ou couverture de survie : tendre en « A » sur une corde entre 2 arbres, bords lestés.',
      'En ville : se réfugier dans un bâtiment sûr, une voiture, un parking. Isoler du sol (cartons) et des murs.',
    ],
    liees: ['hypothermie', 'priorites'],
    source: 'ATP 3-50.21.',
  },

  // ───────────── ORIENTATION ─────────────
  {
    id: 'orientation-nature',
    titre: 'S’orienter sans boussole',
    cat: 'orientation',
    resume: 'Plusieurs indices valent mieux qu’un seul.',
    etapes: [
      'SOLEIL : il se lève à l’est, est au sud à midi (heure solaire) dans l’hémisphère Nord, et se couche à l’ouest.',
      'BÂTON ET OMBRE : planter un bâton, marquer le bout de l’ombre, attendre 15 minutes, marquer à nouveau. La ligne du 1er au 2e point va d’ouest en est.',
      'MONTRE À AIGUILLES (hémisphère Nord) : pointer la petite aiguille vers le soleil. Le sud est à mi-chemin entre la petite aiguille et le 12 (le 1 en heure d’hiver, le 2 en heure d’été en France). Méthode approximative.',
      'ÉTOILE POLAIRE (nord) : prolonger 5 fois l’écart entre les 2 étoiles du bord de la « casserole » de la Grande Ourse.',
      'ANTENNES PARABOLIQUES (Europe) : elles regardent globalement vers le sud.',
    ],
    attention: ['La mousse sur les arbres n’est PAS fiable pour trouver le nord.', 'Le GPS du téléphone fonctionne sans Internet : voir l’onglet Outils.'],
    liees: ['priorites'],
    source: 'ATP 3-50.21.',
  },

  // ───────────── COMMUNICATIONS ─────────────
  {
    id: 'comms-sans-internet',
    titre: 'Quels moyens marchent sans Internet ?',
    cat: 'comms',
    resume: 'Un téléphone ne peut PAS émettre comme un talkie-walkie : il n’a pas l’antenne pour ça. Mais plusieurs solutions existent, de la plus simple à la plus solide.',
    etapes: [
      'APPELS ET SMS : quand la 4G ou Internet sont saturés, les SMS passent souvent encore. Un SMS court passe mieux qu’un appel.',
      '112 : passe par N’IMPORTE quel réseau mobile disponible, même s’il n’est pas celui de ton opérateur. Certains téléphones récents envoient aussi des SOS par satellite.',
      'BLUETOOTH ET WI-FI ENTRE TÉLÉPHONES : appli Briar (libre, gratuite) : messagerie sans Internet, portée d’environ 10 à 100 m. Messages relayés si plusieurs téléphones.',
      'TALKIE-WALKIE PMR446 : sans licence en Europe, environ 20 à 40 € la paire, 1 à 3 km en pratique (plus en hauteur). Voir la fiche PMR446.',
      'MESHTASTIC (radio LoRa) : petit boîtier à 25-40 € relié au téléphone en Bluetooth. Envoie des messages texte et des positions GPS sur plusieurs km, et chaque boîtier sert de relais. La meilleure solution de groupe.',
      'CB (27 MHz) : sans licence. Canal 9 = urgence, canal 19 = routiers. Portée de quelques km à plusieurs dizaines de km.',
      'RADIO FM / ONDES COURTES (écoute) : une radio à piles ou à dynamo pour recevoir les consignes officielles. Indispensable.',
      'RADIOAMATEUR : très longue portée, mais il faut une licence pour émettre (en cas de détresse réelle, tout moyen est toléré).',
    ],
    ensuite: ['Mettre au point un PLAN DE COMMUNICATION avec ton groupe dès maintenant (onglet Groupe).'],
    liees: ['comms-pmr', 'comms-plan', 'comms-signaux'],
    source: 'ANFR (réglementation radio) ; projet Meshtastic ; Briar.',
  },
  {
    id: 'comms-pmr',
    titre: 'Talkie-walkie PMR446',
    cat: 'comms',
    resume: 'Le moyen le plus simple pour un groupe : pas de licence, pas d’abonnement, pas d’Internet.',
    etapes: [
      '16 canaux (446,00625 à 446,19375 MHz), puissance 0,5 W, utilisation libre en Europe.',
      'Il n’existe pas de canal d’urgence officiel : CONVENEZ-EN d’un à l’avance (par exemple « canal 8, sans sous-code ») et notez-le dans le plan du groupe.',
      'Portée : 300 m à 1 km en ville, 1 à 3 km en campagne, bien plus d’un sommet à un autre. Monter en hauteur aide beaucoup.',
      'Économiser les piles : allumer seulement aux heures de vacation convenues (par exemple 5 minutes à chaque heure pleine).',
      'Parler : appuyer, attendre 1 seconde, parler court, finir par « à toi ». Identifiez-vous avec des prénoms ou des surnoms.',
    ],
    liees: ['comms-plan'],
    source: 'ANFR.',
  },
  {
    id: 'comms-plan',
    titre: 'Plan de communication de groupe',
    cat: 'comms',
    resume: 'À décider ENSEMBLE maintenant, pendant que tout fonctionne. Remplissez-le dans l’onglet Groupe.',
    etapes: [
      'POINT DE RALLIEMENT principal (proche, facile d’accès) + un point de secours (plus loin, hors de la zone à risque).',
      'DÉLAI : « Si on n’a aucune nouvelle sous X heures, chacun rejoint le point 1. Si le point 1 est inaccessible ou que personne n’y est sous 24 h, on va au point 2. »',
      'CONTACT RELAIS hors région : une personne éloignée que tout le monde appelle ou à qui tout le monde envoie un SMS. Les appels longue distance passent parfois mieux.',
      'RADIO : canal et sous-code, heures de vacation.',
      'MESSAGE LAISSÉ SUR PLACE : convenir d’un endroit où laisser un mot (« Parti au point 2, 14 h, tout le monde OK »).',
      'Imprimer ou recopier le plan sur papier, dans chaque sac.',
    ],
    liees: ['comms-sans-internet', 'kit-72h'],
    source: 'Ready.gov (plan familial).',
  },
  {
    id: 'comms-signaux',
    titre: 'Signaux de détresse',
    cat: 'comms',
    resume: 'Se faire voir et entendre de loin, sans aucun appareil.',
    etapes: [
      'RÈGLE DES 3 : 3 feux en triangle, 3 coups de sifflet, 3 flashs = détresse (reconnu partout).',
      'MONTAGNE : 6 signaux par minute (sifflet, lampe), une minute de pause, puis on recommence. La réponse est 3 signaux par minute.',
      'SOS EN MORSE : ··· – – – ··· (3 courts, 3 longs, 3 courts). La lampe de l’onglet Outils le fait automatiquement.',
      'AU SOL, pour un avion (lettres de 3 m au moins, contrastées) : V = besoin d’aide ; X = besoin d’aide médicale ; Y = oui ; N = non ; flèche = « je pars dans cette direction ».',
      'MIROIR (ou écran de téléphone, CD) : viser l’avion entre 2 doigts en V et faire passer le reflet du soleil. Visible à des dizaines de km.',
      'FUMÉE : le jour, ajouter du feuillage vert sur un feu (fumée blanche).',
      'Hélicoptère : bras en « Y » = oui, j’ai besoin d’aide ; un bras levé et l’autre baissé = non.',
    ],
    liees: ['comms-sans-internet'],
    source: 'OACI (signaux sol-air) ; secours en montagne.',
  },

  // ───────────── PRÉPARATION ─────────────
  {
    id: 'kit-72h',
    titre: 'Le kit des 72 heures',
    cat: 'prepa',
    resume: 'Les autorités recommandent de pouvoir tenir 3 jours en autonomie. Un sac par personne, prêt à partir.',
    etapes: [
      'Eau : 2 L par personne et par jour pour boire (prévoir au moins 6 L par personne), plus des pastilles de purification.',
      'Nourriture qui se conserve et ne demande pas de cuisson : conserves (et un ouvre-boîte), barres, fruits secs.',
      'Radio à piles ou à dynamo, lampe frontale, piles de rechange, batterie externe chargée.',
      'Trousse de secours, médicaments personnels (7 jours), copies des ordonnances.',
      'Couteau multifonction, briquet, allumettes, pierre à feu, couverture de survie, sifflet.',
      'Vêtements chauds, poncho, chaussures solides.',
      'Copies des papiers (pochette étanche + clé USB), un peu d’argent liquide en petites coupures, double des clés.',
      'Une carte papier de la région et le PLAN DU GROUPE imprimé.',
      'Masques, gel hydroalcoolique, sacs-poubelle, papier toilette, ruban adhésif.',
      'Pour les enfants : doudou, jeux. Pour les animaux : nourriture et laisse.',
    ],
    liees: ['comms-plan'],
    source: 'Gouvernement français (« kit d’urgence ») ; Ready.gov.',
  },
];

export const fiche = (id: string) => FICHES.find((f) => f.id === id);

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Recherche simple hors ligne. Elle sera remplacée par SQLite FTS5 + recherche par le sens en v0.2. */
export function rechercher(q: string): Fiche[] {
  const mots = norm(q).split(/\s+/).filter((m) => m.length > 1);
  if (!mots.length) return [];
  return FICHES.map((f) => {
    const titre = norm(f.titre);
    const corps = norm([f.resume, ...(f.etapes ?? []), ...(f.attention ?? [])].join(' '));
    const score = mots.reduce((s, m) => s + (titre.includes(m) ? 5 : 0) + (corps.includes(m) ? 1 : 0), 0);
    return { f, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f);
}
