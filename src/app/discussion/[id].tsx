import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bouton, Texte } from '@/components/ui';
import { demarrer, envoyer, ouvrirDiscussion, signalerModification, useMaillage, type MessageGroupe } from '@/lib/maillage';
import { positionActuelle } from '@/lib/position';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import { profilVide, type Groupe, type Profil } from '@/lib/types';
import { t } from '@/i18n';

/** Discussion d'un groupe par Bluetooth : messages courts, « Je vais bien », « J'ai besoin d'aide », position. */
export default function Discussion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [groupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const [boite] = useStored<Record<string, MessageGroupe[]>>(KEYS.messages, {});
  const g = groupes.find((x) => x.id === id);
  const liste = (g && boite[g.id]) || [];
  const { actif, voisins, erreur, journal } = useMaillage();
  const [details, setDetails] = useState(false);
  const [texte, setTexte] = useState('');
  const [probleme, setProbleme] = useState<string | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  const [profil, setProfil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const [prenom, setPrenom] = useState('');

  const allumer = async () => setProbleme(await demarrer());

  useEffect(() => {
    allumer();
  }, []);

  // Pas de notification pour la discussion qu'on a sous les yeux.
  useFocusEffect(
    useCallback(() => {
      ouvrirDiscussion(id);
      return () => ouvrirDiscussion(null);
    }, [id]),
  );

  if (!g) return <Texte>{t('Groupe introuvable.')}</Texte>;

  // Le nom affiché : le surnom donné sur ce téléphone, sinon celui que la personne a choisi.
  const nomDe = (m: MessageGroupe) => {
    const membre = g.membres.find((x) => x.id === m.de);
    return membre?.surnom || (m.nom !== 'Sans nom' && m.nom !== 'Moi' ? m.nom : membre?.nom) || t('Sans nom');
  };

  const enregistrerPrenom = () => {
    if (!prenom.trim()) return;
    setProfil({ ...profil, prenom: prenom.trim() });
    signalerModification(g.id);
  };

  const envoyerTexte = async () => {
    const x = texte.trim();
    if (!x) return;
    setTexte('');
    try {
      await envoyer(g, { k: 'msg', x });
    } catch (e) {
      Alert.alert(t('Message non envoyé'), String(e instanceof Error ? e.message : e));
    }
  };

  const statut = async (k: 'ok' | 'aide' | 'pos') => {
    let pos: { la: number; lo: number } | undefined;
    try {
      const p = await Promise.race([positionActuelle(), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('lent')), 8000))]);
      pos = { la: Number(p.coords.latitude.toFixed(5)), lo: Number(p.coords.longitude.toFixed(5)) };
    } catch {
      if (k === 'pos') return Alert.alert(t('Position introuvable'), t('Le GPS ne répond pas. Sors à découvert et réessaie.'));
    }
    try {
      await envoyer(g, { k, ...pos });
    } catch (e) {
      Alert.alert(t('Message non envoyé'), String(e instanceof Error ? e.message : e));
    }
  };

  const avertissement = probleme ?? erreur;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding" keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: g.nom }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, backgroundColor: c.card }}>
        <Ionicons name="bluetooth" size={20} color={actif ? c.ok : c.muted} />
        <Text style={{ color: c.text, flex: 1, fontSize: 14 }}>
          {actif
            ? voisins
              ? t('Bluetooth actif · {n} téléphone(s) Refuge à proximité', { n: voisins })
              : t('Bluetooth actif · personne à portée pour l’instant')
            : t('Bluetooth éteint')}
        </Text>
        {!actif && (
          <Pressable onPress={allumer} hitSlop={8}>
            <Text style={{ color: c.accent, fontWeight: '800' }}>{t('Allumer')}</Text>
          </Pressable>
        )}
      </View>
      {avertissement && (
        <Text style={{ color: c.accent, padding: space.md, paddingTop: 0, backgroundColor: c.card, fontSize: 14 }}>{avertissement}</Text>
      )}

      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {!profil.prenom.trim() && (
          <View style={{ backgroundColor: c.card, borderRadius: 14, padding: space.md, gap: space.sm }}>
            <Text style={{ color: c.text, fontSize: 15 }}>{t('Ton prénom, pour que ton groupe sache qui écrit :')}</Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <TextInput
                value={prenom}
                onChangeText={setPrenom}
                onSubmitEditing={enregistrerPrenom}
                placeholder={t('Prénom')}
                placeholderTextColor={c.muted}
                style={{ flex: 1, backgroundColor: c.bg, color: c.text, borderRadius: 10, paddingHorizontal: space.md, fontSize: 16 }}
              />
              <Bouton label={t('OK')} onPress={enregistrerPrenom} />
            </View>
          </View>
        )}
        {!liste.length && (
          <Texte muted>
            {t('Les messages passent de téléphone en téléphone par Bluetooth, sans réseau, jusqu’à environ 100 m, et rebondissent sur les autres téléphones Refuge. Garde l’appli ouverte. Seuls les membres du groupe peuvent les lire.')}
          </Texte>
        )}
        {liste.map((m) => (
          <Bulle key={m.id} m={m} nom={nomDe(m)} />
        ))}
        <Pressable onPress={() => setDetails(!details)} hitSlop={8} style={{ alignSelf: 'center', paddingTop: space.lg }}>
          <Text style={{ color: c.muted, fontSize: 13, textDecorationLine: 'underline' }}>
            {details ? t('Masquer les détails techniques') : t('Détails techniques (si les messages ne passent pas)')}
          </Text>
        </Pressable>
        {details && (
          <View style={{ backgroundColor: c.card, borderRadius: 10, padding: space.sm }}>
            {journal.length ? (
              journal.map((l, i) => (
                <Text key={i} style={{ color: c.muted, fontSize: 12, fontFamily: 'monospace' }}>
                  {l}
                </Text>
              ))
            ) : (
              <Text style={{ color: c.muted, fontSize: 12 }}>{t('Rien pour l’instant.')}</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ padding: space.md, paddingBottom: space.md + insets.bottom, gap: space.sm, backgroundColor: c.card }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Bouton label={t('Je vais bien')} icone="checkmark-circle" couleur={c.ok} onPress={() => statut('ok')} />
          </View>
          <View style={{ flex: 1 }}>
            <Bouton label={t('Aide')} icone="alert-circle" couleur={c.danger} onPress={() => statut('aide')} />
          </View>
          <Pressable
            onPress={() => statut('pos')}
            accessibilityLabel={t('Envoyer ma position')}
            style={{ width: 52, borderRadius: 12, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location" size={24} color={c.accent} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <TextInput
            value={texte}
            onChangeText={setTexte}
            placeholder={t('Message court…')}
            placeholderTextColor={c.muted}
            maxLength={300}
            onSubmitEditing={envoyerTexte}
            style={{ flex: 1, backgroundColor: c.bg, color: c.text, borderRadius: 12, paddingHorizontal: space.md, paddingVertical: space.md, fontSize: 16 }}
          />
          <Pressable onPress={envoyerTexte} accessibilityLabel={t('Envoyer')} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={22} color={c.surJaune} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Couleurs par type de message : fond + texte toujours contrastés, quel que soit l'expéditeur.
const STYLES = {
  ok: { fond: c.ok, texte: c.surJaune },
  aide: { fond: c.danger, texte: '#ffffff' },
  moi: { fond: c.accent, texte: c.surJaune },
  autre: { fond: c.cardAlt, texte: c.text },
};

function Bulle({ m, nom }: { m: MessageGroupe; nom: string }) {
  const heure = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const { fond, texte: encre } = m.k === 'ok' ? STYLES.ok : m.k === 'aide' ? STYLES.aide : m.moi ? STYLES.moi : STYLES.autre;
  const texte =
    m.k === 'ok' ? t('✅ Je vais bien') : m.k === 'aide' ? t('🆘 J’ai besoin d’aide') : m.k === 'pos' ? t('📍 Ma position') : (m.x ?? '');
  const voir = () => router.push({ pathname: '/carte', params: { lat: String(m.la), lon: String(m.lo), nom: m.moi ? t('Ma position') : nom } });
  return (
    <View style={{ alignSelf: m.moi ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: fond, borderRadius: 16, padding: space.md, gap: 4 }}>
      {!m.moi && <Text style={{ color: encre, fontWeight: '800', fontSize: 13 }}>{nom}</Text>}
      <Text style={{ color: encre, fontSize: 16 }}>{texte}</Text>
      {m.la !== undefined && m.lo !== undefined && (
        <Pressable onPress={voir} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 10, padding: 8 }}>
          <Ionicons name="map" size={18} color={encre} />
          <Text style={{ color: encre, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>
            {t('Voir sur la carte')} · {m.la}, {m.lo}
          </Text>
        </Pressable>
      )}
      <Text style={{ color: encre, fontSize: 11, alignSelf: 'flex-end' }}>{heure}</Text>
    </View>
  );
}
