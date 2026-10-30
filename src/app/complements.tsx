import { Ionicons } from '@expo/vector-icons';
import { Linking, Text, View } from 'react-native';
import { Bouton, Ecran, Sous, Texte } from '@/components/ui';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

type Appli = { nom: string; paquet: string; role: string; details: string; icone: 'chatbubbles' | 'navigate'; github?: string; fdroid?: string };

// Applis libres et gratuites qui complètent Refuge. Refuge ne les intègre pas : on explique et on renvoie vers elles.
const APPLIS: Appli[] = [
  {
    nom: 'Bitchat',
    paquet: 'com.bitchat.droid',
    role: 'Discuter sans Internet ni réseau mobile',
    details:
      'Les messages passent de téléphone en téléphone par Bluetooth, jusqu’à environ 100 m, et chaque téléphone relaie pour aller plus loin. Sans compte ni numéro. Bluetooth et localisation doivent être activés, et tes proches doivent l’avoir aussi.',
    icone: 'chatbubbles',
    github: 'https://github.com/permissionlesstech/bitchat-android/releases',
  },
  {
    nom: 'Organic Maps',
    paquet: 'app.organicmaps',
    role: 'Itinéraires à pied, à vélo et en voiture, hors ligne',
    details: 'Complète la carte de Refuge : calcule un chemin sans réseau. Télécharge la carte de ta région dans l’appli tant que tu as Internet.',
    icone: 'navigate',
    fdroid: 'https://f-droid.org/packages/app.organicmaps/',
  },
];

const ouvrirStore = (paquet: string) =>
  Linking.openURL(`market://details?id=${paquet}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${paquet}`));

export default function Complements() {
  return (
    <Ecran>
      <Texte muted>
        {t('Deux applis libres et gratuites complètent Refuge. Installe-les MAINTENANT, tant qu’Internet fonctionne, et fais-les installer à tes proches.')}
      </Texte>
      {APPLIS.map((a) => (
        <View key={a.paquet} style={{ backgroundColor: c.card, borderRadius: 16, padding: space.lg, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={a.icone} size={26} color={c.surJaune} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 19, fontWeight: '800' }}>{a.nom}</Text>
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '700' }}>{t(a.role)}</Text>
            </View>
          </View>
          <Texte>{t(a.details)}</Texte>
          <Bouton label={t('Installer (Google Play)')} icone="download" onPress={() => ouvrirStore(a.paquet)} />
          {a.github && <Bouton label={t('Sans Google Play (GitHub)')} icone="logo-github" discret onPress={() => Linking.openURL(a.github!)} />}
          {a.fdroid && <Bouton label={t('Sans Google Play (F-Droid)')} icone="cube" discret onPress={() => Linking.openURL(a.fdroid!)} />}
        </View>
      ))}
      <Sous>{t('Bon à savoir')}</Sous>
      <Texte muted>
        {t('Bitchat peut aussi passer par Internet quand il est disponible. Sans réseau, il n’utilise que le Bluetooth : plus il y a de téléphones autour, plus les messages vont loin.')}
      </Texte>
    </Ecran>
  );
}
