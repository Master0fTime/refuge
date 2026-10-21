import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

export type Etape = 'chargement' | 'lecture' | 'ecriture';

const TEXTES: Record<Etape, string> = {
  chargement: 'Je me prépare (la première fois, ça peut prendre 10 à 30 secondes)',
  lecture: 'Je réfléchis à ta situation',
  ecriture: 'J’écris',
};

/** Montre que l'IA travaille : étape en cours, points animés et secondes écoulées. */
export function Reflexion({ etape, modeleLent }: { etape: Etape; modeleLent: boolean }) {
  const [secondes, setSecondes] = useState(0);
  const anim = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const boucle = Animated.loop(
      Animated.stagger(
        180,
        anim.map((v) =>
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    boucle.start();
    return () => boucle.stop();
  }, [anim]);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {anim.map((v, i) => (
            <Animated.View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.info, opacity: v }} />
          ))}
        </View>
        <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>
          {t(TEXTES[etape])}… {secondes} s
        </Text>
      </View>
      {secondes >= 40 && etape !== 'ecriture' && (
        <Pressable onPress={() => router.push('/ia')}>
          <Text style={{ color: c.muted, fontSize: 14 }}>
            {modeleLent
              ? t('C’est long : le modèle « Avancé » est lent sur téléphone. Touche ici pour passer au « Standard », 2 à 3 fois plus rapide.')
              : t('C’est long : ton téléphone travaille sans Internet, sur son seul processeur. Touche ici pour essayer le modèle « Léger », plus rapide.')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
