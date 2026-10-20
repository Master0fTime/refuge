import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Bouton, Carte, Champ, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { geoUri, parseCoords } from '@/lib/geo';
import { nouvelId } from '@/lib/id';
import { encoder, texteGroupe } from '@/lib/partage';
import { positionActuelle } from '@/lib/position';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import type { Groupe, PlanGroupe } from '@/lib/types';

export default function GroupeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [groupes, setGroupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const g = groupes.find((x) => x.id === id);

  const [nomPt, setNomPt] = useState('');
  const [notePt, setNotePt] = useState('');
  const [coords, setCoords] = useState('');
  const [qr, setQr] = useState(false);

  if (!g) {
    return (
      <Ecran>
        <Texte>Groupe introuvable.</Texte>
      </Ecran>
    );
  }

  const maj = (patch: Partial<Groupe>) =>
    setGroupes(groupes.map((x) => (x.id === g.id ? { ...x, ...patch, majLe: Date.now() } : x)));
  const majPlan = (k: keyof PlanGroupe) => (v: string) => maj({ plan: { ...g.plan, [k]: v } });

  const ici = async () => {
    try {
      const p = await positionActuelle();
      setCoords(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`);
    } catch (e) {
      Alert.alert('Position', String(e instanceof Error ? e.message : e));
    }
  };

  const ajouterPoint = () => {
    const pos = parseCoords(coords);
    if (!nomPt.trim() || !pos) {
      Alert.alert('Point incomplet', 'Il faut un nom et des coordonnées valides (ex. 48.8566, 2.3522).');
      return;
    }
    maj({ points: [...g.points, { id: nouvelId(), nom: nomPt.trim(), note: notePt.trim(), ...pos, ordre: g.points.length + 1 }] });
    setNomPt('');
    setNotePt('');
    setCoords('');
  };

  const supprimerPoint = (pid: string) =>
    maj({ points: g.points.filter((p) => p.id !== pid).map((p, i) => ({ ...p, ordre: i + 1 })) });

  const supprimerGroupe = () =>
    Alert.alert('Supprimer le groupe', 'Le groupe sera supprimé de CE téléphone seulement.', [
      { text: 'Annuler' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          router.back();
          setGroupes(groupes.filter((x) => x.id !== g.id));
        },
      },
    ]);

  const points = [...g.points].sort((a, b) => a.ordre - b.ordre);

  return (
    <Ecran>
      <Stack.Screen options={{ title: g.nom }} />

      <Sous>Partager avec le groupe</Sous>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label={qr ? 'Masquer le QR' : 'QR code'} icone="qr-code" onPress={() => setQr(!qr)} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label="Texte / SMS" icone="chatbubble" discret onPress={() => Share.share({ message: texteGroupe(g) })} />
        </View>
      </View>
      {qr && (
        <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 8 }}>
          <QRCode value={encoder({ t: 'g', g })} size={260} ecl="L" />
        </View>
      )}
      <Texte muted>Chaque membre scanne ce QR avec Refuge : il reçoit les points et le plan. Refais-le après chaque modification.</Texte>

      <Sous>Points de ralliement</Sous>
      {points.length === 0 && <Texte muted>Ajoutez au moins un point principal (proche) et un point de secours (plus loin).</Texte>}
      {points.map((p) => (
        <Carte key={p.id} couleur={p.ordre === 1 ? c.ok : c.accent}>
          <Titre>
            {p.ordre === 1 ? 'Point principal' : `Point de secours ${p.ordre - 1}`} : {p.nom}
          </Titre>
          {p.note ? <Texte>{p.note}</Texte> : null}
          <Texte muted>
            {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
          </Texte>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Bouton label="Y aller" icone="navigate" onPress={() => router.push({ pathname: '/rejoindre', params: { gid: g.id, pid: p.id } })} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton label="Carte" icone="map" discret onPress={() => Linking.openURL(geoUri(p.lat, p.lon, p.nom)).catch(() => Alert.alert('Aucune appli de cartes', 'Installe Organic Maps ou OsmAnd (cartes hors ligne gratuites).'))} />
            </View>
          </View>
          <Bouton label="Supprimer ce point" discret onPress={() => supprimerPoint(p.id)} />
        </Carte>
      ))}
      <Carte>
        <Champ label="Nom du point" placeholder="ex. Chez mamie, Parking du stade…" value={nomPt} onChangeText={setNomPt} />
        <Champ label="Repère / note" placeholder="ex. Devant la grille verte" value={notePt} onChangeText={setNotePt} />
        <Champ label="Coordonnées (lat, lon)" placeholder="48.8566, 2.3522" value={coords} onChangeText={setCoords} />
        <Bouton label="Utiliser ma position actuelle" icone="locate" discret onPress={ici} />
        <Bouton label="Ajouter le point" icone="add" onPress={ajouterPoint} />
      </Carte>

      <Sous>Notre plan si ça tourne mal</Sous>
      <Champ
        label="Consignes (dans l’ordre)"
        multiline
        placeholder={'ex. 1. Sans nouvelles sous 6 h → point principal.\n2. Personne au bout de 24 h → point de secours.\n3. Laisser un mot sous le paillasson.'}
        value={g.plan.consignes}
        onChangeText={majPlan('consignes')}
      />
      <Champ label="Radio (canal, sous-code)" placeholder="ex. PMR canal 8, sans sous-code" value={g.plan.canalRadio} onChangeText={majPlan('canalRadio')} />
      <Champ label="Heures de vacation radio" placeholder="ex. 5 min à chaque heure pleine" value={g.plan.vacations} onChangeText={majPlan('vacations')} />
      <Champ label="Mot de passe du groupe (pour se reconnaître)" value={g.plan.motCode} onChangeText={majPlan('motCode')} />
      <Bouton label="Conseils pour bien faire un plan" icone="book" discret onPress={() => router.push('/fiche/comms-plan')} />

      <Sous>Membres ({g.membres.length})</Sous>
      {g.membres.map((m) => (
        <Texte key={m.id}>
          • {m.nom}
          {m.telephone ? ` · ${m.telephone}` : ''}
        </Texte>
      ))}

      <Bouton label="Supprimer le groupe" icone="trash" couleur={c.danger} onPress={supprimerGroupe} />
    </Ecran>
  );
}
