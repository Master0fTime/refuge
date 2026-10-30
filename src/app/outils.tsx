import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Share, Text, View } from 'react-native';
import { Bouton, Carte, Champ, Ecran, Sous, Texte } from '@/components/ui';
import { dms, pointCardinal } from '@/lib/geo';
import { enMorse, sequence } from '@/lib/morse';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

const UNITE_MS = 250;
type Mode = 'lampe' | 'ecran';

export default function Outils() {
  const focus = useIsFocused();
  const [perm, demanderPerm] = useCameraPermissions();
  const [allume, setAllume] = useState(false);
  const [signal, setSignal] = useState<{ mode: Mode; texte: string } | null>(null);
  const [lampe, setLampe] = useState(false);
  const [texteMorse, setTexteMorse] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pos, setPos] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  // Le GPS et la boussole ne tournent que quand l'onglet est visible, pour économiser la batterie.
  useEffect(() => {
    if (!focus) return;
    const subs: Location.LocationSubscription[] = [];
    let actif = true;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || !actif) return;
      subs.push(await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5 }, setPos));
      subs.push(await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading)));
    })().catch(() => {});
    return () => {
      actif = false;
      subs.forEach((s) => s.remove());
    };
  }, [focus]);

  // Joue une séquence morse en boucle (lampe ou écran) jusqu'à l'arrêt.
  useEffect(() => {
    if (!signal) return;
    const seq = sequence(signal.texte);
    let i = 0;
    const pas = () => {
      const [on, unites] = seq[i];
      setAllume(on);
      i = (i + 1) % seq.length;
      timer.current = setTimeout(pas, unites * UNITE_MS);
    };
    pas();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      setAllume(false);
    };
  }, [signal]);

  const lancer = async (mode: Mode, texte: string) => {
    if (mode === 'lampe' && !perm?.granted && !(await demanderPerm()).granted) return;
    setLampe(false);
    setSignal({ mode, texte });
  };

  const basculerLampe = async () => {
    if (!perm?.granted && !(await demanderPerm()).granted) return;
    setSignal(null);
    setLampe(!lampe);
  };

  const torche = lampe || (signal?.mode === 'lampe' && allume);
  const cameraMontee = focus && perm?.granted && (lampe || signal?.mode === 'lampe');

  return (
    <Ecran>
      {/* La lampe torche passe par la caméra : on la monte en 1×1 pixel, seulement quand on en a besoin. */}
      {cameraMontee && <CameraView style={{ width: 1, height: 1, opacity: 0 }} enableTorch={torche} />}

      <Sous>{t("Lumière et signaux")}</Sous>
      <Bouton label={lampe ? t("Éteindre la lampe") : t("Lampe torche")} icone="flashlight" grand onPress={basculerLampe} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label={t("SOS lampe")} icone="warning" couleur={c.danger} onPress={() => lancer('lampe', 'SOS')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label={t("SOS écran")} icone="phone-portrait" couleur={c.danger} onPress={() => lancer('ecran', 'SOS')} />
        </View>
      </View>
      {signal?.mode === 'lampe' && <Bouton label={t("Arrêter le signal")} icone="stop" discret onPress={() => setSignal(null)} />}

      <Carte>
        <Champ label={t("Envoyer un message en morse")} placeholder={t("ex. AIDE, OK, EAU")} value={texteMorse} onChangeText={setTexteMorse} />
        {texteMorse.trim() ? <Texte muted>{enMorse(texteMorse)}</Texte> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Bouton label={t("Lampe")} discret onPress={() => texteMorse.trim() && lancer('lampe', texteMorse)} />
          </View>
          <View style={{ flex: 1 }}>
            <Bouton label={t("Écran")} discret onPress={() => texteMorse.trim() && lancer('ecran', texteMorse)} />
          </View>
        </View>
      </Carte>

      <Sous>{t("Boussole")}</Sous>
      <Carte>
        <View style={{ alignItems: 'center' }}>
          <View style={{ transform: [{ rotate: `${-(heading ?? 0)}deg` }] }}>
            <Ionicons name="navigate-circle-outline" size={140} color={heading === null ? c.muted : c.accent} style={{ transform: [{ rotate: '-45deg' }] }} />
          </View>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: '800' }}>
            {heading === null ? '…' : `${Math.round(heading)}° ${pointCardinal(heading)}`}
          </Text>
          <Texte muted>{t("La pointe indique le nord. Si c’est imprécis, dessine un « 8 » en l’air avec le téléphone.")}</Texte>
        </View>
      </Carte>

      <Sous>{t("Ma position (GPS, sans Internet)")}</Sous>
      <Carte>
        {pos ? (
          <>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }} selectable>
              {pos.coords.latitude.toFixed(5)}, {pos.coords.longitude.toFixed(5)}
            </Text>
            <Texte muted>
              {dms(pos.coords.latitude, true)} {dms(pos.coords.longitude, false)}
            </Texte>
            <Texte muted>
              {t("Précision ±")}{Math.round(pos.coords.accuracy ?? 0)} m
              {pos.coords.altitude != null ? t(" · Altitude {v1} m", { v1: Math.round(pos.coords.altitude) }) : ''}
            </Texte>
            <Bouton
              label={t("Partager / noter")}
              icone="share"
              discret
              onPress={() => Share.share({ message: t("Ma position : {v1}, {v2}", { v1: pos.coords.latitude.toFixed(5), v2: pos.coords.longitude.toFixed(5) }) })}
            />
          </>
        ) : (
          <Texte muted>{t("Recherche des satellites… (plus rapide dehors, à découvert)")}</Texte>
        )}
      </Carte>

      <Modal visible={signal?.mode === 'ecran'} animationType="none" onRequestClose={() => setSignal(null)}>
        <Pressable style={{ flex: 1, backgroundColor: allume ? '#fff' : '#000', justifyContent: 'flex-end' }} onPress={() => setSignal(null)}>
          <Text style={{ color: '#888', textAlign: 'center', padding: 32 }}>{t("Touchez pour arrêter")}</Text>
        </Pressable>
      </Modal>
    </Ecran>
  );
}
