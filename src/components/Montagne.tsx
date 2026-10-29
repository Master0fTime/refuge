import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { c } from '@/lib/theme';

/** Illustration de l'accueil : un refuge au pied des montagnes, en traits simples. */
export function Montagne({ largeur = 260 }: { largeur?: number }) {
  return (
    <Svg width={largeur} height={largeur * 0.55} viewBox="0 0 260 143">
      <Circle cx="204" cy="34" r="14" fill={c.accent} opacity={0.9} />
      <Path d="M0 143 L70 48 L105 92 L140 40 L215 143 Z" fill={c.cardAlt} />
      <Path d="M70 48 L84 67 L76 64 L66 70 L58 64 Z" fill={c.text} opacity={0.85} />
      <Path d="M140 40 L158 64 L148 60 L138 67 L128 58 Z" fill={c.text} opacity={0.85} />
      <Path d="M90 143 L170 76 L260 143 Z" fill={c.card} />
      <Rect x="108" y="112" width="44" height="31" fill={c.accent} />
      <Path d="M100 114 L130 92 L160 114 Z" fill={c.danger} />
      <Rect x="125" y="124" width="10" height="19" fill={c.surJaune} />
    </Svg>
  );
}
