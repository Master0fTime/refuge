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
import { t } from '@/i18n';

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
      Alert.alert(t("Carte enregistrée"), t("« {nom} » fonctionne maintenant sans Internet.", { nom: z.nom }));
    } catch (e) {
      Alert.alert(t("Téléchargement interrompu"), t("{v1}\nVérifie ta connexion et réessaie : ce qui est déjà téléchargé est conservé.", { v1: e instanceof Error ? e.message : e }));
    } finally {
      setEnCours(null);
      rafraichir();
    }
  };

  const maZone = async () => {
    try {
      const p = await positionActuelle();
      telecharger(zoneAutour(t("Ma zone (15 km autour de moi)"), p.coords.latitude, p.coords.longitude));
    } catch (e) {
      Alert.alert(t("Position"), String(e instanceof Error ? e.message : e));
    }
  };

  const supprimer = (p: InfosPack) =>
    Alert.alert(t("Supprimer"), t("Supprimer « {nom} » ({v2}) ?", { nom: p.nom, v2: formatTaille(p.taille) }), [
      { text: t("Annuler") },
      { text: t("Supprimer"), style: 'destructive', onPress: () => supprimerZone(p.id).then(rafraichir) },
    ]);

  const pz = zonePays(pays);
  const pointsGroupe = groupes.flatMap((g) => g.points.map((p) => ({ ...p, groupe: g.nom })));

  return (
    <Ecran>
      <Texte muted>
        {t("Télécharge tes cartes MAINTENANT, en Wi-Fi. Ensuite, elles fonctionnent sans Internet, avec ta position GPS. Cartes © OpenStreetMap, OpenFreeMap.")}</Texte>

      {enCours && (
        <Carte couleur={c.accent}>
          <Texte>{t("Téléchargement : ")}{enCours.nom}</Texte>
          <View style={{ height: 10, backgroundColor: c.cardAlt, borderRadius: 5, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(enCours.pourcentage)}%`, height: '100%', backgroundColor: c.accent }} />
          </View>
          <Texte muted>{Math.round(enCours.pourcentage)} {t(" % · garde l’appli ouverte")}</Texte>
        </Carte>
      )}

      <Sous>{t("Ajouter une carte")}</Sous>
      <Carte>
        <Texte>{t("Ma zone : 15 km autour de moi, rues en détail.")}</Texte>
        <Texte muted>{t("Environ ")}{formatTaille(tailleEstimee(zoneAutour('', 46.5, 7)))}</Texte>
        <Bouton label={t("Télécharger ma zone")} icone="locate" onPress={maZone} />
      </Carte>
      <Carte>
        <Texte>
          {pays.drapeau} {pz.nom} {t(" : routes, villes et villages, pour s’orienter à grande échelle.")}</Texte>
        <Texte muted>{t("Environ ")}{formatTaille(tailleEstimee(pz))}</Texte>
        <Bouton label={t("Télécharger : {nom}", { nom: t(pays.nom) })} icone="map" discret onPress={() => telecharger(pz)} />
      </Carte>
      {pointsGroupe.map((p) => (
        <Carte key={p.id}>
          <Texte>
            {t("Autour de « ")}{p.nom} » ({p.groupe}{t(") : 15 km, rues en détail.")}</Texte>
          <Bouton label={t("Télécharger cette zone")} icone="flag" discret onPress={() => telecharger(zoneAutour(t("Autour de {nom}", { nom: p.nom }), p.lat, p.lon))} />
        </Carte>
      ))}

      <Sous>{t("Cartes enregistrées")}</Sous>
      {liste.length === 0 && <Texte muted>{t("Aucune pour l’instant.")}</Texte>}
      {liste.map((p) => (
        <Carte key={p.id} couleur={p.termine ? c.ok : c.accent}>
          <Texte>{p.nom}</Texte>
          <Texte muted>
            {formatTaille(p.taille)} · {p.termine ? t("prête hors ligne ✓") : t("{v1} % (incomplète)", { v1: Math.round(p.pourcentage) })}
          </Texte>
          <Bouton label={t("Supprimer")} icone="trash" discret onPress={() => supprimer(p)} />
        </Carte>
      ))}
    </Ecran>
  );
}
