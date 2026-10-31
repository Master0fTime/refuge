import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Bouton, Carte, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { formatTaille } from '@/lib/ia/modeles';
import { arreterPartage, demarrerPartage, envoyerApk, partageDisponible, qrWifi, type Catalogue } from '@/lib/partage-hors-ligne';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

type Session = { ssid: string | null; motDePasse: string | null; url: string; catalogue: Catalogue };

export default function Partager() {
  useKeepAwake(); // l'écran doit rester allumé pendant que les amis téléchargent
  const [session, setSession] = useState<Session | null>(null);
  const [etape, setEtape] = useState<1 | 2>(1);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => () => arreterPartage(), []);

  const demarrer = async () => {
    setEnCours(true);
    try {
      setSession(await demarrerPartage());
      setEtape(1);
    } catch (e) {
      Alert.alert(t("Partage impossible"), String(e instanceof Error ? e.message : e));
    } finally {
      setEnCours(false);
    }
  };

  const arreter = () => {
    arreterPartage();
    setSession(null);
  };

  const envoyer = () => envoyerApk().catch((e) => Alert.alert(t("Envoi impossible"), String(e instanceof Error ? e.message : e)));

  if (!partageDisponible()) {
    return (
      <Ecran>
        <Texte>{t("Le partage hors ligne n’est disponible que sur Android, dans l’appli installée.")}</Texte>
      </Ecran>
    );
  }

  if (!session) {
    return (
      <Ecran>
        <Titre>{t("Partager Refuge sans Internet")}</Titre>
        <Texte muted>{t("Tes proches n’ont pas l’appli et il n’y a plus de réseau ? Ton téléphone peut la leur transmettre directement.")}</Texte>
        <Carte couleur={c.ok}>
          <Texte>{t("Ce qui est partagé : l’appli et tout ce que tu as installé (IA, voix, encyclopédie, photo, cartes). Ton proche n’a besoin ni d’Internet ni de réseau.")}</Texte>
          <Texte>{t("Ce qui n’est JAMAIS partagé : ta carte de vie, tes groupes, tes contacts, tes points de ralliement.")}</Texte>
        </Carte>
        <Bouton label={enCours ? t("Démarrage…") : t("Démarrer le partage")} icone="wifi" grand onPress={() => !enCours && demarrer()} />
        <Texte muted>{t("Ton téléphone crée son propre Wi-Fi (sans Internet ni carte SIM). Pense à désactiver le partage de connexion s’il est allumé.")}</Texte>

        <Sous>{t("Autre solution")}</Sous>
        <Bouton label={t("Envoyer l’appli par Quick Share ou Bluetooth")} icone="share-social" discret onPress={envoyer} />
        <Texte muted>{t("Plus lent, et seulement l’appli : ton ami récupérera ensuite les packs par le Wi-Fi local.")}</Texte>
      </Ecran>
    );
  }

  const total = session.catalogue.apkOctets + session.catalogue.packs.reduce((s, p) => s + p.octets, 0);

  return (
    <Ecran>
      {etape === 1 ? (
        <>
          <Titre>{t("1. Rejoindre mon Wi-Fi")}</Titre>
          <Texte muted>{t("Ton ami ouvre l’APPAREIL PHOTO de son téléphone et vise ce code, puis touche « Se connecter ».")}</Texte>
          {session.ssid && session.motDePasse ? (
            <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16 }}>
              <QRCode value={qrWifi(session.ssid, session.motDePasse)} size={250} />
            </View>
          ) : null}
          <Carte>
            <Texte>{t("Ou à la main :")}</Texte>
            <Text selectable style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>
              {t("Réseau : ")}{session.ssid ?? '?'}
            </Text>
            <Text selectable style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>
              {t("Mot de passe : ")}{session.motDePasse ?? '?'}
            </Text>
          </Carte>
          <Bouton label={t("Il est connecté → étape 2")} icone="arrow-forward" grand onPress={() => setEtape(2)} />
        </>
      ) : (
        <>
          <Titre>{t("2. Télécharger Refuge")}</Titre>
          <Texte muted>
            {t("Ton ami vise ce code avec l’appareil photo : une page s’ouvre pour télécharger l’appli. Une fois Refuge installé et ouvert, il touche « Pas d’Internet ? Récupérer depuis un proche » et scanne CE MÊME code : tout le reste se copie (IA, voix, encyclopédie, photo, cartes).")}</Texte>
          <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16 }}>
            <QRCode value={session.url} size={250} />
          </View>
          <Text selectable style={{ color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            {session.url}
          </Text>
          <Texte muted>{t("À transmettre : environ ")}{formatTaille(total)} {t(" au total. Plusieurs amis peuvent télécharger en même temps.")}</Texte>
          <Bouton label={t("Revoir le code Wi-Fi")} icone="arrow-back" discret onPress={() => setEtape(1)} />
        </>
      )}
      <Bouton label={t("Arrêter le partage")} icone="stop-circle" couleur={c.danger} onPress={arreter} />
      <Texte muted>{t("Garde l’écran allumé et reste à quelques mètres pendant le téléchargement.")}</Texte>
    </Ecran>
  );
}
