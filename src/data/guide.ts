import type { IconName } from '@/components/ui';

// Assistant guidé : « Quel est le problème ? » → (tri vital) → « Où es-tu ? » → réflexes.
// Fonctionne sans IA. L'IA locale de la v0.2 s'appuiera sur ces mêmes arbres.

export type LieuId = 'ville' | 'maison' | 'nature' | 'montagne' | 'eau' | 'vehicule';

export const LIEUX: { id: LieuId; label: string; icone: IconName }[] = [
  { id: 'maison', label: 'Chez moi / dans un bâtiment', icone: 'home' },
  { id: 'ville', label: 'Dehors, en ville', icone: 'business' },
  { id: 'nature', label: 'Forêt / campagne', icone: 'leaf' },
  { id: 'montagne', label: 'Montagne', icone: 'triangle' },
  { id: 'eau', label: 'Près de l’eau (mer, lac, rivière)', icone: 'boat' },
  { id: 'vehicule', label: 'En voiture / sur la route', icone: 'car' },
];

type Conseils = { immediat?: string[]; ensuite?: string[]; fiches?: string[] };

export type Probleme = {
  id: string;
  label: string;
  icone: IconName;
  couleur: string;
  /** Question de tri avant le lieu : une réponse peut renvoyer directement à une fiche vitale. */
  tri?: { question: string; options: { label: string; fiche?: string }[] };
  commun: Conseils;
  lieux?: Partial<Record<LieuId, Conseils>>;
};

export const PROBLEMES: Probleme[] = [
  {
    id: 'blesse',
    label: 'Quelqu’un est blessé ou fait un malaise',
    icone: 'medkit',
    couleur: '#ef4444',
    tri: {
      question: 'Que vois-tu ?',
      options: [
        { label: 'Il saigne beaucoup', fiche: 'hemorragie' },
        { label: 'Ne répond pas et ne respire pas', fiche: 'rcp' },
        { label: 'Ne répond pas mais respire', fiche: 'pls' },
        { label: 'S’étouffe, ne peut plus parler', fiche: 'etouffement' },
        { label: 'Brûlure', fiche: 'brulure' },
        { label: 'Autre blessure (coupure, chute…)' },
      ],
    },
    commun: {
      immediat: [
        'Te protéger d’abord : s’il y a un danger (circulation, feu, chute de pierres), écarte-le ou éloigne la victime seulement si c’est indispensable.',
        'Appeler le 112 (ou le 15). Si ça ne passe pas : SMS au 114, ou réessayer depuis un point plus haut.',
        'Parler à la victime, la rassurer, ne pas lui donner à boire si elle risque d’être opérée.',
        'Ne pas bouger une personne tombée de haut qui a mal au dos ou au cou, sauf danger immédiat.',
      ],
      ensuite: [
        'Couvrir la victime (même en été, le choc fait perdre de la chaleur).',
        'Surveiller toutes les 5 minutes : est-ce qu’elle répond ? est-ce qu’elle respire ?',
        'Noter l’heure de l’accident et ce qui s’est passé, pour les secours.',
      ],
      fiches: ['plaie', 'hemorragie', 'pls'],
    },
    lieux: {
      montagne: {
        immediat: ['Isoler la victime du sol et la protéger du vent : le froid aggrave tout.'],
        ensuite: ['Secours en montagne : 112. Sans réseau, signal de détresse : 6 coups de sifflet par minute.'],
        fiches: ['hypothermie', 'comms-signaux'],
      },
      eau: {
        immediat: ['Noyade : sortir de l’eau sans te mettre en danger (tendre une branche ou lancer un objet qui flotte). Si elle ne respire pas : 5 insufflations, puis massage cardiaque.'],
        fiches: ['rcp', 'hypothermie'],
      },
      vehicule: {
        immediat: [
          'Allumer les feux de détresse, mettre le gilet, placer le triangle (si sans danger), couper le contact.',
          'Ne pas retirer le casque d’un motard (sauf s’il ne respire pas et qu’il faut le ranimer).',
        ],
      },
      nature: { ensuite: ['Si tu dois laisser la victime pour chercher du réseau ou de l’aide : enregistre la position GPS (onglet Outils) pour pouvoir revenir.'] },
    },
  },
  {
    id: 'perdu',
    label: 'Je suis perdu',
    icone: 'compass',
    couleur: '#facc15',
    commun: {
      immediat: [
        'S.T.O.P. : Stop, Te calmer, Observer, Planifier. Ne marche pas au hasard.',
        'Ton GPS fonctionne SANS Internet : ouvre l’onglet Outils pour voir ta position et la noter.',
        'Économiser la batterie : mode avion (le GPS reste actif), luminosité au minimum.',
      ],
      ensuite: [
        'Si quelqu’un sait où tu es : reste sur place, c’est plus facile de te retrouver.',
        'Sinon, avant de bouger : laisse un signe (flèche de pierres ou de branches, mot) indiquant la direction prise.',
        'Avant la nuit (1 h 30 avant) : arrête-toi et prépare un abri.',
      ],
      fiches: ['orientation-nature', 'priorites', 'comms-signaux'],
    },
    lieux: {
      nature: {
        ensuite: [
          'Monter sur un point haut pour voir et capter du réseau.',
          'Suivre un cours d’eau vers l’aval mène souvent à des habitations (mais pas dans des gorges ni des falaises).',
          'Chercher un chemin, une ligne électrique, une clôture : ils mènent à des humains.',
        ],
        fiches: ['abri-improvise'],
      },
      montagne: {
        immediat: ['En brouillard ou en terrain raide : NE PAS descendre au hasard (falaises). Reste sur place et signale-toi.'],
        ensuite: ['Ne jamais descendre dans un ravin ou un couloir inconnu.'],
        fiches: ['hypothermie', 'abri-improvise'],
      },
      ville: { ensuite: ['Repère un grand axe, une gare ou un bâtiment public (mairie, hôpital, école) : ce sont souvent des points de regroupement.'] },
    },
  },
  {
    id: 'separe',
    label: 'Je suis séparé de mes proches',
    icone: 'people',
    couleur: '#c084fc',
    commun: {
      immediat: [
        'Ouvre l’onglet Groupe : ton plan, tes points de ralliement et ton canal radio y sont.',
        'Envoie un SMS court (passe mieux qu’un appel) : « [Prénom] OK, à [lieu], vais au point 1. »',
        'Préviens votre contact relais hors région.',
      ],
      ensuite: [
        'Applique le plan : rejoins le point 1 (ou le point 2 au bout du délai convenu).',
        'En partant d’un lieu, laisse un message visible : nom, heure, destination.',
        'Radio : allume aux heures de vacation convenues seulement.',
      ],
      fiches: ['comms-plan', 'comms-sans-internet'],
    },
  },
  {
    id: 'froid',
    label: 'J’ai froid / il fait très froid',
    icone: 'snow',
    couleur: '#38bdf8',
    commun: {
      immediat: [
        'Se mettre à l’abri du VENT et de l’HUMIDITÉ.',
        'S’isoler du sol (sac, carton, branches) : c’est la priorité numéro 1.',
        'Enlever les vêtements mouillés. Couvrir la tête, le cou et les mains.',
      ],
      ensuite: ['Manger et boire chaud si possible : le corps a besoin d’énergie pour se réchauffer.', 'Se serrer les uns contre les autres.'],
      fiches: ['hypothermie', 'abri-improvise', 'feu-choisir'],
    },
    lieux: {
      maison: {
        immediat: ['Coupure de chauffage : rassemble tout le monde dans UNE seule petite pièce, calfeutre (couvertures aux fenêtres, serviettes sous les portes).'],
        ensuite: [
          'JAMAIS de barbecue, de groupe électrogène ni de chauffage d’appoint au gaz à l’intérieur : le monoxyde de carbone tue sans odeur.',
          'Dormir habillé, bonnet sur la tête, à plusieurs sous les couvertures.',
        ],
      },
      vehicule: {
        immediat: [
          'Bloqué dans la neige : reste DANS le véhicule.',
          'Dégage le pot d’échappement de la neige avant de démarrer le moteur, puis fais-le tourner 10 minutes par heure en entrouvrant une vitre (risque de monoxyde de carbone).',
        ],
      },
    },
  },
  {
    id: 'chaleur',
    label: 'Il fait très chaud',
    icone: 'sunny',
    couleur: '#f97316',
    commun: {
      immediat: ['Ombre, repos, boire régulièrement sans attendre la soif.', 'Mouiller la peau et les vêtements, ventiler.'],
      ensuite: ['Bouger seulement tôt le matin ou le soir.', 'Surveiller les plus fragiles : bébés, personnes âgées, malades.'],
      fiches: ['coup-chaleur', 'eau-trouver'],
    },
    lieux: {
      maison: { immediat: ['Fermer fenêtres et volets le jour, ouvrir la nuit pour faire des courants d’air. Rester dans la pièce la plus fraîche.'] },
      vehicule: { immediat: ['Ne JAMAIS laisser un enfant ou un animal dans une voiture, même 5 minutes.'] },
    },
  },
  {
    id: 'eau',
    label: 'Je n’ai plus d’eau potable',
    icone: 'water',
    couleur: '#38bdf8',
    commun: {
      immediat: ['Limiter les pertes : ombre, peu d’effort, ne pas manger salé.', 'Ne pas boire d’eau de mer ni d’urine.'],
      fiches: ['eau-trouver', 'eau-purifier'],
    },
    lieux: {
      maison: {
        immediat: [
          'Coupure annoncée : remplis TOUT de suite baignoire, casseroles et bouteilles.',
          'Réserves cachées : chauffe-eau (robinet en bas), réservoir des WC, glaçons, conserves de légumes (le jus).',
        ],
      },
      nature: { immediat: ['Cherche en descendant : fonds de vallée, végétation verte, insectes, oiseaux.'] },
    },
  },
  {
    id: 'faim',
    label: 'On n’a plus rien à manger',
    icone: 'restaurant',
    couleur: '#eab308',
    commun: {
      immediat: [
        'Pas de panique : on tient des semaines sans manger, mais seulement 3 jours sans eau. Vérifie d’abord que l’eau est assurée.',
        'Économise ton énergie : peu d’effort, rester au chaud.',
        'S’il y a des enfants, des malades ou des personnes âgées, ils mangent en premier.',
      ],
      ensuite: ['Ne mange jamais une plante ou un champignon que tu n’identifies pas à 100 %.'],
      fiches: ['faim-priorites', 'rationner'],
    },
    lieux: {
      ville: {
        immediat: [
          'Cherche l’aide organisée : mairie, Croix-Rouge, Restos du Cœur, Secours populaire, lieux de culte. Écoute la radio locale pour les points de distribution.',
          'Demande aux voisins et aux commerçants du quartier, en proposant un échange ou ton aide.',
        ],
        ensuite: ['Évite les attroupements devant les magasins en période de troubles.'],
        fiches: ['nourriture-ville', 'conflit-securite'],
      },
      maison: {
        immediat: ['Fais l’inventaire complet des placards : on oublie souvent des conserves, du riz, des pâtes, du sucre.', 'Mange d’abord ce qui se périme (frigo, puis congélateur).'],
        fiches: ['rationner', 'nourriture-ville'],
      },
      nature: { ensuite: ['Plantes faciles et sûres : ortie (cuite), pissenlit, plantain, mûres, à condition de les reconnaître avec certitude.'], fiches: ['plantes-comestibles'] },
      montagne: { fiches: ['plantes-comestibles', 'hypothermie'] },
    },
  },
  {
    id: 'nuit',
    label: 'Je dois passer la nuit dehors',
    icone: 'moon',
    couleur: '#818cf8',
    commun: {
      immediat: ['Commence l’abri au moins 1 h 30 avant la nuit.', 'Isoler du sol en premier, puis se protéger du vent.'],
      ensuite: ['Prépare le bois pour toute la nuit avant qu’il fasse noir (3 fois plus que tu ne penses).', 'Garde ta lampe et ton sifflet à portée de main.'],
      fiches: ['abri-improvise', 'feu-choisir', 'hypothermie'],
    },
    lieux: {
      ville: { immediat: ['Cherche un lieu abrité et éclairé : gare, hall, parking couvert, lieu de culte, centre d’accueil.'] },
    },
  },
  {
    id: 'catastrophe',
    label: 'Catastrophe (séisme, inondation, incendie…)',
    icone: 'warning',
    couleur: '#ef4444',
    tri: {
      question: 'Quel type ?',
      options: [
        { label: 'Séisme' },
        { label: 'Inondation / eau qui monte' },
        { label: 'Incendie / feu de forêt' },
        { label: 'Alerte nucléaire ou chimique' },
        { label: 'Tirs ou explosions près de moi', fiche: 'conflit-tirs' },
        { label: 'Émeutes, troubles, guerre civile' },
        { label: 'Autre' },
      ],
    },
    commun: {
      immediat: [
        'Écouter la radio (France Inter, France Bleu/Ici) et suivre les consignes officielles (FR-Alert sur le téléphone).',
        'Ne pas aller chercher les enfants à l’école : les écoles ont un plan de mise en sûreté.',
        'Ne pas téléphoner, sauf urgence vitale : SMS uniquement, pour ne pas saturer le réseau.',
      ],
      ensuite: ['Prévenir ton groupe : SMS au contact relais, puis appliquer le plan.'],
      fiches: ['priorites', 'evacuer', 'conflit-securite', 'comms-plan', 'kit-72h'],
    },
    lieux: {
      maison: {
        immediat: [
          'Séisme : sous une table solide, protéger la tête, attendre la fin des secousses. Ensuite, sortir par l’escalier (pas l’ascenseur) et couper le gaz.',
          'Inondation : monter dans les étages, couper électricité et gaz. Ne pas descendre au sous-sol ni au parking.',
          'Nucléaire ou chimique : RENTRER et rester à l’intérieur, fermer et calfeutrer, couper la ventilation.',
        ],
      },
      vehicule: {
        immediat: [
          'Inondation : ne JAMAIS s’engager sur une route inondée. 30 cm d’eau suffisent à emporter une voiture.',
          'Séisme : s’arrêter loin des ponts, des bâtiments et des lignes électriques, rester dans le véhicule.',
        ],
      },
      nature: { immediat: ['Feu de forêt : s’éloigner perpendiculairement au vent, vers une zone déjà brûlée ou dégagée (route large, champ labouré, plan d’eau).'] },
      ville: { immediat: ['Séisme : s’éloigner des façades, des vitres et des câbles, aller dans un espace dégagé.'] },
      eau: { immediat: ['Rejoindre immédiatement un point haut. Ne jamais traverser une eau en mouvement à pied.'] },
    },
  },
  {
    id: 'danger',
    label: 'Je me sens menacé',
    icone: 'shield',
    couleur: '#f43f5e',
    commun: {
      immediat: [
        'S’éloigner, se diriger vers un lieu fréquenté et éclairé.',
        'Appeler le 17 ou le 112. Si tu ne peux pas parler : SMS au 114.',
        'Ne rien risquer pour des objets : donne ce qu’on te demande.',
      ],
      ensuite: ['Prévenir un proche de ta position (onglet Groupe → partager ma position).'],
      fiches: ['conflit-securite', 'conflit-tirs', 'moral-stress', 'comms-sans-internet'],
    },
  },
];

export function conseilsPour(p: Probleme, lieu: LieuId) {
  const l = p.lieux?.[lieu] ?? {};
  return {
    // Les conseils spécifiques au lieu passent en premier : ce sont les plus pertinents.
    immediat: [...(l.immediat ?? []), ...(p.commun.immediat ?? [])],
    ensuite: [...(l.ensuite ?? []), ...(p.commun.ensuite ?? [])],
    fiches: Array.from(new Set([...(l.fiches ?? []), ...(p.commun.fiches ?? [])])),
  };
}
