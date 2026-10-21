import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c } from '@/lib/theme';
import { dire } from '@/lib/voix';
import { t } from '@/i18n';

// Métronome de massage cardiaque : 110 compressions par minute (recommandé : 100 à 120),
// cycles de 30 compressions et 2 insufflations (ou compressions seules), relais toutes les 2 minutes.

const CADENCE = 110;
const INTERVALLE = 60000 / CADENCE;
const RELAIS_MS = 2 * 60 * 1000;

type Mode = '30-2' | 'continu';

export default function Rcp() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const tic = useAudioPlayer(require('../../assets/sons/tic.wav'));
  const relais = useAudioPlayer(require('../../assets/sons/relais.wav'));
  const [actif, setActif] = useState(false);
  const [mode, setMode] = useState<Mode>('30-2');
  const [compte, setCompte] = useState(0);
  const [insufflations, setInsufflations] = useState(false);
  const [ecoule, setEcoule] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const debut = useRef(0);
  const compteRef = useRef(0);
  const dernierRelais = useRef(0);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Battement : son + vibration + pulsation à chaque compression.
  useEffect(() => {
    if (!actif || insufflations) return;
    const minuteur = setInterval(() => {
      tic.seekTo(0);
      tic.play();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.88, duration: 90, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      compteRef.current += 1;
      if (mode === '30-2' && compteRef.current >= 30) {
        compteRef.current = 0;
        setInsufflations(true);
        dire(t('Deux insufflations'));
      }
      setCompte(compteRef.current);
    }, INTERVALLE);
    return () => clearInterval(minuteur);
  }, [actif, insufflations, mode, pulse, tic]);

  // Chronomètre et rappel de relais toutes les 2 minutes.
  useEffect(() => {
    if (!actif) return;
    const minuteur = setInterval(() => {
      const ms = Date.now() - debut.current;
      setEcoule(ms);
      if (ms - dernierRelais.current >= RELAIS_MS) {
        dernierRelais.current = ms;
        relais.seekTo(0);
        relais.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        dire(t('Deux minutes. Changez de personne si vous êtes plusieurs.'));
      }
    }, 500);
    return () => clearInterval(minuteur);
  }, [actif, relais]);

  // Après les insufflations (environ 5 secondes), on reprend automatiquement.
  useEffect(() => {
    if (!insufflations) return;
    const minuteur = setTimeout(() => setInsufflations(false), 5000);
    return () => clearTimeout(minuteur);
  }, [insufflations]);

  const demarrer = () => {
    debut.current = Date.now();
    dernierRelais.current = 0;
    compteRef.current = 0;
    setCompte(0);
    setEcoule(0);
    setInsufflations(false);
    setActif(true);
    dire(t('Appuie au centre de la poitrine, au rythme du son.'));
  };

  const minutes = Math.floor(ecoule / 60000);
  const secondes = Math.floor((ecoule % 60000) / 1000);

  return (
    <View style={[st.fond, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={st.barre}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={30} color={c.muted} />
        </Pressable>
        <Text style={st.chrono}>
          {minutes}:{String(secondes).padStart(2, '0')}
        </Text>
        <Pressable onPress={() => Linking.openURL('tel:112')} hitSlop={12} style={st.appel}>
          <Ionicons name="call" size={18} color="#000" />
          <Text style={{ fontWeight: '800' }}>112</Text>
        </Pressable>
      </View>

      <View style={st.centre}>
        <Animated.View style={[st.cercle, insufflations && { backgroundColor: c.info }, { transform: [{ scale: pulse }] }]}>
          {insufflations ? (
            <>
              <Ionicons name="cloud-outline" size={64} color="#000" />
              <Text style={st.grandNoir}>{t('2 insufflations')}</Text>
            </>
          ) : (
            <>
              <Text style={st.nombre}>{actif ? compte || (mode === '30-2' ? 30 : '•') : '—'}</Text>
              <Text style={st.sousNoir}>{actif ? (mode === '30-2' ? t('compressions') : t('appuie au rythme')) : t('prêt')}</Text>
            </>
          )}
        </Animated.View>
        <Text style={st.aide}>
          {t('Mains l’une sur l’autre au centre de la poitrine, bras tendus. Enfonce de 5 à 6 cm, laisse remonter. {cadence} par minute.', { cadence: CADENCE })}
        </Text>
      </View>

      {!actif && (
        <View style={st.modes}>
          {(['30-2', 'continu'] as Mode[]).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[st.mode, mode === m && { backgroundColor: c.accent }]}>
              <Text style={[st.modeTxt, mode === m && { color: '#000' }]}>{m === '30-2' ? t('30 compressions + 2 insufflations') : t('Compressions seules')}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={() => (actif ? setActif(false) : demarrer())} style={[st.bouton, { backgroundColor: actif ? c.cardAlt : c.danger }]}>
        <Text style={[st.boutonTxt, actif && { color: c.text }]}>{actif ? t('Pause') : t('Démarrer le massage')}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/fiche/rcp')} style={{ alignSelf: 'center', padding: 12 }}>
        <Text style={{ color: c.muted, textDecorationLine: 'underline' }}>{t('Voir la fiche complète')}</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#0b1016', paddingHorizontal: 20 },
  barre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chrono: { color: c.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  appel: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: c.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  cercle: { width: 250, height: 250, borderRadius: 125, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' },
  nombre: { color: '#000', fontSize: 96, fontWeight: '900', fontVariant: ['tabular-nums'] },
  sousNoir: { color: '#000', fontSize: 18, fontWeight: '700' },
  grandNoir: { color: '#000', fontSize: 24, fontWeight: '900' },
  aide: { color: c.text, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  modes: { gap: 8, marginBottom: 12 },
  mode: { padding: 14, borderRadius: 12, backgroundColor: c.cardAlt },
  modeTxt: { color: c.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  bouton: { paddingVertical: 22, borderRadius: 16, alignItems: 'center' },
  boutonTxt: { color: '#000', fontSize: 22, fontWeight: '900' },
});
