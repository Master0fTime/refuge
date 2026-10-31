import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Bouton, Carte, Champ, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { geoUri, parseCoords } from '@/lib/geo';
import { nouvelId } from '@/lib/id';
import { encoder, texteGroupe } from '@/lib/partage';
import { positionActuelle } from '@/lib/position';
import { signalerModification } from '@/lib/maillage';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { profilVide, type Groupe, type Membre, type PlanGroupe, type Profil } from '@/lib/types';
import { t } from '@/i18n';

export default function GroupeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [groupes, setGroupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const g = groupes.find((x) => x.id === id);

  const [nomPt, setNomPt] = useState('');
  const [notePt, setNotePt] = useState('');
  const [coords, setCoords] = useState('');
  const [qr, setQr] = useState(false);
  const [profil, setProfil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const [prenom, setPrenom] = useState('');
  const [edition, setEdition] = useState<string | null>(null);

  if (!g) {
    return (
      <Ecran>
        <Texte>{t("Groupe introuvable.")}</Texte>
      </Ecran>
    );
  }

  const maj = (patch: Partial<Groupe>) => {
    setGroupes(groupes.map((x) => (x.id === g.id ? { ...x, ...patch, majLe: Date.now() } : x)));
    signalerModification(g.id); // les autres téléphones du groupe reçoivent la mise à jour par Bluetooth
  };
  // Surnom local : ne change pas `majLe` et ne part pas chez les autres.
  const renommerMembre = (m: Membre, surnom: string) =>
    setGroupes(groupes.map((x) => (x.id === g.id ? { ...x, membres: x.membres.map((y) => (y.id === m.id ? { ...y, surnom: surnom || undefined } : y)) } : x)));
  const enregistrerPrenom = () => {
    if (!prenom.trim()) return;
    setProfil({ ...profil, prenom: prenom.trim() });
    signalerModification(g.id);
  };
  const majPlan = (k: keyof PlanGroupe) => (v: string) => maj({ plan: { ...g.plan, [k]: v } });

  const ici = async () => {
    try {
      const p = await positionActuelle();
      setCoords(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`);
    } catch (e) {
      Alert.alert(t("Position"), String(e instanceof Error ? e.message : e));
    }
  };

  const ajouterPoint = () => {
    const pos = parseCoords(coords);
    if (!nomPt.trim() || !pos) {
      Alert.alert(t("Point incomplet"), t("Il faut un nom et des coordonnées valides (ex. 48.8566, 2.3522)."));
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
    Alert.alert(t("Supprimer le groupe"), t("Le groupe sera supprimé de CE téléphone seulement."), [
      { text: t("Annuler") },
      {
        text: t("Supprimer"),
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
      {!profil.prenom.trim() && (
        <Carte couleur={c.accent}>
          <Texte>{t('Ton prénom, pour que ton groupe sache qui écrit :')}</Texte>
          <Champ label={t('Prénom')} value={prenom} onChangeText={setPrenom} onSubmitEditing={enregistrerPrenom} />
          <Bouton label={t('Enregistrer')} icone="checkmark" onPress={enregistrerPrenom} />
        </Carte>
      )}

      <Bouton label={t('Discuter sans réseau (Bluetooth)')} icone="bluetooth" grand onPress={() => router.push(`/discussion/${g.id}`)} />

      <Sous>{t("Partager avec le groupe")}</Sous>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label={qr ? t("Masquer le QR") : t("QR code")} icone="qr-code" onPress={() => setQr(!qr)} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label={t("Texte / SMS")} icone="chatbubble" discret onPress={() => Share.share({ message: texteGroupe(g) })} />
        </View>
      </View>
      {qr && (
        <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 8 }}>
          <QRCode value={encoder({ t: 'g', g })} size={260} ecl="L" />
        </View>
      )}
      <Texte muted>{t("Chaque membre scanne ce QR avec Refuge : il reçoit les points et le plan. Refais-le après chaque modification.")}</Texte>

      <Sous>{t("Points de ralliement")}</Sous>
      {points.length === 0 && <Texte muted>{t("Ajoutez au moins un point principal (proche) et un point de secours (plus loin).")}</Texte>}
      {points.map((p) => (
        <Carte key={p.id} couleur={p.ordre === 1 ? c.ok : c.accent}>
          <Titre>
            {p.ordre === 1 ? t("Point principal") : t("Point de secours {v1}", { v1: p.ordre - 1 })} : {p.nom}
          </Titre>
          {p.note ? <Texte>{p.note}</Texte> : null}
          <Texte muted>
            {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
          </Texte>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Bouton label={t("Y aller")} icone="navigate" onPress={() => router.push({ pathname: '/rejoindre', params: { gid: g.id, pid: p.id } })} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton label={t("Carte")} icone="map" discret onPress={() => Linking.openURL(geoUri(p.lat, p.lon, p.nom)).catch(() => Alert.alert(t("Aucune appli de cartes"), t("Installe Organic Maps ou OsmAnd (cartes hors ligne gratuites).")))} />
            </View>
          </View>
          <Bouton label={t("Supprimer ce point")} discret onPress={() => supprimerPoint(p.id)} />
        </Carte>
      ))}
      <Carte>
        <Champ label={t("Nom du point")} placeholder={t("ex. Chez mamie, Parking du stade…")} value={nomPt} onChangeText={setNomPt} />
        <Champ label={t("Repère / note")} placeholder={t("ex. Devant la grille verte")} value={notePt} onChangeText={setNotePt} />
        <Champ label={t("Coordonnées (lat, lon)")} placeholder="48.8566, 2.3522" value={coords} onChangeText={setCoords} />
        <Bouton label={t("Utiliser ma position actuelle")} icone="locate" discret onPress={ici} />
        <Bouton label={t("Ajouter le point")} icone="add" onPress={ajouterPoint} />
      </Carte>

      <Sous>{t("Notre plan si ça tourne mal")}</Sous>
      <Champ
        label={t("Consignes (dans l’ordre)")}
        multiline
        placeholder={t("ex. 1. Sans nouvelles sous 6 h → point principal.\n2. Personne au bout de 24 h → point de secours.\n3. Laisser un mot sous le paillasson.")}
        value={g.plan.consignes}
        onChangeText={majPlan('consignes')}
      />
      <Champ label={t("Radio (canal, sous-code)")} placeholder={t("ex. PMR canal 8, sans sous-code")} value={g.plan.canalRadio} onChangeText={majPlan('canalRadio')} />
      <Champ label={t("Heures de vacation radio")} placeholder={t("ex. 5 min à chaque heure pleine")} value={g.plan.vacations} onChangeText={majPlan('vacations')} />
      <Champ label={t("Mot de passe du groupe (pour se reconnaître)")} value={g.plan.motCode} onChangeText={majPlan('motCode')} />
      <Bouton label={t("Conseils pour bien faire un plan")} icone="book" discret onPress={() => router.push('/fiche/comms-plan')} />

      <Sous>{t("Membres (")}{g.membres.length})</Sous>
      <Texte muted>{t('Touche un membre pour lui donner un nom (visible seulement sur ton téléphone). La liste se met à jour toute seule quand vos téléphones se croisent en Bluetooth.')}</Texte>
      {g.membres.map((m) =>
        edition === m.id ? (
          <Champ
            key={m.id}
            label={t('Nom affiché pour ce membre')}
            defaultValue={m.surnom ?? (m.nom === 'Sans nom' ? '' : m.nom)}
            autoFocus
            onEndEditing={(e) => {
              renommerMembre(m, e.nativeEvent.text.trim());
              setEdition(null);
            }}
          />
        ) : (
          <Pressable key={m.id} disabled={m.id === profil.id} onPress={() => setEdition(m.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
            <Text style={{ color: c.text, fontSize: 17, flex: 1 }}>
              • {m.id === profil.id ? t('{nom} (toi)', { nom: profil.prenom.trim() || t('Moi') }) : m.surnom || m.nom}
              {m.telephone ? <Text style={{ color: c.muted }}>{` · ${m.telephone}`}</Text> : null}
            </Text>
            {m.id !== profil.id && <Text style={{ color: c.accent, fontWeight: '700' }}>{t('Renommer')}</Text>}
          </Pressable>
        ),
      )}

      <Bouton label={t("Supprimer le groupe")} icone="trash" couleur={c.danger} onPress={supprimerGroupe} />
    </Ecran>
  );
}
