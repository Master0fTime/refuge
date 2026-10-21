import type { ReactElement } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as T } from 'react-native-svg';
import { c } from '@/lib/theme';

// Schémas simples des gestes qui sauvent : traits épais, peu de détails, lisibles en un coup d'œil.

const PEAU = '#e8c9a8';
const TRAIT = '#f2f4f5';
const ACCENT = '#f59e0b';
const ROUGE = '#ef4444';

function Cadre({ children, hauteur = 210 }: { children: ReactElement | ReactElement[]; hauteur?: number }) {
  return (
    <View style={{ backgroundColor: c.cardAlt, borderRadius: 12, padding: 8 }}>
      <Svg width="100%" height={hauteur} viewBox={`0 0 340 ${hauteur}`}>
        {children}
      </Svg>
    </View>
  );
}

const Etiquette = ({ x, y, t, couleur = TRAIT, taille = 13, ancre = 'middle' as 'middle' | 'start' | 'end' }: { x: number; y: number; t: string; couleur?: string; taille?: number; ancre?: 'middle' | 'start' | 'end' }) => (
  <T x={x} y={y} fill={couleur} fontSize={taille} fontWeight="700" textAnchor={ancre}>
    {t}
  </T>
);

/** Massage cardiaque : talon des mains au centre de la poitrine, bras tendus. */
function Rcp() {
  return (
    <Cadre hauteur={215}>
      {/* Vue de face : buste allongé */}
      <Circle cx={90} cy={45} r={24} fill={PEAU} />
      <Rect x={50} y={72} width={80} height={110} rx={26} fill="#3b4b5c" />
      <Line x1={90} y1={82} x2={90} y2={150} stroke="#5b6b7c" strokeWidth={3} />
      {/* Mains croisées au centre de la poitrine */}
      <Ellipse cx={90} cy={122} rx={20} ry={13} fill={PEAU} stroke={ACCENT} strokeWidth={3} />
      <Ellipse cx={90} cy={117} rx={16} ry={10} fill={PEAU} stroke={ACCENT} strokeWidth={2} />
      <Etiquette x={90} y={205} t="Centre de la poitrine" couleur={ACCENT} taille={12} />
      {/* Vue de côté : la victime allongée, le sauveteur à genoux, bras tendus sur la poitrine */}
      <Circle cx={318} cy={150} r={12} fill={PEAU} />
      <Line x1={200} y1={158} x2={302} y2={158} stroke="#3b4b5c" strokeWidth={18} strokeLinecap="round" />
      <Circle cx={250} cy={34} r={15} fill={PEAU} />
      <Line x1={248} y1={50} x2={232} y2={104} stroke={TRAIT} strokeWidth={10} strokeLinecap="round" />
      <Path d="M232 104 L214 140 L196 140" stroke={TRAIT} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={252} y1={58} x2={262} y2={146} stroke={PEAU} strokeWidth={7} strokeLinecap="round" />
      <Polygon points="282,98 290,98 290,120 300,120 286,138 272,120 282,120" fill={ACCENT} />
      <Etiquette x={300} y={92} t="5–6 cm" taille={12} />
      <Etiquette x={262} y={190} t="Bras tendus" taille={12} />
      <Etiquette x={262} y={205} t="100 à 120 par minute" taille={12} couleur={ACCENT} />
    </Cadre>
  );
}

/** Position latérale de sécurité. */
function Pls() {
  return (
    <Cadre hauteur={190}>
      <Line x1={10} y1={150} x2={330} y2={150} stroke="#3b4b5c" strokeWidth={3} />
      {/* Tête, bouche vers le sol */}
      <Circle cx={55} cy={118} r={20} fill={PEAU} />
      <Path d="M48 134 q6 6 14 2" stroke={ROUGE} strokeWidth={3} fill="none" />
      {/* Corps sur le côté */}
      <Path d="M75 110 L190 105" stroke={TRAIT} strokeWidth={22} strokeLinecap="round" />
      {/* Main du dessus sous la joue */}
      <Path d="M150 100 Q110 70 70 100" stroke={PEAU} strokeWidth={8} fill="none" strokeLinecap="round" />
      {/* Bras du dessous à angle droit */}
      <Path d="M95 118 L95 145" stroke={PEAU} strokeWidth={7} strokeLinecap="round" />
      {/* Jambe du dessous tendue, jambe du dessus pliée vers l'avant */}
      <Path d="M190 110 L300 125" stroke={TRAIT} strokeWidth={13} strokeLinecap="round" />
      <Path d="M190 102 L245 140 L300 112" stroke={TRAIT} strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Etiquette x={60} y={176} t="Bouche vers le sol" couleur={ACCENT} taille={12} />
      <Etiquette x={250} y={176} t="Genou plié : stable" couleur={ACCENT} taille={12} />
      <Etiquette x={115} y={62} t="Main sous la joue" />
    </Cadre>
  );
}

/** Étouffement : 5 claques dans le dos, puis 5 compressions abdominales. */
function Etouffement() {
  const Personne = ({ x, penchee }: { x: number; penchee: boolean }) => (
    <G>
      <Circle cx={x + (penchee ? 30 : 0)} cy={penchee ? 70 : 45} r={16} fill={PEAU} />
      <Path d={penchee ? `M${x} 150 L${x + 8} 95 L${x + 22} 80` : `M${x} 150 L${x} 62`} stroke={TRAIT} strokeWidth={18} strokeLinecap="round" fill="none" />
    </G>
  );
  return (
    <Cadre>
      {/* Gauche : penchée en avant, claques entre les omoplates */}
      <Personne x={70} penchee />
      <Path d="M30 70 Q48 70 62 88" stroke={PEAU} strokeWidth={8} fill="none" strokeLinecap="round" />
      <Polygon points="58,80 72,92 56,96" fill={ACCENT} />
      <Etiquette x={80} y={185} t="1. Penchée en avant" taille={12} />
      <Etiquette x={80} y={202} t="5 claques dans le dos" couleur={ACCENT} taille={12} />
      {/* Droite : derrière elle, poing au-dessus du nombril, vers soi et vers le haut */}
      <Personne x={250} penchee={false} />
      <Circle cx={250} cy={108} r={9} fill={PEAU} stroke={ACCENT} strokeWidth={3} />
      <Path d="M262 112 Q285 104 290 88" stroke={ACCENT} strokeWidth={4} fill="none" />
      <Polygon points="284,86 296,86 290,76" fill={ACCENT} />
      <Etiquette x={250} y={185} t="2. Poing sur le ventre" taille={12} />
      <Etiquette x={250} y={202} t="5 tractions vers le haut" couleur={ACCENT} taille={12} />
    </Cadre>
  );
}

/** Garrot : bande large au-dessus de la plaie, bâton pour serrer, heure notée. */
function Garrot() {
  return (
    <Cadre hauteur={190}>
      {/* Bras */}
      <Path d="M20 95 L320 95" stroke={PEAU} strokeWidth={46} strokeLinecap="round" />
      {/* Plaie */}
      <Ellipse cx={255} cy={95} rx={14} ry={8} fill={ROUGE} />
      {/* Bande et bâton */}
      <Rect x={160} y={68} width={26} height={54} rx={4} fill="#3b4b5c" />
      <Line x1={150} y1={58} x2={196} y2={132} stroke="#8b5a2b" strokeWidth={8} strokeLinecap="round" />
      {/* Distance */}
      <Line x1={186} y1={140} x2={248} y2={140} stroke={ACCENT} strokeWidth={2} />
      <Etiquette x={217} y={158} t="5 à 7 cm" couleur={ACCENT} />
      <Etiquette x={173} y={45} t="Bande large (4 cm et plus)" />
      <Etiquette x={255} y={70} t="Plaie" couleur={ROUGE} />
      {/* Heure */}
      <Circle cx={60} cy={160} r={14} fill="none" stroke={TRAIT} strokeWidth={3} />
      <Line x1={60} y1={160} x2={60} y2={151} stroke={TRAIT} strokeWidth={3} />
      <Line x1={60} y1={160} x2={67} y2={163} stroke={TRAIT} strokeWidth={3} />
      <Etiquette x={82} y={165} t="Note l’heure" couleur={ACCENT} ancre="start" />
      <Etiquette x={60} y={45} t="← vers le cœur" taille={12} />
    </Cadre>
  );
}

/** Schéma associé à chaque fiche (si elle en a un). */
export const ILLUSTRATIONS: Record<string, () => ReactElement> = {
  rcp: Rcp,
  pls: Pls,
  etouffement: Etouffement,
  hemorragie: Garrot,
};
