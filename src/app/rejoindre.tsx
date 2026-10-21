import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Carte, Ecran, Texte, Titre } from '@/components/ui';
import { cap, distance, formatDistance, pointCardinal } from '@/lib/geo';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import type { Groupe } from '@/lib/types';

export default function Rejoindre() {
  useKeepAwake();
  // Soit un point de ralliement (gid + pid), soit n'importe quel point de la carte (lat, lon, nom).
  const { gid, pid, lat, lon, nom } = useLocalSearchParams<{ gid?: string; pid?: string; lat?: string; lon?: string; nom?: string }>();
  const [groupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const point =
    groupes.find((g) => g.id === gid)?.points.find((p) => p.id === pid) ??
    (lat && lon ? { nom: nom ?? 'Point', note: '', lat: Number(lat), lon: Number(lon) } : undefined);

  const [pos, setPos] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const subs: Location.LocationSubscription[] = [];
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return setErreur('Autorise la localisation pour te guider.');
      subs.push(await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3 }, setPos));
      subs.push(await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading)));
    })().catch((e) => setErreur(String(e)));
    return () => subs.forEach((s) => s.remove());
  }, []);

  if (!point) {
    return (
      <Ecran>
        <Texte>Point introuvable.</Texte>
      </Ecran>
    );
  }

  const d = pos ? distance(pos.coords.latitude, pos.coords.longitude, point.lat, point.lon) : null;
  const b = pos ? cap(pos.coords.latitude, pos.coords.longitude, point.lat, point.lon) : null;
  const rotation = b !== null && heading !== null ? b - heading : null;

  return (
    <Ecran>
      <Titre>{point.nom}</Titre>
      {point.note ? <Texte muted>{point.note}</Texte> : null}
      {erreur ? <Texte>{erreur}</Texte> : null}

      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View style={{ transform: [{ rotate: `${rotation ?? 0}deg` }], opacity: rotation === null ? 0.3 : 1 }}>
          <Ionicons name="arrow-up-circle" size={220} color={c.accent} />
        </View>
        <Text style={{ color: c.text, fontSize: 44, fontWeight: '800' }}>{d !== null ? formatDistance(d) : '…'}</Text>
        {b !== null && (
          <Text style={{ color: c.muted, fontSize: 18 }}>
            Cap {Math.round(b)}° ({pointCardinal(b)})
          </Text>
        )}
      </View>

      <Carte>
        <Texte>La flèche indique la direction à vol d’oiseau. Tiens le téléphone à plat, loin des objets métalliques.</Texte>
        <Texte muted>
          Précision GPS : {pos?.coords.accuracy ? `±${Math.round(pos.coords.accuracy)} m` : 'recherche des satellites…'}. Fonctionne sans Internet ; dehors, c’est plus rapide.
        </Texte>
      </Carte>
    </Ecran>
  );
}
