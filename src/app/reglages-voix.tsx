import { Ionicons } from '@expo/vector-icons';
import type { Voice } from 'expo-speech';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Bouton, Carte, Ecran, s, Sous, Texte } from '@/components/ui';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import { dire, voixFrancaises, type ReglageVoix } from '@/lib/voix';
import { t } from '@/i18n';

const PHRASE = 'Je suis là avec toi. On va regarder ensemble ce qu’il faut faire, étape par étape.';
const VITESSES = [
  { label: 'Lente', valeur: 0.85 },
  { label: 'Normale', valeur: 1 },
  { label: 'Rapide', valeur: 1.15 },
];

export default function ReglagesVoix() {
  const [reglage, setReglage] = useStored<ReglageVoix>(KEYS.voix, { identifiant: null, vitesse: 1 });
  const [voix, setVoix] = useState<Voice[] | null>(null);

  useEffect(() => {
    voixFrancaises().then(setVoix);
  }, []);

  const essayer = (identifiant: string | null) => {
    const avant = reglage;
    setReglage({ ...reglage, identifiant });
    dire(t(PHRASE)).finally(() => setReglage(avant));
  };

  return (
    <Ecran>
      <Texte muted>{t("Choisis la voix qui te parle le plus naturellement. Elle sert pour les réponses de l’IA et le mode panique.")}</Texte>

      <Sous>{t("Vitesse")}</Sous>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {VITESSES.map((v) => (
          <View key={v.label} style={{ flex: 1 }}>
            <Bouton label={t(v.label)} discret={reglage.vitesse !== v.valeur} onPress={() => setReglage({ ...reglage, vitesse: v.valeur })} />
          </View>
        ))}
      </View>

      <Sous>{t("Voix disponibles")}</Sous>
      {voix === null && <Texte muted>{t("Recherche des voix…")}</Texte>}
      {voix?.length === 0 && <Texte>{t("Aucune voix française installée. Installe-en une avec le bouton plus bas.")}</Texte>}
      {voix?.map((v, i) => {
        const choisie = reglage.identifiant === v.identifier || (!reglage.identifiant && i === 0);
        return (
          <View key={v.identifier} style={[s.ligne, choisie && { borderWidth: 2, borderColor: c.accent }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.ligneTitre}>
                {t("Voix ")}{i + 1} {i === 0 ? t("(conseillée)") : ''}
              </Text>
              <Text style={s.ligneSous}>
                {v.language} · {v.quality === 'Enhanced' ? t("haute qualité") : 'standard'}
                {/network/i.test(v.identifier) ? t(" · demande Internet") : ''}
              </Text>
            </View>
            <Pressable onPress={() => essayer(v.identifier)} hitSlop={8}>
              <Ionicons name="play-circle" size={36} color={c.info} />
            </Pressable>
            <Pressable onPress={() => setReglage({ ...reglage, identifiant: v.identifier })} hitSlop={8}>
              <Ionicons name={choisie ? 'checkmark-circle' : 'ellipse-outline'} size={32} color={choisie ? c.accent : c.muted} />
            </Pressable>
          </View>
        );
      })}

      {Platform.OS === 'android' && (
        <>
          <Sous>{t("Des voix plus naturelles")}</Sous>
          <Carte>
            <Texte>{t("Les voix de Google sont bien plus naturelles que celles installées par défaut sur certains téléphones (Samsung notamment).")}</Texte>
            <Texte>{t("1. Ouvre les réglages ci-dessous.")}{'\n'}{t("2. Moteur préféré : « Services Google » (Speech Services by Google).")}{'\n'}{t("3. Dans ses réglages : « Installer les données vocales » → Français → télécharge la voix.")}{'\n'}{t("4. Reviens ici et choisis-la.")}</Texte>
            <Bouton label={t("Ouvrir les réglages de synthèse vocale")} icone="settings" discret onPress={() => Linking.sendIntent('com.android.settings.TTS_SETTINGS').catch(() => Linking.openSettings())} />
          </Carte>
        </>
      )}
    </Ecran>
  );
}
