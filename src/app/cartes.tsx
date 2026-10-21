import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Carte, Ecran, Sous, Texte } from '@/components/ui';
import { packs, supprimerZone, tailleEstimee, telechargerZone, zoneAutour, zonePays, type InfosPack, type Zone } from '@/lib/cartes';
import { formatTaille } from '@/lib/ia/modeles';
import { usePays } from '@/lib/pays';
import { positionActuelle } from '@/lib/position';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import type { Groupe } from '@/lib/types';

export default function Cartes() {
  useKeepAwake();
  const [pays] = usePays();
  const [groupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const [liste, setListe] = useState<InfosPack[]>([]);
  const [enCours, setEnCours] = useState<{ nom: string; pourcentage: number } | null>(null);

  const rafraichir = useCallback(() => {
    packs().then(setListe).catch(() => setListe([]));
  }, []);
  useEffect(rafraichir, [rafraichir]);

  const telecharger = async (z: Zone) => {
    if (enCours) return;
    setEnCours({ nom: z.nom, pourcentage: 0 });
    try {
      await telechargerZone(z, (p) => setEnCours({ nom: z.nom, pourcentage: p }));
      Alert.alert('Carte enregistrée', `« ${z.nom} » fonctionne maintenant sans Internet.`);
    } catch (e) {
      Alert.alert('Téléchargement interrompu', `${e instanceof Error ? e.message : e}\nVérifie ta connexion et réessaie : ce qui est déjà téléchargé est conservé.`);
    } finally {
      setEnCours(null);
      rafraichir();
    }
  };

  const maZone = async () => {
    try {
      const p = await positionActuelle();
      telecharger(zoneAutour('Ma zone (15 km autour de moi)', p.coords.latitude, p.coords.longitude));
    } catch (e) {
      Alert.alert('Position', String(e instanceof Error ? e.message : e));
    }
  };

  const supprimer = (p: InfosPack) =>
    Alert.alert('Supprimer', `Supprimer « ${p.nom} » (${formatTaille(p.taille)}) ?`, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => supprimerZone(p.id).then(rafraichir) },
    ]);

  const pz = zonePays(pays);
  const pointsGroupe = groupes.flatMap((g) => g.points.map((p) => ({ ...p, groupe: g.nom })));

  return (
    <Ecran>
      <Texte muted>
        Télécharge tes cartes MAINTENANT, en Wi-Fi. Ensuite, elles fonctionnent sans Internet, avec ta position GPS. Cartes © OpenStreetMap,
        OpenFreeMap.
      </Texte>

      {enCours && (
        <Carte couleur={c.accent}>
          <Texte>Téléchargement : {enCours.nom}</Texte>
          <View style={{ height: 10, backgroundColor: c.cardAlt, borderRadius: 5, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(enCours.pourcentage)}%`, height: '100%', backgroundColor: c.accent }} />
          </View>
          <Texte muted>{Math.round(enCours.pourcentage)} % · garde l’appli ouverte</Texte>
        </Carte>
      )}

      <Sous>Ajouter une carte</Sous>
      <Carte>
        <Texte>Ma zone : 15 km autour de moi, rues en détail.</Texte>
        <Texte muted>Environ {formatTaille(tailleEstimee(zoneAutour('', 46.5, 7)))}</Texte>
        <Bouton label="Télécharger ma zone" icone="locate" onPress={maZone} />
      </Carte>
      <Carte>
        <Texte>
          {pays.drapeau} {pz.nom} : routes, villes et villages, pour s’orienter à grande échelle.
        </Texte>
        <Texte muted>Environ {formatTaille(tailleEstimee(pz))}</Texte>
        <Bouton label={`Télécharger : ${pays.nom}`} icone="map" discret onPress={() => telecharger(pz)} />
      </Carte>
      {pointsGroupe.map((p) => (
        <Carte key={p.id}>
          <Texte>
            Autour de « {p.nom} » ({p.groupe}) : 15 km, rues en détail.
          </Texte>
          <Bouton label="Télécharger cette zone" icone="flag" discret onPress={() => telecharger(zoneAutour(`Autour de ${p.nom}`, p.lat, p.lon))} />
        </Carte>
      ))}

      <Sous>Cartes enregistrées</Sous>
      {liste.length === 0 && <Texte muted>Aucune pour l’instant.</Texte>}
      {liste.map((p) => (
        <Carte key={p.id} couleur={p.termine ? c.ok : c.accent}>
          <Texte>{p.nom}</Texte>
          <Texte muted>
            {formatTaille(p.taille)} · {p.termine ? 'prête hors ligne ✓' : `${Math.round(p.pourcentage)} % (incomplète)`}
          </Texte>
          <Bouton label="Supprimer" icone="trash" discret onPress={() => supprimer(p)} />
        </Carte>
      ))}
    </Ecran>
  );
}
