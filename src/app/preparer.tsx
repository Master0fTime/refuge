import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import * as Network from 'expo-network';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Bouton, Carte, Ecran, Ligne, Sous, Texte, Titre } from '@/components/ui';
import { espaceLibre, finaliser, formatTaille, MODELES, preparerDossier, telecharger } from '@/lib/ia/modeles';
import { tailleEstimee, telechargerZone, zonePays } from '@/lib/cartes';
import { packPret, packs, type Pack } from '@/lib/packs';
import { useLangue } from '@/lib/langue';
import { usePays } from '@/lib/pays';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

export default function Preparer() {
  useKeepAwake(); // l'écran ne doit pas s'éteindre pendant un long téléchargement
  const [actif, setActif] = useStored<string | null>(KEYS.modele, null);
  const liste = packs();
  const [pays] = usePays();
  const [langue] = useLangue();
  const [prets, setPrets] = useState<Record<string, boolean>>({});
  const [progres, setProgres] = useState<Record<string, number>>({});
  const [enCours, setEnCours] = useState<string | null>(null);
  const [libre, setLibre] = useState<number | null>(null);
  const [wifi, setWifi] = useState<boolean | null>(null);

  const rafraichir = useCallback(async () => {
    const r: Record<string, boolean> = {};
    for (const p of liste) r[p.id] = await packPret(p);
    setPrets(r);
    setLibre(await espaceLibre());
    const n = await Network.getNetworkStateAsync();
    setWifi(n.type === Network.NetworkStateType.WIFI || n.type === Network.NetworkStateType.ETHERNET);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  const aInstaller = liste.filter((p) => p.disponible && p.fichier && !prets[p.id]);
  const carteAFaire = prets.cartes === false;
  const total = aInstaller.reduce((s, p) => s + (p.fichier?.octets ?? 0), 0) + (carteAFaire ? tailleEstimee(zonePays(pays)) : 0);
  const toutPret = liste.filter((p) => p.disponible).every((p) => prets[p.id]);

  const installerTout = async () => {
    if (libre !== null && libre < total * 1.1) {
      Alert.alert(t("Pas assez de place"), t("Il faut {v1} libres, il reste {v2}. Libère de la place (photos, vidéos) puis réessaie.", { v1: formatTaille(total), v2: formatTaille(libre) }));
      return;
    }
    await preparerDossier();
    for (const p of aInstaller) {
      const f = p.fichier!;
      setEnCours(p.id);
      try {
        const tache = telecharger(f, (x) => setProgres((pr) => ({ ...pr, [p.id]: x })));
        const r = await tache.downloadAsync();
        if (!r) throw new Error(t("Téléchargement interrompu."));
        await finaliser(f);
        if (p.id === 'ia' && !actif) setActif(MODELES.find((m) => m.fichier === f.fichier)?.id ?? null);
        setPrets((x) => ({ ...x, [p.id]: true }));
      } catch (e) {
        setEnCours(null);
        Alert.alert(t("Téléchargement interrompu"), t("{nom} : {v2}\nVérifie ta connexion puis appuie à nouveau sur le bouton.", { nom: t(p.nom), v2: e instanceof Error ? e.message : e }));
        return;
      }
    }
    if (carteAFaire) {
      setEnCours('cartes');
      try {
        await telechargerZone(zonePays(pays), (x) => setProgres((pr) => ({ ...pr, cartes: x / 100 })));
      } catch (e) {
        Alert.alert(t("Carte interrompue"), t("{v1}\nRéessaie depuis l’onglet Carte.", { v1: e instanceof Error ? e.message : e }));
      }
    }
    setEnCours(null);
    await rafraichir();
  };

  const lancer = () => {
    if (wifi === false) {
      Alert.alert(t("Pas de Wi-Fi"), t("Tu vas télécharger {v1} avec tes données mobiles. Continuer ?", { v1: formatTaille(total) }), [
        { text: t("Annuler") },
        { text: t("Continuer"), onPress: installerTout },
      ]);
    } else installerTout();
  };

  return (
    <Ecran>
      <Titre>{toutPret ? t("Ton téléphone est prêt ✅") : t("Prépare ton téléphone")}</Titre>
      <Texte muted>
        {toutPret
          ? t("Tout ce qui est disponible est installé. Refuge fonctionne maintenant sans Internet.")
          : t("À faire UNE FOIS, maintenant, pendant qu’Internet fonctionne. Ensuite, tout marche hors ligne.")}
      </Texte>

      <Ligne
        titre={t("Pays : {drapeau} {nom} · Langue : {drapeau3} {nom4}", { drapeau: pays.drapeau, nom: t(pays.nom), drapeau3: langue.drapeau, nom4: langue.nom })}
        sous={t("Numéros d’urgence, alertes, langue de l’IA et de la voix. Touche pour changer.")}
        icone="flag"
        onPress={() => router.push('/pays')}
      />

      {liste.map((p) => (
        <LignePack key={p.id} p={p} pret={!!prets[p.id]} progres={progres[p.id]} actif={enCours === p.id} taille={p.id === 'cartes' ? tailleEstimee(zonePays(pays)) : p.fichier?.octets} />
      ))}

      {!toutPret && (
        <>
          <Bouton
            label={enCours ? t("Installation en cours…") : t("Tout installer ({v1})", { v1: formatTaille(total) })}
            icone="download"
            grand
            onPress={() => !enCours && lancer()}
          />
          <Texte muted>
            {wifi === false ? t("⚠ Tu n’es pas en Wi-Fi. ") : ''}
            {t("Espace libre : ")}{libre !== null ? formatTaille(libre) : '…'}{t(". Laisse l’appli ouverte pendant le téléchargement.")}</Texte>
        </>
      )}

      <Bouton label={t("Ajouter la carte détaillée de ma zone")} icone="map" discret onPress={() => router.push('/cartes')} />

      <Sous>{t("Sans Internet")}</Sous>
      <Bouton label={t("Récupérer depuis un proche")} icone="phone-portrait" discret onPress={() => router.push('/recevoir')} />
      <Bouton label={t("Partager Refuge à mes proches")} icone="share-social" discret onPress={() => router.push('/partager')} />

      <Sous>{t("Mises à jour")}</Sous>
      <Ligne titre={t("Mises à jour de Refuge")} sous={t("Vérifier et installer en un bouton")} icone="refresh-circle" onPress={() => router.push('/mises-a-jour')} />

      <Bouton label={toutPret ? t("Commencer") : t("Plus tard")} discret={!toutPret} onPress={() => router.back()} />
    </Ecran>
  );
}

function LignePack({ p, pret, progres, actif, taille }: { p: Pack; pret: boolean; progres?: number; actif: boolean; taille?: number }) {
  const couleur = pret ? c.ok : p.disponible ? c.accent : c.muted;
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: space.lg, gap: 6, opacity: p.disponible ? 1 : 0.6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Ionicons name={p.icone} size={26} color={couleur} />
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', flex: 1 }}>{t(p.nom)}</Text>
        <Text style={{ color: couleur, fontWeight: '700' }}>
          {pret ? t("Installé") : !p.disponible ? t("Bientôt") : taille ? `≈ ${formatTaille(taille)}` : t("Inclus")}
        </Text>
      </View>
      <Texte muted>{t(p.utilite)}</Texte>
      {actif && (
        <View style={{ height: 8, backgroundColor: c.cardAlt, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round((progres ?? 0) * 100)}%`, height: '100%', backgroundColor: c.accent }} />
        </View>
      )}
    </View>
  );
}
