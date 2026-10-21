import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, Text, View } from 'react-native';
import { BoutonsStatut } from '@/components/BoutonsStatut';
import { Bouton, Carte, Champ, Ecran, Ligne, s, Sous, Texte } from '@/components/ui';
import { nouvelId } from '@/lib/id';
import { positionActuelle } from '@/lib/position';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { profilVide, type Contact, type Groupe, type Profil } from '@/lib/types';

export default function GroupeEcran() {
  const [profil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const [contacts, setContacts] = useStored<Contact[]>(KEYS.contacts, []);
  const [groupes, setGroupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const [nomGroupe, setNomGroupe] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const creerGroupe = () => {
    const nom = nomGroupe.trim();
    if (!nom) return;
    const g: Groupe = {
      id: nouvelId(),
      nom,
      points: [],
      plan: { consignes: '', canalRadio: '', vacations: '', motCode: '' },
      membres: [{ id: profil.id, nom: `${profil.prenom} ${profil.nom}`.trim() || 'Moi', telephone: profil.telephone || undefined }],
      majLe: Date.now(),
    };
    setGroupes([...groupes, g]);
    setNomGroupe('');
    router.push(`/groupe/${g.id}`);
  };

  const partagerPosition = async () => {
    setEnvoi(true);
    try {
      const pos = await positionActuelle();
      const { latitude: la, longitude: lo, accuracy } = pos.coords;
      const nom = profil.prenom || 'Moi';
      await Share.share({
        message: `${nom} : je suis ici → ${la.toFixed(5)}, ${lo.toFixed(5)} (±${Math.round(accuracy ?? 0)} m)\nhttps://www.openstreetmap.org/?mlat=${la.toFixed(5)}&mlon=${lo.toFixed(5)}#map=17/${la.toFixed(5)}/${lo.toFixed(5)}`,
      });
    } catch (e) {
      Alert.alert('Position', String(e instanceof Error ? e.message : e));
    } finally {
      setEnvoi(false);
    }
  };

  const basculerPrio = (id: string) =>
    setContacts(contacts.map((x) => (x.id === id ? { ...x, prioritaire: !x.prioritaire } : x)));

  const supprimerContact = (x: Contact) =>
    Alert.alert('Supprimer', `Retirer ${x.nom} de tes contacts ?`, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setContacts(contacts.filter((y) => y.id !== x.id)) },
    ]);

  const tries = [...contacts].sort((a, b) => Number(b.prioritaire) - Number(a.prioritaire) || a.nom.localeCompare(b.nom));

  return (
    <Ecran>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label="Mon QR" icone="qr-code" onPress={() => router.push('/mon-qr')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label="Scanner" icone="scan" onPress={() => router.push('/scanner')} />
        </View>
      </View>
      <BoutonsStatut />
      <Bouton label={envoi ? 'Localisation…' : 'Envoyer ma position (SMS…)'} icone="navigate" discret onPress={partagerPosition} />
      <Texte muted>
        Tout s’échange de téléphone à téléphone par QR code, sans Internet ni serveur. Faites-le maintenant, ensemble, pendant que tout va bien.
      </Texte>

      <Sous>Mes groupes et plans</Sous>
      {groupes.map((g) => (
        <Ligne
          key={g.id}
          titre={g.nom}
          sous={`${g.points.length} point(s) de ralliement · ${g.membres.length} membre(s)`}
          icone="people"
          onPress={() => router.push(`/groupe/${g.id}`)}
        />
      ))}
      <Carte>
        <Champ label="Nouveau groupe" placeholder="ex. Famille, Amis du quartier…" value={nomGroupe} onChangeText={setNomGroupe} />
        <Bouton label="Créer le groupe" icone="add" discret onPress={creerGroupe} />
      </Carte>

      <Sous>Mes contacts ({contacts.length})</Sous>
      {tries.length === 0 && <Texte muted>Scanne le QR code de tes proches pour les ajouter.</Texte>}
      {tries.map((x) => (
        <Pressable key={x.id} style={s.ligne} onLongPress={() => supprimerContact(x)}>
          <Pressable onPress={() => basculerPrio(x.id)} hitSlop={10}>
            <Ionicons name={x.prioritaire ? 'star' : 'star-outline'} size={26} color={c.accent} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.ligneTitre}>{x.nom}</Text>
            {x.telephone ? <Text style={s.ligneSous}>{x.telephone}</Text> : null}
          </View>
          {x.telephone ? (
            <>
              <Pressable onPress={() => Linking.openURL(`sms:${x.telephone}`)} hitSlop={10}>
                <Ionicons name="chatbubble" size={24} color={c.info} />
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`tel:${x.telephone}`)} hitSlop={10}>
                <Ionicons name="call" size={24} color={c.ok} />
              </Pressable>
            </>
          ) : null}
        </Pressable>
      ))}
      {tries.length > 0 && <Texte muted>★ = prioritaire (affiché sur ta carte d’urgence). Appui long pour supprimer.</Texte>}
    </Ecran>
  );
}
