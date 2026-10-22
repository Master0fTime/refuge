import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Ecran, Texte } from '@/components/ui';
import { ajouterContact, decoder, fusionnerGroupe } from '@/lib/partage';
import { KEYS, useStored } from '@/lib/store';
import { profilVide, type Contact, type Groupe, type Profil } from '@/lib/types';
import { t } from '@/i18n';

export default function Scanner() {
  const [permission, demander] = useCameraPermissions();
  const [profil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const [contacts, setContacts] = useStored<Contact[]>(KEYS.contacts, []);
  const [groupes, setGroupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const traite = useRef(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <Ecran>
        <Texte>{t("La caméra sert uniquement à lire le QR code de tes proches. Rien n’est envoyé nulle part.")}</Texte>
        <Bouton label={t("Autoriser la caméra")} icone="camera" onPress={demander} />
      </Ecran>
    );
  }

  const onScan = ({ data }: { data: string }) => {
    if (traite.current) return;
    traite.current = true;
    const p = decoder(data);
    if (!p) {
      Alert.alert(t("QR code inconnu"), t("Ce n’est pas un QR code Refuge."), [{ text: 'OK', onPress: () => (traite.current = false) }]);
      return;
    }
    if (p.t === 'c') {
      if (p.id === profil.id) {
        Alert.alert(t("C’est toi !"), t("Fais scanner TON code par l’autre personne."), [{ text: 'OK', onPress: () => (traite.current = false) }]);
        return;
      }
      setContacts(ajouterContact(contacts, p));
      Alert.alert(t("Contact ajouté"), t("{nom} est dans tes contacts.", { nom: p.nom }), [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      // On s'ajoute aux membres du groupe reçu, pour qu'il apparaisse dans la liste quand on le partagera à notre tour.
      const moi = { id: profil.id, nom: `${profil.prenom} ${profil.nom}`.trim() || t("Sans nom"), telephone: profil.telephone || undefined };
      const g = p.g.membres.some((m) => m.id === profil.id) ? p.g : { ...p.g, membres: [...p.g.membres, moi] };
      setGroupes(fusionnerGroupe(groupes, g));
      Alert.alert(t("Groupe reçu"), t("« {nom} » : {length} point(s) de ralliement.", { nom: g.nom, length: g.points.length }), [
        { text: t("Voir"), onPress: () => router.replace(`/groupe/${g.id}`) },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onScan} />
    </View>
  );
}
