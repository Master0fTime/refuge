import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { getPermissionsAsync as getPhotos, requestPermissionsAsync as demanderPhotos } from 'expo-media-library';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Bouton, Ecran, Texte, Titre, type IconName } from '@/components/ui';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

type Reponse = { granted: boolean; canAskAgain?: boolean };
type Autorisation = { id: string; nom: string; raison: string; icone: IconName; lire: () => Promise<Reponse>; demander: () => Promise<Reponse> };

// Chaque autorisation avec SA raison, en une phrase. Rien n'est envoyé sur Internet.
const AUTORISATIONS: Autorisation[] = [
  {
    id: 'position',
    nom: 'Position',
    raison: 'GPS sans réseau : te situer sur la carte, envoyer ta position à tes proches, rejoindre un point de ralliement.',
    icone: 'location',
    lire: Location.getForegroundPermissionsAsync,
    demander: Location.requestForegroundPermissionsAsync,
  },
  {
    id: 'camera',
    nom: 'Appareil photo',
    raison: 'Scanner les QR codes (groupe, proches, partage), allumer la lampe torche et montrer une photo à l’IA.',
    icone: 'camera',
    lire: Camera.getCameraPermissionsAsync,
    demander: Camera.requestCameraPermissionsAsync,
  },
  {
    id: 'micro',
    nom: 'Micro',
    raison: 'Parler à l’IA au lieu d’écrire. Le son reste sur ton téléphone.',
    icone: 'mic',
    lire: Camera.getMicrophonePermissionsAsync,
    demander: Camera.requestMicrophonePermissionsAsync,
  },
  {
    id: 'photos',
    nom: 'Photos',
    raison: 'Enregistrer ton fond d’écran d’urgence (groupe sanguin, contacts) dans ta galerie.',
    icone: 'images',
    lire: () => getPhotos(true),
    demander: () => demanderPhotos(true),
  },
];

/** Après « Tout préparer » : les autorisations utiles, une par une, pendant que le kit se télécharge. */
export default function Autorisations() {
  const [etats, setEtats] = useState<Record<string, Reponse>>({});

  const rafraichir = useCallback(async () => {
    const r: Record<string, Reponse> = {};
    for (const a of AUTORISATIONS) r[a.id] = await a.lire().catch(() => ({ granted: false }));
    setEtats(r);
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  const demander = async (a: Autorisation) => {
    const actuel = etats[a.id];
    // Refusée deux fois : Android ne redemande plus, il faut passer par les réglages du téléphone.
    if (actuel && !actuel.granted && actuel.canAskAgain === false) return Linking.openSettings();
    const r = await a.demander().catch(() => ({ granted: false }));
    setEtats((x) => ({ ...x, [a.id]: r }));
  };

  const toutDemander = async () => {
    for (const a of AUTORISATIONS) if (!etats[a.id]?.granted) await demander(a);
  };

  const toutes = AUTORISATIONS.every((a) => etats[a.id]?.granted);

  return (
    <Ecran>
      <Titre>{t('Autorisations utiles')}</Titre>
      <Texte muted>{t('Le téléchargement continue pendant ce temps. Refuge n’envoie rien sur Internet : chaque autorisation sert seulement sur ton téléphone.')}</Texte>

      {AUTORISATIONS.map((a) => {
        const ok = etats[a.id]?.granted;
        return (
          <Pressable
            key={a.id}
            onPress={() => !ok && demander(a)}
            style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: space.lg, opacity: pressed ? 0.75 : 1 })}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ok ? c.cardAlt : c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={a.icone} size={24} color={ok ? c.ok : c.surJaune} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: c.text, fontSize: 17, fontWeight: '700' }}>{t(a.nom)}</Text>
              <Text style={{ color: c.muted, fontSize: 14, lineHeight: 19 }}>{t(a.raison)}</Text>
            </View>
            {ok ? <Ionicons name="checkmark-circle" size={28} color={c.ok} /> : <Text style={{ color: c.accent, fontWeight: '800' }}>{t('Autoriser')}</Text>}
          </Pressable>
        );
      })}

      <Texte muted>{t('SMS : aucune autorisation. L’appli prépare le message, c’est toi qui l’envoies.')}</Texte>

      {!toutes && <Bouton label={t('Tout autoriser')} icone="shield-checkmark" grand onPress={toutDemander} />}
      <Bouton label={toutes ? t('Continuer') : t('Plus tard')} discret={!toutes} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Ecran>
  );
}
