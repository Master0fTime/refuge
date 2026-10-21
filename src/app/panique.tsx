import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c } from '@/lib/theme';

// Mode « Je panique » : une seule chose à la fois, en très gros, avec vibrations et voix.
// Inspiré des premiers secours psychologiques (OMS) : stabiliser, puis orienter.

const TEMPS = [
  { nom: 'Inspire', duree: 4000, echelle: 1, vibration: [0, 350] },
  { nom: 'Bloque', duree: 4000, echelle: 1, vibration: [0, 60, 120, 60] },
  { nom: 'Expire', duree: 6000, echelle: 0.45, vibration: [0, 700] },
] as const;
const CYCLES = 6; // ≈ 1 min 25 : assez pour faire baisser le rythme cardiaque

const PHRASES = [
  'Tu es là, et tu respires. C’est tout ce que tu as à faire.',
  'Ce que tu ressens est très fort, mais ça va passer.',
  'Une panique ne dure pas : elle redescend toujours.',
  'Tu n’as rien à décider pour l’instant.',
  'Je reste avec toi.',
];

const ANCRAGE = [
  'Regarde autour de toi.\nNomme 5 choses que tu VOIS.',
  'Touche 4 choses autour de toi.\nSens leur matière.',
  'Écoute.\nRepère 3 sons.',
  'Trouve 2 odeurs.\nMême très légères.',
  'Pense à 1 chose qui te fait du bien.',
];

type Etape = 'respiration' | 'ancrage' | 'blesse' | 'danger' | 'suite';

export default function Panique() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const [etape, setEtape] = useState<Etape>('respiration');
  const [voix, setVoix] = useState(true);
  const [temps, setTemps] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phrase, setPhrase] = useState(0);
  const [ancrage, setAncrage] = useState(0);
  const echelle = useRef(new Animated.Value(0.45)).current;
  const voixRef = useRef(voix);
  voixRef.current = voix;

  const dire = (t: string) => {
    if (!voixRef.current) return;
    Speech.stop();
    Speech.speak(t, { language: 'fr-FR', rate: 0.85, pitch: 0.95 });
  };

  // Boucle de respiration : chaque temps anime le cercle, vibre et se dit à voix basse.
  useEffect(() => {
    if (etape !== 'respiration') return;
    let i = 0;
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    dire('On respire ensemble. Suis le cercle.');
    const pas = () => {
      const t = TEMPS[i];
      setTemps(i);
      Vibration.vibrate(t.vibration as unknown as number[]);
      dire(t.nom);
      Animated.timing(echelle, { toValue: t.echelle, duration: t.duree, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
      timer = setTimeout(() => {
        i = (i + 1) % TEMPS.length;
        if (i === 0) {
          n += 1;
          setCycle(n);
          setPhrase((p) => (p + 1) % PHRASES.length);
          if (n >= CYCLES) {
            setEtape('ancrage');
            return;
          }
        }
        pas();
      }, t.duree);
    };
    const debut = setTimeout(pas, 1500);
    return () => {
      clearTimeout(debut);
      clearTimeout(timer);
      Vibration.cancel();
      echelle.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape]);

  useEffect(() => {
    if (etape === 'ancrage') dire(ANCRAGE[ancrage].replace('\n', ' '));
    if (etape === 'blesse') dire('Est-ce que toi ou quelqu’un près de toi est blessé ?');
    if (etape === 'danger') dire('Es-tu en danger, là, maintenant ?');
    if (etape === 'suite') dire('Bravo, tu as tenu bon. Tu peux continuer à respirer, ou passer à la suite.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape, ancrage]);

  useEffect(
    () => () => {
      Speech.stop();
    },
    [],
  );

  const quitter = (route?: Parameters<typeof router.replace>[0]) => {
    Speech.stop();
    Vibration.cancel();
    if (route) router.replace(route);
    else router.back();
  };

  return (
    <View style={[st.fond, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={st.barre}>
        <Pressable onPress={() => setVoix(!voix)} hitSlop={12} style={st.icone}>
          <Ionicons name={voix ? 'volume-high' : 'volume-mute'} size={26} color={c.muted} />
        </Pressable>
        <Pressable onPress={() => quitter()} hitSlop={12} style={st.icone}>
          <Ionicons name="close" size={30} color={c.muted} />
        </Pressable>
      </View>

      {etape === 'respiration' && (
        <>
          <Text style={st.phrase}>{PHRASES[phrase]}</Text>
          <View style={st.centre}>
            <Animated.View style={[st.cercle, { transform: [{ scale: echelle }] }]} />
            <Text style={st.temps}>{TEMPS[temps].nom}</Text>
          </View>
          <Text style={st.petit}>
            {cycle + 1} / {CYCLES}
          </Text>
          <Pressable onPress={() => setEtape('ancrage')} style={st.lien}>
            <Text style={st.lienTxt}>Ça va mieux, continuer</Text>
          </Pressable>
        </>
      )}

      {etape === 'ancrage' && (
        <Pressable style={st.plein} onPress={() => (ancrage < ANCRAGE.length - 1 ? setAncrage(ancrage + 1) : setEtape('blesse'))}>
          <Text style={st.grand}>{ANCRAGE[ancrage]}</Text>
          <Text style={st.petit}>Prends ton temps. Touche l’écran quand c’est fait.</Text>
        </Pressable>
      )}

      {etape === 'blesse' && (
        <Question
          texte="Toi ou quelqu’un près de toi, est-il blessé ?"
          oui={() => quitter('/guide')}
          non={() => setEtape('danger')}
        />
      )}

      {etape === 'danger' && (
        <Question texte="Es-tu en danger, là, maintenant ?" oui={() => quitter('/guide')} non={() => setEtape('suite')} />
      )}

      {etape === 'suite' && (
        <View style={st.plein}>
          <Text style={st.grand}>Bravo, tu as tenu bon.</Text>
          <Text style={st.phrase}>Tu es en sécurité pour l’instant. Que veux-tu faire ?</Text>
          <View style={{ gap: 12, alignSelf: 'stretch' }}>
            <GrosBouton label="Respirer encore" onPress={() => (setCycle(0), setAncrage(0), setEtape('respiration'))} />
            <GrosBouton label="Parler à quelqu’un (l’IA)" onPress={() => quitter({ pathname: '/demander', params: { voix: '1' } })} />
            <GrosBouton label="Conseils contre la peur" onPress={() => quitter('/fiche/moral-stress')} />
            <GrosBouton label="Retour à l’accueil" discret onPress={() => quitter()} />
          </View>
        </View>
      )}
    </View>
  );
}

function Question({ texte, oui, non }: { texte: string; oui: () => void; non: () => void }) {
  return (
    <View style={st.plein}>
      <Text style={st.grand}>{texte}</Text>
      <View style={{ flexDirection: 'row', gap: 16, alignSelf: 'stretch' }}>
        <View style={{ flex: 1 }}>
          <GrosBouton label="Oui" couleur={c.danger} onPress={oui} />
        </View>
        <View style={{ flex: 1 }}>
          <GrosBouton label="Non" couleur={c.ok} onPress={non} />
        </View>
      </View>
    </View>
  );
}

function GrosBouton({ label, onPress, couleur = c.info, discret }: { label: string; onPress: () => void; couleur?: string; discret?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.bouton, { backgroundColor: discret ? c.cardAlt : couleur }, pressed && { opacity: 0.7 }]}>
      <Text style={[st.boutonTxt, discret && { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#0b1016', paddingHorizontal: 24 },
  barre: { flexDirection: 'row', justifyContent: 'space-between' },
  icone: { padding: 8 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cercle: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#2dd4bf33', borderWidth: 3, borderColor: '#2dd4bf' },
  temps: { color: c.text, fontSize: 40, fontWeight: '800' },
  phrase: { color: c.text, fontSize: 22, lineHeight: 30, textAlign: 'center', marginTop: 16 },
  petit: { color: c.muted, fontSize: 16, textAlign: 'center', marginTop: 12 },
  lien: { alignSelf: 'center', padding: 16 },
  lienTxt: { color: c.muted, fontSize: 16, textDecorationLine: 'underline' },
  plein: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  grand: { color: c.text, fontSize: 32, lineHeight: 42, fontWeight: '800', textAlign: 'center' },
  bouton: { paddingVertical: 22, borderRadius: 16, alignItems: 'center' },
  boutonTxt: { color: '#000', fontSize: 22, fontWeight: '800' },
});
