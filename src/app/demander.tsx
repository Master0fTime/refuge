import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Reflexion, type Etape as EtapeReflexion } from '@/components/Reflexion';
import { TexteRiche } from '@/components/TexteRiche';
import { Bouton, Carte, Texte } from '@/components/ui';
import { detecter, detecterPhoto, type Alerte } from '@/lib/ia/garde-fous';
import { estInstalle, MODELES, visionInstallee } from '@/lib/ia/modeles';
import { analyserImage, arreter, charger, repondre, type Message } from '@/lib/ia/moteur';
import { chercherEncyclopedie, type PassageEncyclopedie } from '@/lib/encyclopedie';
import { chercher, type Resultat } from '@/lib/recherche';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import { arreterEtTranscrire, arreterLecture, demarrerEnregistrement, lireReponse, voixInstallee } from '@/lib/voix';
import { t } from '@/i18n';

type Bulle = {
  role: 'user' | 'assistant';
  texte: string;
  /** Photo envoyée par la personne (bulle « user »). */
  image?: string;
  sources?: Resultat[];
  encyclopedie?: PassageEncyclopedie[];
  alertes?: Alerte[];
  sansIA?: boolean;
};
type Etat = 'libre' | 'ecoute' | 'transcription' | 'chargement' | 'reponse';

const EXEMPLES = [
  'Je suis en ville avec ma sœur, on n’a plus rien à manger. Qu’est-ce qu’on peut faire ?',
  'Comment faire du feu sans briquet ?',
  'Comment rendre l’eau de pluie potable ?',
  'Je me suis coupé, je n’ai pas de pansement',
];

export default function Demander() {
  useKeepAwake();
  const { voix } = useLocalSearchParams<{ voix?: string }>();
  const [actif] = useStored<string | null>(KEYS.modele, null);
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [q, setQ] = useState('');
  const [etat, setEtat] = useState<Etat>('libre');
  const [etape, setEtape] = useState<EtapeReflexion>('chargement');
  const [iaDispo, setIaDispo] = useState<boolean | null>(null);
  const [voixDispo, setVoixDispo] = useState<boolean | null>(null);
  const [visionDispo, setVisionDispo] = useState<boolean | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const autoLance = useRef(false);
  const finEnCours = useRef(false);
  const insets = useSafeAreaInsets();
  const modele = MODELES.find((m) => m.id === actif);

  useEffect(() => {
    if (modele) estInstalle(modele).then(setIaDispo);
    else setIaDispo(false);
  }, [modele]);

  useEffect(() => {
    voixInstallee().then((m) => setVoixDispo(!!m));
    return () => {
      arreterLecture();
    };
  }, []);

  // Revenu de « IA hors ligne » après avoir installé la vision : le bouton photo marche tout de suite.
  useFocusEffect(
    useCallback(() => {
      visionInstallee().then(setVisionDispo);
    }, []),
  );

  // Ouvert depuis « Parler à l'IA » : on lance directement le micro.
  useEffect(() => {
    if (voix === '1' && voixDispo && !autoLance.current) {
      autoLance.current = true;
      ecouter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voix, voixDispo]);

  const majDerniere = (patch: Partial<Bulle>) =>
    setBulles((b) => b.map((x, i) => (i === b.length - 1 ? { ...x, ...patch } : x)));

  const envoyer = async (texte = q, parVoix = false) => {
    const question = texte.trim();
    // Après une dictée, `etat` vu ici date d'avant l'enregistrement : on ne le vérifie que pour l'écrit.
    if (!question || (!parVoix && etat !== 'libre')) return;
    setQ('');
    arreterLecture();
    // Recherche sur les derniers messages : les relances (« et si je n'ai pas de corde ? ») gardent leur contexte.
    const derniers = bulles
      .filter((b) => b.role === 'user')
      .slice(-2)
      .map((b) => b.texte)
      .join(' ');
    const sources = chercher(question, 4, derniers);
    const encyclopedie = await chercherEncyclopedie(question, 2);
    const alertes = detecter(question);
    const historique: Message[] = bulles.filter((b) => !b.sansIA).map((b) => ({ role: b.role, content: b.texte }));
    setBulles((b) => [...b, { role: 'user', texte: question }, { role: 'assistant', texte: '', sources, encyclopedie, alertes, sansIA: !iaDispo }]);

    if (!iaDispo || !modele) {
      majDerniere({
        texte: sources.length || encyclopedie.length
          ? t('L’IA n’est pas installée. Voici les fiches qui correspondent à ta question :')
          : t('Je n’ai pas trouvé de fiche sur ce sujet. Essaie avec d’autres mots, ou parcours l’onglet Savoir.'),
      });
      setEtat('libre');
      return;
    }

    try {
      setEtat('chargement');
      setEtape('chargement');
      await charger(modele);
      setEtat('reponse');
      const finale = (await repondre(question, sources, historique, (t) => majDerniere({ texte: t }), (p) => setEtape(p), encyclopedie)).trim();
      majDerniere({ texte: finale });
      // Question posée à voix haute : la réponse est lue à voix haute (mains et yeux libres).
      if (parVoix) lireReponse(finale);
    } catch (e) {
      majDerniere({ texte: t("L’IA a rencontré un problème ({v1}). Les fiches ci-dessous restent valables.", { v1: e instanceof Error ? e.message : e }), sansIA: true });
    } finally {
      setEtat('libre');
    }
  };

  // Photo : la vision décrit ce qu'elle voit, puis on cherche les fiches et l'encyclopédie sur le sujet reconnu.
  const choisirPhoto = () => {
    if (!visionDispo) {
      Alert.alert(t('Vision non installée'), t('Pour comprendre une photo, installe la vision depuis « IA hors ligne » (environ 1,5 Go, en Wi-Fi).'), [
        { text: t('Plus tard') },
        { text: t('Installer'), onPress: () => router.push('/ia') },
      ]);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const ouvrir = async (camera: boolean) => {
      try {
        if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return;
        const r = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
        if (!r.canceled && r.assets[0]) envoyerPhoto(r.assets[0].uri);
      } catch (e) {
        Alert.alert(t('Photo'), String(e instanceof Error ? e.message : e));
      }
    };
    Alert.alert(t('Envoyer une photo'), t('L’IA te dit ce qu’elle voit. Elle peut se tromper : ne mange jamais une plante ou un champignon reconnu par photo.'), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Galerie'), onPress: () => ouvrir(false) },
      { text: t('Prendre une photo'), onPress: () => ouvrir(true) },
    ]);
  };

  const envoyerPhoto = async (image: string) => {
    const question = q.trim();
    setQ('');
    arreterLecture();
    setBulles((b) => [...b, { role: 'user', texte: question, image }, { role: 'assistant', texte: '', sansIA: true }]);
    try {
      setEtat('chargement');
      setEtape('chargement');
      const { texte, sujet } = await analyserImage(image, question, (x) => majDerniere({ texte: x }), (p) => setEtape(p === 'lecture' ? 'photo' : p));
      setEtat('reponse');
      const cle = [sujet, question].filter(Boolean).join(' ');
      majDerniere({
        texte,
        sources: cle ? chercher(cle, 3) : [],
        encyclopedie: sujet ? await chercherEncyclopedie(sujet, 2) : [],
        alertes: detecterPhoto(cle, texte),
      });
    } catch (e) {
      majDerniere({ texte: t('Je n’ai pas pu analyser la photo ({v1}).', { v1: e instanceof Error ? e.message : e }), alertes: detecter(question) });
    } finally {
      setEtat('libre');
    }
  };

  const ecouter = async () => {
    if (!voixDispo) {
      Alert.alert(t("Commande vocale non installée"), t('Installe-la depuis « Préparer mon téléphone » (environ 60 à 190 Mo).'), [
        { text: t('Plus tard') },
        { text: t('Installer'), onPress: () => router.push('/preparer') },
      ]);
      return;
    }
    try {
      finEnCours.current = false;
      // Arrêt automatique quand la personne a fini de parler.
      await demarrerEnregistrement(() => finirEcoute());
      setEtat('ecoute');
    } catch (e) {
      Alert.alert(t("Micro"), String(e instanceof Error ? e.message : e));
    }
  };

  const finirEcoute = async () => {
    if (finEnCours.current) return; // touché ET silence détecté : une seule fin
    finEnCours.current = true;
    setEtat('transcription');
    try {
      const texte = await arreterEtTranscrire();
      if (!texte) {
        setEtat('libre');
        Alert.alert(t("Je n’ai rien entendu"), t('Rapproche le téléphone de ta bouche et réessaie.'));
        return;
      }
      await envoyer(texte, true);
    } catch (e) {
      setEtat('libre');
      Alert.alert(t("Reconnaissance vocale"), String(e instanceof Error ? e.message : e));
    }
  };

  const occupe = etat === 'chargement' || etat === 'reponse' || etat === 'transcription';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding" keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, gap: space.md }} onContentSizeChange={() => scroll.current?.scrollToEnd()}>
        {iaDispo === false && (
          <Carte couleur={c.accent}>
            <Texte>{t('L’IA n’est pas encore installée sur ce téléphone. Les réponses se limiteront aux fiches correspondantes.')}</Texte>
            <Bouton label={t('Préparer mon téléphone')} icone="download" discret onPress={() => router.push('/preparer')} />
          </Carte>
        )}
        {bulles.length === 0 && etat === 'libre' && (
          <>
            <Texte muted>{t('Explique ta situation avec tes mots, à l’écrit ou au micro : où tu es, avec qui, ce que tu as. Exemples :')}</Texte>
            {EXEMPLES.map((e) => (
              <Bouton key={e} label={t(e)} discret onPress={() => envoyer(t(e))} />
            ))}
          </>
        )}
        {bulles.map((b, i) =>
          b.role === 'user' ? (
            <View key={i} style={{ alignSelf: 'flex-end', backgroundColor: c.accent, borderRadius: 14, padding: space.md, maxWidth: '85%', gap: 6 }}>
              {!!b.image && <Image source={{ uri: b.image }} style={{ width: 200, height: 200, borderRadius: 10 }} resizeMode="cover" />}
              {!!b.texte && <Text style={{ color: '#000', fontSize: 16 }}>{b.texte}</Text>}
            </View>
          ) : (
            <View key={i} style={{ gap: space.sm }}>
              {b.alertes?.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={() => (a.route ? router.push(a.route) : a.fiche ? router.push(`/fiche/${a.fiche}`) : a.tel && Linking.openURL(`tel:${a.tel}`))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.danger, borderRadius: 12, padding: space.md }}>
                  <Ionicons name={a.route ? 'leaf' : a.fiche ? 'heart' : 'call'} size={22} color="#000" />
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 16, flex: 1 }}>{a.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#000" />
                </Pressable>
              ))}
              <Carte>
                {b.texte ? (
                  <TexteRiche texte={b.texte} />
                ) : i === bulles.length - 1 && (etat === 'chargement' || etat === 'reponse') ? (
                  <Reflexion etape={etape} modeleLent={actif === 'avance'} />
                ) : (
                  <Texte muted>…</Texte>
                )}
                {!!b.texte && !(etat === 'reponse' && i === bulles.length - 1) && (
                  <Pressable onPress={() => lireReponse(b.texte)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                    <Ionicons name="volume-high" size={20} color={c.info} />
                    <Text style={{ color: c.info, fontWeight: '600' }}>{t('Écouter')}</Text>
                  </Pressable>
                )}
              </Carte>
              {!!b.sources?.length && (
                <View style={{ gap: 6 }}>
                  <Texte muted>{t('Sources :')}</Texte>
                  {b.sources.map((s, n) => (
                    <Pressable
                      key={s.fiche.id}
                      onPress={() => router.push(`/fiche/${s.fiche.id}`)}
                      style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.cardAlt, borderRadius: 10, padding: space.sm + 2 }}>
                      <Text style={{ color: c.accent, fontWeight: '800' }}>[{n + 1}]</Text>
                      <Text style={{ color: c.text, flex: 1 }}>{s.fiche.titre}</Text>
                      <Ionicons name="chevron-forward" size={18} color={c.muted} />
                    </Pressable>
                  ))}
                </View>
              )}
              {!!b.encyclopedie?.length && (
                <View style={{ gap: 6 }}>
                  <Texte muted>{t('Encyclopédie (Wikipédia) :')}</Texte>
                  {b.encyclopedie.map((p, n) => (
                    <Pressable
                      key={p.article}
                      onPress={() => router.push(`/article/${p.article}`)}
                      style={{ gap: 2, backgroundColor: c.cardAlt, borderRadius: 10, padding: space.sm + 2 }}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <Text style={{ color: c.info, fontWeight: '800' }}>[E{n + 1}]</Text>
                        <Text style={{ color: c.text, flex: 1, fontWeight: '600' }}>{p.titre}</Text>
                        <Ionicons name="chevron-forward" size={18} color={c.muted} />
                      </View>
                      <Text style={{ color: c.muted, fontSize: 13 }} numberOfLines={2}>
                        {p.extrait}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ),
        )}
        {bulles.length > 0 && (
          <Text style={{ color: c.muted, fontSize: 12 }}>{t('L’IA peut se tromper. En cas d’urgence vitale, suis les fiches et appelle le 112.')}</Text>
        )}
      </ScrollView>

      {etat === 'ecoute' || etat === 'transcription' ? (
        <Pressable
          onPress={() => etat === 'ecoute' && finirEcoute()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: space.xl, paddingBottom: space.xl + insets.bottom, backgroundColor: etat === 'ecoute' ? c.danger : c.cardAlt }}>
          {etat === 'ecoute' ? <Ionicons name="mic" size={32} color="#000" /> : <ActivityIndicator color={c.text} />}
          <Text style={{ color: etat === 'ecoute' ? '#000' : c.text, fontSize: 18, fontWeight: '800' }}>
            {etat === 'ecoute' ? t('Je t’écoute… (envoi automatique quand tu te tais)') : t('Je transcris ce que tu as dit…')}
          </Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8, padding: space.md, paddingBottom: space.md + insets.bottom, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card, alignItems: 'center' }}>
          <Pressable onPress={ecouter} disabled={occupe} hitSlop={8}>
            <Ionicons name="mic-circle" size={44} color={occupe ? c.muted : c.info} />
          </Pressable>
          <Pressable onPress={choisirPhoto} disabled={occupe} hitSlop={8} accessibilityLabel={t('Envoyer une photo')}>
            <Ionicons name="camera" size={34} color={occupe ? c.muted : c.info} />
          </Pressable>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('Ta question ou ta situation…')}
            placeholderTextColor={c.muted}
            multiline
            style={{ flex: 1, color: c.text, fontSize: 16, maxHeight: 120, paddingHorizontal: 8 }}
          />
          {etat === 'reponse' ? (
            <Pressable onPress={arreter} hitSlop={8}>
              <Ionicons name="stop-circle" size={40} color={c.danger} />
            </Pressable>
          ) : (
            <Pressable onPress={() => envoyer()} hitSlop={8} disabled={occupe}>
              <Ionicons name="arrow-up-circle" size={40} color={q.trim() && !occupe ? c.accent : c.muted} />
            </Pressable>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
