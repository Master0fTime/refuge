import { Ionicons } from '@expo/vector-icons';
import { Camera, Map, Marker, NativeUserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bouton } from '@/components/ui';
import { cartesPretes, centrePays, STYLE_CARTE } from '@/lib/cartes';
import { geoUri } from '@/lib/geo';
import { nouvelId } from '@/lib/id';
import { usePays } from '@/lib/pays';
import { positionActuelle } from '@/lib/position';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import type { Groupe } from '@/lib/types';
import { t } from '@/i18n';

type Repere = { id: string; nom: string; lat: number; lon: number };
type Point = Repere & { type: 'ralliement' | 'repere' | 'recu'; groupe?: string };

export default function Carte() {
  // Ouverte depuis une position reçue dans la discussion : on montre ce point.
  const params = useLocalSearchParams<{ lat?: string; lon?: string; nom?: string }>();
  const recu: Point | null =
    params.lat && params.lon && !isNaN(Number(params.lat))
      ? { id: 'recu', nom: params.nom ?? t('Position reçue'), lat: Number(params.lat), lon: Number(params.lon), type: 'recu' }
      : null;
  const [pays] = usePays();
  const [groupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const [reperes, setReperes] = useStored<Repere[]>(KEYS.reperes, []);
  const [pret, setPret] = useState<boolean | null>(null);
  const [moi, setMoi] = useState<[number, number] | null>(null);
  const [selection, setSelection] = useState<Point | null>(null);
  const camera = useRef<CameraRef>(null);
  const dejaCentre = useRef(!!recu);

  useEffect(() => {
    if (!recu) return;
    setSelection(recu);
    const minuteur = setTimeout(() => camera.current?.flyTo({ center: [recu.lon, recu.lat], zoom: 15, duration: 800 }), 400);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.lat, params.lon]);

  useFocusEffect(
    useCallback(() => {
      cartesPretes().then(setPret);
      positionActuelle()
        .then((p) => {
          const lngLat: [number, number] = [p.coords.longitude, p.coords.latitude];
          setMoi(lngLat);
          // Première position connue : on y centre la carte une seule fois.
          if (!dejaCentre.current) {
            dejaCentre.current = true;
            camera.current?.flyTo({ center: lngLat, zoom: 14, duration: 800 });
          }
        })
        .catch(() => {});
    }, []),
  );

  const points: Point[] = [
    ...groupes.flatMap((g) => g.points.map((p) => ({ id: p.id, nom: `${p.ordre === 1 ? '★ ' : ''}${p.nom}`, lat: p.lat, lon: p.lon, type: 'ralliement' as const, groupe: g.nom }))),
    ...reperes.map((r) => ({ ...r, type: 'repere' as const })),
    ...(recu ? [recu] : []),
  ];

  const ajouterRepere = (lngLat: [number, number]) => {
    const r: Repere = { id: nouvelId(), nom: t("Repère {v1}", { v1: reperes.length + 1 }), lon: lngLat[0], lat: lngLat[1] };
    setReperes([...reperes, r]);
    setSelection({ ...r, type: 'repere' });
  };

  const renommer = (nom: string) => {
    if (!selection) return;
    setSelection({ ...selection, nom });
    setReperes(reperes.map((r) => (r.id === selection.id ? { ...r, nom } : r)));
  };

  const supprimer = () => {
    if (!selection) return;
    setReperes(reperes.filter((r) => r.id !== selection.id));
    setSelection(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Map style={{ flex: 1 }} mapStyle={STYLE_CARTE} onLongPress={(e) => ajouterRepere(e.nativeEvent.lngLat)} onPress={() => setSelection(null)}>
        <Camera ref={camera} initialViewState={{ center: centrePays(pays.code), zoom: 6 }} />
        <NativeUserLocation />
        {points.map((p) => (
          <Marker key={p.id} id={p.id} lngLat={[p.lon, p.lat]} onPress={() => setSelection(p)}>
            <View style={[st.pastille, { backgroundColor: p.type === 'ralliement' ? c.ok : p.type === 'recu' ? c.info : c.accent }]}>
              <Ionicons name={p.type === 'ralliement' ? 'flag' : p.type === 'recu' ? 'person' : 'location'} size={16} color="#000" />
            </View>
          </Marker>
        ))}
      </Map>

      {pret === false && (
        <View style={st.bandeau}>
          <Text style={st.bandeauTxt}>{t("Aucune carte enregistrée : sans Internet, la carte restera vide.")}</Text>
          <Bouton label={t("Télécharger les cartes")} icone="download" onPress={() => router.push('/cartes')} />
        </View>
      )}

      <View style={st.boutons}>
        <Pressable style={st.rond} onPress={() => moi && camera.current?.flyTo({ center: moi, zoom: 15, duration: 600 })}>
          <Ionicons name="locate" size={26} color={moi ? c.info : c.muted} />
        </Pressable>
        <Pressable style={st.rond} onPress={() => router.push('/cartes')}>
          <Ionicons name="cloud-download" size={24} color={c.text} />
        </Pressable>
      </View>

      {selection ? (
        <View style={st.fiche}>
          {selection.type === 'repere' ? (
            <TextInput value={selection.nom} onChangeText={renommer} style={st.nomEdit} placeholder={t("Nom du repère")} placeholderTextColor={c.muted} />
          ) : (
            <Text style={st.nom}>{selection.nom}</Text>
          )}
          <Text style={st.sous}>
            {selection.type === 'ralliement'
              ? t("Point de ralliement · {groupe}", { groupe: selection.groupe })
              : selection.type === 'recu'
                ? t('Position reçue')
                : t("Mon repère")}{' '}
            · {selection.lat.toFixed(5)}, {selection.lon.toFixed(5)}
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 2 }}>
              <Bouton
                label={t("Y aller")}
                icone="navigate"
                onPress={() => router.push({ pathname: '/rejoindre', params: { lat: String(selection.lat), lon: String(selection.lon), nom: selection.nom } })}
              />
            </View>
            {selection.type === 'repere' && (
              <View style={{ flex: 1 }}>
                <Bouton label={t("Supprimer")} discret onPress={supprimer} />
              </View>
            )}
            {selection.type !== 'repere' && (
              <View style={{ flex: 1 }}>
                <Bouton label={t('Autre appli')} icone="open" discret onPress={() => Linking.openURL(geoUri(selection.lat, selection.lon, selection.nom)).catch(() => {})} />
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={st.aide}>{t("Appui long sur la carte pour ajouter un repère")}</Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  pastille: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  bandeau: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: c.card, borderRadius: 12, padding: space.md, gap: space.sm },
  bandeauTxt: { color: c.text, fontSize: 15 },
  boutons: { position: 'absolute', right: 12, bottom: 110, gap: 10 },
  rond: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  fiche: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: c.card, borderRadius: 14, padding: space.lg, gap: space.sm },
  nom: { color: c.text, fontSize: 18, fontWeight: '700' },
  nomEdit: { color: c.text, fontSize: 18, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 4 },
  sous: { color: c.muted, fontSize: 14 },
  aide: { position: 'absolute', bottom: 16, alignSelf: 'center', color: '#000', backgroundColor: '#ffffffcc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', fontSize: 13 },
});
