import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Bouton, Carte, Ecran, Texte, Titre } from '@/components/ui';
import { encoder, payloadProfil } from '@/lib/partage';
import { KEYS, useStored } from '@/lib/store';
import { profilVide, type Profil } from '@/lib/types';
import { t } from '@/i18n';

export default function MonQr() {
  useKeepAwake();
  const [profil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const p = payloadProfil(profil);

  return (
    <Ecran>
      <Titre>{p.nom}</Titre>
      <Texte muted>{t("Fais scanner ce code par ton proche avec Refuge (onglet Groupe → Scanner). Faites-le dans les deux sens.")}</Texte>
      <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16 }}>
        <QRCode value={encoder(p)} size={240} />
      </View>
      {!profil.prenom && (
        <Carte>
          <Texte>{t("Renseigne d’abord ton prénom et ton téléphone dans ta carte de vie.")}</Texte>
          <Bouton label={t("Compléter ma carte de vie")} discret onPress={() => router.push('/moi')} />
        </Carte>
      )}
    </Ecran>
  );
}
