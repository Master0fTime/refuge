import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useRef, useState, type ComponentRef } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { Bouton, Ecran, Texte } from '@/components/ui';
import { KEYS, useStored } from '@/lib/store';
import { profilVide, type Contact, type Profil } from '@/lib/types';

/** Texte brut lisible par n'importe quel lecteur de QR code (même l'appareil photo d'un secouriste). */
function texteUrgence(p: Profil, contacts: Contact[]) {
  const prio = contacts.filter((x) => x.prioritaire && x.telephone).map((x) => `${x.nom} ${x.telephone}`);
  return [
    'URGENCE - CARTE DE VIE',
    `${p.prenom} ${p.nom}`.trim(),
    p.naissance && `Né(e) le ${p.naissance}`,
    p.groupeSanguin && `Groupe sanguin : ${p.groupeSanguin}`,
    p.allergies && `ALLERGIES : ${p.allergies}`,
    p.traitements && `Traitements : ${p.traitements}`,
    p.antecedents && `Antécédents : ${p.antecedents}`,
    p.poids && `Poids : ${p.poids} kg`,
    p.langues && `Langues : ${p.langues}`,
    p.personneConfiance && `Prévenir : ${p.personneConfiance}`,
    ...prio.map((x) => `Contact : ${x}`),
    p.notes && `Notes : ${p.notes}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function CarteUrgence() {
  const [profil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const [contacts] = useStored<Contact[]>(KEYS.contacts, []);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [enCours, setEnCours] = useState(false);

  const { width, height } = Dimensions.get('window');
  const w = width - 32;
  const h = (w * height) / width;
  const prio = contacts.filter((x) => x.prioritaire && x.telephone);

  const enregistrer = async () => {
    setEnCours(true);
    try {
      const perm = await requestPermissionsAsync(true);
      if (!perm.granted) throw new Error('Permission refusée pour enregistrer dans les photos.');
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: width * 3, height: height * 3 });
      await Asset.create(uri);
      Alert.alert('Enregistré', 'Image ajoutée à tes photos. Définis-la comme fond d’écran de VERROUILLAGE.');
    } catch (e) {
      Alert.alert('Erreur', String(e instanceof Error ? e.message : e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Ecran>
      <Texte muted>Aperçu. Les infos du haut restent libres pour l’horloge de l’écran verrouillé.</Texte>
      <View ref={ref} collapsable={false} style={[st.fond, { width: w, height: h }]}>
        <View style={{ flex: 1 }} />
        <View style={st.bloc}>
          <Text style={st.titre}>EN CAS D’URGENCE</Text>
          <Text style={st.nom}>{`${profil.prenom} ${profil.nom}`.trim() || 'Nom non renseigné'}</Text>
          {profil.naissance ? <Text style={st.ligne}>Né(e) le {profil.naissance}</Text> : null}
          {profil.groupeSanguin ? <Text style={st.sang}>Groupe sanguin : {profil.groupeSanguin}</Text> : null}
          {profil.allergies ? <Text style={st.alerte}>ALLERGIES : {profil.allergies}</Text> : null}
          {profil.antecedents ? <Text style={st.ligne}>{profil.antecedents}</Text> : null}
          {prio.slice(0, 2).map((x) => (
            <Text key={x.id} style={st.ligne}>
              ☎ {x.nom} : {x.telephone}
            </Text>
          ))}
          <View style={st.qr}>
            <QRCode value={texteUrgence(profil, contacts)} size={w * 0.32} ecl="M" />
            <Text style={[st.ligne, { flex: 1 }]}>Scannez pour la fiche médicale complète</Text>
          </View>
        </View>
      </View>
      <Bouton label={enCours ? 'Enregistrement…' : 'Enregistrer dans mes photos'} icone="download" onPress={enregistrer} />
    </Ecran>
  );
}

const st = StyleSheet.create({
  fond: { backgroundColor: '#000', borderRadius: 16, padding: 16, alignSelf: 'center' },
  bloc: { backgroundColor: '#111', borderRadius: 12, borderWidth: 2, borderColor: '#ef4444', padding: 12, gap: 3, marginBottom: '18%' },
  titre: { color: '#ef4444', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  nom: { color: '#fff', fontWeight: '800', fontSize: 18 },
  ligne: { color: '#ddd', fontSize: 12 },
  sang: { color: '#fff', fontSize: 14, fontWeight: '700' },
  alerte: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  qr: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, backgroundColor: '#fff', padding: 6, borderRadius: 8 },
});
