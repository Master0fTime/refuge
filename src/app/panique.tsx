import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c } from '@/lib/theme';
import { dire } from '@/lib/voix';
import { t } from '@/i18n';

// « Je panique » : un DIALOGUE, pas seulement un exercice de respiration.
// Paniquer ne veut pas dire être incapable d'agir : on commence par comprendre ce qui se passe,
// et s'il y a un danger, on donne d'abord les gestes de mise à l'abri.
// Principes (premiers secours psychologiques, OMS) : phrases courtes, une action à la fois,
// nommer l'émotion sans la minimiser, ne jamais dire « calme-toi », redonner du contrôle.

const TEMPS = [
  { nom: 'Inspire', duree: 4000, echelle: 1, vibration: [0, 350] },
  { nom: 'Bloque', duree: 4000, echelle: 1, vibration: [0, 60, 120, 60] },
  { nom: 'Expire', duree: 6000, echelle: 0.45, vibration: [0, 700] },
] as const;

const PHRASES = [
  'Ce que tu ressens est très fort. C’est normal : ton corps se prépare à agir.',
  'Une crise d’angoisse est très désagréable, mais elle ne t’abîme pas. Elle redescend toujours.',
  'Tu n’as rien à décider pour l’instant. Juste respirer.',
  'Je reste avec toi.',
];

const ANCRAGE = [
  'Pose tes deux pieds bien à plat.\nSens le sol sous toi.',
  'Regarde autour de toi.\nNomme 5 choses que tu vois.',
  'Touche 3 choses autour de toi.\nSens leur matière.',
  'Écoute.\nRepère 2 sons.',
];

type Etape = 'accueil' | 'danger' | 'abri' | 'respiration' | 'ancrage' | 'blesse' | 'enDanger' | 'seul' | 'suite';

export default function Panique() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const [etape, setEtape] = useState<Etape>('accueil');
  const [voix, setVoix] = useState(true);
  const [cycles, setCycles] = useState(6);
  const [temps, setTemps] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phrase, setPhrase] = useState(0);
  const [ancrage, setAncrage] = useState(0);
  const echelle = useRef(new Animated.Value(0.45)).current;
  const voixRef = useRef(voix);
  voixRef.current = voix;
  const apresRespiration = useRef<Etape>('ancrage');

  const parler = (texte: string) => {
    if (voixRef.current) dire(texte, { lent: true });
  };

  // Ce qui est dit à voix haute à chaque étape.
  useEffect(() => {
    const textes: Partial<Record<Etape, string>> = {
      accueil: t('Je suis là avec toi. Qu’est-ce qui se passe ?'),
      danger: t('D’abord ta sécurité. Éloigne-toi des fenêtres. Mets-toi au plus bas, derrière un mur solide.'),
      abri: t('Si tu peux bouger sans danger, va vers l’endroit le plus protégé. Sinon, reste au sol et protège ta tête.'),
      ancrage: ANCRAGE[ancrage].replace('\n', ' '),
      blesse: t('Est-ce que toi ou quelqu’un près de toi est blessé ?'),
      enDanger: t('Es-tu en danger, là où tu es, maintenant ?'),
      seul: t('Es-tu seul ?'),
      suite: t('Tu as tenu bon. Qu’est-ce que tu veux faire maintenant ?'),
    };
    const texte = textes[etape];
    if (texte) parler(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape, ancrage]);

  // Respiration guidée : cercle, vibrations, voix.
  useEffect(() => {
    if (etape !== 'respiration') return;
    let i = 0;
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    parler(cycles === 1 ? t('Une seule respiration lente, avec moi.') : t('On respire ensemble. Suis le cercle.'));
    const pas = () => {
      const tps = TEMPS[i];
      setTemps(i);
      Vibration.vibrate(tps.vibration as unknown as number[]);
      parler(t(tps.nom));
      Animated.timing(echelle, { toValue: tps.echelle, duration: tps.duree, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
      timer = setTimeout(() => {
        i = (i + 1) % TEMPS.length;
        if (i === 0) {
          n += 1;
          setCycle(n);
          setPhrase((p) => (p + 1) % PHRASES.length);
          if (n >= cycles) {
            setEtape(apresRespiration.current);
            return;
          }
        }
        pas();
      }, tps.duree);
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

  useEffect(
    () => () => {
      Speech.stop();
      Vibration.cancel();
    },
    [],
  );

  const respirer = (n: number, ensuite: Etape) => {
    setCycles(n);
    setCycle(0);
    apresRespiration.current = ensuite;
    setEtape('respiration');
  };

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

      {etape === 'accueil' && (
        <ScrollView contentContainerStyle={st.liste}>
          <Text style={st.grand}>{t('Je suis là avec toi.')}</Text>
          <Text style={st.phrase}>{t('Qu’est-ce qui se passe ?')}</Text>
          <Choix icone="warning" couleur={c.danger} label={t('Danger autour de moi')} sous={t('Explosion, tirs, incendie, eau qui monte…')} onPress={() => setEtape('danger')} />
          <Choix icone="medkit" couleur="#f87171" label={t('Quelqu’un est blessé')} onPress={() => quitter({ pathname: '/guide', params: { probleme: 'blesse' } })} />
          <Choix icone="people" couleur="#c084fc" label={t('Je suis séparé de mes proches')} onPress={() => quitter({ pathname: '/guide', params: { probleme: 'separe' } })} />
          <Choix icone="pulse" couleur="#2dd4bf" label={t('Crise d’angoisse')} sous={t('Cœur qui s’emballe, souffle court, peur intense')} onPress={() => respirer(6, 'ancrage')} />
          <Choix icone="help-circle" couleur={c.accent} label={t('Je ne sais pas, tout se mélange')} onPress={() => respirer(1, 'blesse')} />
          <Choix icone="chatbubbles" couleur={c.info} label={t('Je veux en parler')} sous={t('L’IA t’écoute et t’aide à y voir clair')} onPress={() => quitter({ pathname: '/demander', params: { voix: '1' } })} />
        </ScrollView>
      )}

      {etape === 'danger' && (
        <ScrollView contentContainerStyle={st.liste}>
          <Text style={st.grand}>{t('D’abord, ta sécurité.')}</Text>
          <Consigne n={1} texte={t("Éloigne-toi des fenêtres et des vitres.")} />
          <Consigne n={2} texte={t("Mets-toi au plus bas, derrière un mur solide ou dans une pièce sans fenêtre (couloir, salle de bain, sous-sol).")} />
          <Consigne n={3} texte={t("Si c’est à portée de main : chaussures, téléphone, papiers. Sinon, laisse tout.")} />
          <Consigne n={4} texte={t("Ne sors pas voir ce qui se passe.")} />
          <Text style={st.phrase}>{t('Es-tu à l’abri maintenant ?')}</Text>
          <OuiNon oui={() => respirer(1, 'suite')} non={() => setEtape('abri')} />
        </ScrollView>
      )}

      {etape === 'abri' && (
        <ScrollView contentContainerStyle={st.liste}>
          <Text style={st.grand}>{t('Protège-toi.')}</Text>
          <Consigne n={1} texte={t("Si tu peux bouger sans danger : va vers l’endroit le plus protégé (sous-sol, cage d’escalier, couloir au centre du bâtiment).")} />
          <Consigne n={2} texte={t("Sinon : reste allongé au sol, protège ta tête avec tes bras.")} />
          <Consigne n={3} texte={t("Odeur de gaz ou fumée : sors dès que c’est possible, en restant bas.")} />
          <GrosBouton label={t('Je suis à l’abri')} couleur={c.ok} onPress={() => respirer(1, 'suite')} />
        </ScrollView>
      )}

      {etape === 'respiration' && (
        <>
          <Text style={st.phrase}>{t(PHRASES[phrase])}</Text>
          <View style={st.centre}>
            <Animated.View style={[st.cercle, { transform: [{ scale: echelle }] }]} />
            <Text style={st.temps}>{t(TEMPS[temps].nom)}</Text>
          </View>
          {cycles > 1 && (
            <Text style={st.petit}>
              {Math.min(cycle + 1, cycles)} / {cycles}
            </Text>
          )}
          <Pressable onPress={() => setEtape(apresRespiration.current)} style={st.lien}>
            <Text style={st.lienTxt}>{t('Continuer')}</Text>
          </Pressable>
        </>
      )}

      {etape === 'ancrage' && (
        <Pressable style={st.plein} onPress={() => (ancrage < ANCRAGE.length - 1 ? setAncrage(ancrage + 1) : setEtape('blesse'))}>
          <Text style={st.grand}>{t(ANCRAGE[ancrage])}</Text>
          <Text style={st.petit}>{t('Prends ton temps. Touche l’écran quand c’est fait.')}</Text>
        </Pressable>
      )}

      {etape === 'blesse' && (
        <Question texte={t("Toi ou quelqu’un près de toi, est-il blessé ?")} oui={() => quitter({ pathname: '/guide', params: { probleme: 'blesse' } })} non={() => setEtape('enDanger')} />
      )}
      {etape === 'enDanger' && <Question texte={t("Es-tu en danger, là où tu es, maintenant ?")} oui={() => setEtape('danger')} non={() => setEtape('seul')} />}
      {etape === 'seul' && (
        <Question
          texte={t("Es-tu seul ?")}
          oui={() => {
            parler(t('Tu n’es pas complètement seul : je suis là, et tu peux prévenir tes proches.'));
            setEtape('suite');
          }}
          non={() => setEtape('suite')}
        />
      )}

      {etape === 'suite' && (
        <ScrollView contentContainerStyle={st.liste}>
          <Text style={st.grand}>{t('Tu as tenu bon.')}</Text>
          <Text style={st.phrase}>{t('Qu’est-ce que tu veux faire maintenant ?')}</Text>
          <GrosBouton label={t('Comprendre quoi faire (assistant)')} onPress={() => quitter('/guide')} />
          <GrosBouton label={t('En parler à l’IA')} onPress={() => quitter({ pathname: '/demander', params: { voix: '1' } })} />
          <GrosBouton label={t('Prévenir mes proches')} onPress={() => quitter('/groupe')} />
          <GrosBouton label={t('Respirer encore')} discret onPress={() => respirer(6, 'suite')} />
        </ScrollView>
      )}
    </View>
  );
}

function Choix({ icone, couleur, label, sous, onPress }: { icone: keyof typeof Ionicons.glyphMap; couleur: string; label: string; sous?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.choix, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icone} size={30} color={couleur} />
      <View style={{ flex: 1 }}>
        <Text style={st.choixTxt}>{label}</Text>
        {sous ? <Text style={st.choixSous}>{sous}</Text> : null}
      </View>
    </Pressable>
  );
}

function Consigne({ n, texte }: { n: number; texte: string }) {
  return (
    <View style={st.consigne}>
      <Text style={st.numero}>{n}</Text>
      <Text style={st.consigneTxt}>{texte}</Text>
    </View>
  );
}

function OuiNon({ oui, non }: { oui: () => void; non: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignSelf: 'stretch' }}>
      <View style={{ flex: 1 }}>
        <GrosBouton label={t('Oui')} couleur={c.ok} onPress={oui} />
      </View>
      <View style={{ flex: 1 }}>
        <GrosBouton label={t('Non')} couleur={c.danger} onPress={non} />
      </View>
    </View>
  );
}

function Question({ texte, oui, non }: { texte: string; oui: () => void; non: () => void }) {
  return (
    <View style={st.plein}>
      <Text style={st.grand}>{texte}</Text>
      <View style={{ flexDirection: 'row', gap: 16, alignSelf: 'stretch' }}>
        <View style={{ flex: 1 }}>
          <GrosBouton label={t('Oui')} couleur={c.danger} onPress={oui} />
        </View>
        <View style={{ flex: 1 }}>
          <GrosBouton label={t('Non')} couleur={c.ok} onPress={non} />
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
  fond: { flex: 1, backgroundColor: '#0b1016', paddingHorizontal: 20 },
  barre: { flexDirection: 'row', justifyContent: 'space-between' },
  icone: { padding: 8 },
  liste: { gap: 14, paddingVertical: 12 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cercle: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#2dd4bf33', borderWidth: 3, borderColor: '#2dd4bf' },
  temps: { color: c.text, fontSize: 40, fontWeight: '800' },
  phrase: { color: c.text, fontSize: 22, lineHeight: 30, textAlign: 'center', marginTop: 8 },
  petit: { color: c.muted, fontSize: 16, textAlign: 'center', marginTop: 12 },
  lien: { alignSelf: 'center', padding: 16 },
  lienTxt: { color: c.muted, fontSize: 16, textDecorationLine: 'underline' },
  plein: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  grand: { color: c.text, fontSize: 30, lineHeight: 40, fontWeight: '800', textAlign: 'center' },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.card, borderRadius: 16, padding: 18 },
  choixTxt: { color: c.text, fontSize: 20, fontWeight: '700' },
  choixSous: { color: c.muted, fontSize: 15, marginTop: 2 },
  consigne: { flexDirection: 'row', gap: 14, backgroundColor: c.card, borderRadius: 14, padding: 16, alignItems: 'flex-start' },
  numero: { color: '#000', backgroundColor: c.accent, width: 32, height: 32, borderRadius: 16, textAlign: 'center', lineHeight: 32, fontWeight: '800', fontSize: 18 },
  consigneTxt: { color: c.text, fontSize: 20, lineHeight: 28, flex: 1 },
  bouton: { paddingVertical: 22, borderRadius: 16, alignItems: 'center' },
  boutonTxt: { color: '#000', fontSize: 22, fontWeight: '800' },
});
