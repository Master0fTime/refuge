import { CameraView, useCameraPermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Carte, Champ, Ecran, Texte, Titre } from '@/components/ui';
import { chemin, estInstalle, finaliser, formatTaille, MODELES, modeleConseille, preparerDossier, supprimer, telecharger } from '@/lib/ia/modeles';
import { OfflineManager } from '@maplibre/maplibre-react-native';
import { cartesPretes } from '@/lib/cartes';
import { lireCatalogue, type Catalogue, type PackPartage } from '@/lib/partage-hors-ligne';
import { rafraichir } from '@/lib/preparation';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

export default function Recevoir() {
  useKeepAwake();
  const [permission, demander] = useCameraPermissions();
  const [actif, setActif] = useStored<string | null>(KEYS.modele, null);
  const [adresse, setAdresse] = useState('');
  const [source, setSource] = useState<{ base: string; catalogue: Catalogue } | null>(null);
  const [deja, setDeja] = useState<Record<string, boolean>>({});
  const [progres, setProgres] = useState<Record<string, number>>({});
  const [enCours, setEnCours] = useState(false);
  const lu = useRef(false);

  useEffect(() => {
    if (!source) return;
    (async () => {
      const d: Record<string, boolean> = {};
      for (const p of source.catalogue.packs) d[p.fichier] = p.type === 'cartes' ? await cartesPretes() : await estInstalle(p);
      setDeja(d);
    })();
  }, [source]);

  const connecter = async (url: string) => {
    try {
      setSource(await lireCatalogue(url));
    } catch (e) {
      lu.current = false;
      Alert.alert(
        t("Connexion impossible"),
        t("{v1}\n\nVérifie que tu es bien connecté au Wi-Fi du téléphone partageur (premier QR code).", { v1: e instanceof Error ? e.message : e }),
      );
    }
  };

  // Le modèle IA le plus adapté à CE téléphone parmi ceux proposés (un 4B ne tourne pas partout).
  const conseille = modeleConseille();
  const utile = (p: PackPartage) =>
    p.type !== 'ia' || !conseille || (MODELES.find((m) => m.fichier === p.fichier)?.ramMinGo ?? 0) <= conseille.ramMinGo;

  const toutRecuperer = async () => {
    if (!source) return;
    setEnCours(true);
    await preparerDossier();
    for (const p of source.catalogue.packs.filter((x) => !deja[x.fichier] && utile(x))) {
      try {
        const f = { fichier: p.fichier, octets: p.octets, url: `${source.base}/${p.url}` };
        const r = await telecharger(f, (x) => setProgres((pr) => ({ ...pr, [p.fichier]: x }))).downloadAsync();
        if (!r) throw new Error(t("Téléchargement interrompu."));
        await finaliser(f);
        if (p.type === 'cartes') {
          // Les cartes reçues rejoignent la base de cartes de ce téléphone, puis la copie est effacée.
          await OfflineManager.mergeOfflineRegions(chemin(f).replace(/^file:\/\//, ''));
          await supprimer(f);
        }
        setDeja((d) => ({ ...d, [p.fichier]: true }));
        if (p.type === 'ia' && !actif) setActif(MODELES.find((m) => m.fichier === p.fichier)?.id ?? null);
      } catch (e) {
        setEnCours(false);
        Alert.alert(t("Copie interrompue"), t("{nom} : {v2}\nRapproche-toi du téléphone partageur et réessaie.", { nom: t(p.nom), v2: e instanceof Error ? e.message : e }));
        return;
      }
    }
    setEnCours(false);
    rafraichir().catch(() => {});
    Alert.alert(t("C’est fait"), t("Refuge est prêt à fonctionner sans Internet."), [{ text: 'OK', onPress: () => router.back() }]);
  };

  if (source) {
    const packs = source.catalogue.packs;
    return (
      <Ecran>
        <Titre>{t("Packs disponibles")}</Titre>
        <Texte muted>{t("Copiés directement depuis le téléphone de ton proche, sans Internet.")}</Texte>
        {packs.length === 0 && <Texte>{t("Ce téléphone ne partage aucun pack (il n’a pas encore installé l’IA ni la voix).")}</Texte>}
        {packs.map((p) => (
          <Carte key={p.fichier} couleur={deja[p.fichier] ? c.ok : utile(p) ? c.accent : undefined}>
            <Texte>{t(p.nom)}</Texte>
            <Texte muted>
              {formatTaille(p.octets)}
              {deja[p.fichier] ? t(" · déjà installé ✓") : !utile(p) ? t(" · trop lourd pour ton téléphone, ignoré") : ''}
              {progres[p.fichier] !== undefined && !deja[p.fichier] ? ` · ${Math.round(progres[p.fichier] * 100)} %` : ''}
            </Texte>
          </Carte>
        ))}
        {packs.some((p) => !deja[p.fichier] && utile(p)) && (
          <Bouton label={enCours ? t("Copie en cours…") : t("Tout récupérer")} icone="download" grand onPress={() => !enCours && toutRecuperer()} />
        )}
      </Ecran>
    );
  }

  return (
    <Ecran>
      <Titre>{t("Récupérer depuis un proche")}</Titre>
      <Texte muted>
        {t("1. Connecte-toi au Wi-Fi de son téléphone (son premier QR code, avec ton appareil photo).")}{'\n'}{t("2. Scanne ici son second QR code.")}</Texte>
      {permission?.granted ? (
        <View style={{ height: 300, borderRadius: 16, overflow: 'hidden' }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (lu.current || !/^https?:\/\//.test(data)) return;
              lu.current = true;
              connecter(data);
            }}
          />
        </View>
      ) : (
        <Bouton label={t("Autoriser la caméra")} icone="camera" onPress={demander} />
      )}
      <Champ label={t("Ou tape l’adresse affichée sur son écran")} placeholder="http://192.168.49.1:8080" value={adresse} onChangeText={setAdresse} autoCapitalize="none" keyboardType="url" />
      <Bouton label={t("Se connecter")} discret onPress={() => adresse.trim() && connecter(adresse)} />
    </Ecran>
  );
}
