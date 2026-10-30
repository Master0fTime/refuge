import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bouton, Texte } from '@/components/ui';
import { geoUri } from '@/lib/geo';
import { demarrer, envoyer, useMaillage, type MessageGroupe } from '@/lib/maillage';
import { positionActuelle } from '@/lib/position';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import type { Groupe } from '@/lib/types';
import { t } from '@/i18n';

/** Discussion d'un groupe par Bluetooth : messages courts, « Je vais bien », « J'ai besoin d'aide », position. */
export default function Discussion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [groupes] = useStored<Groupe[]>(KEYS.groupes, []);
  const [boite] = useStored<Record<string, MessageGroupe[]>>(KEYS.messages, {});
  const g = groupes.find((x) => x.id === id);
  const liste = (g && boite[g.id]) || [];
  const { actif, voisins, erreur } = useMaillage();
  const [texte, setTexte] = useState('');
  const [probleme, setProbleme] = useState<string | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();

  const allumer = async () => setProbleme(await demarrer());

  useEffect(() => {
    allumer();
  }, []);

  if (!g) return <Texte>{t('Groupe introuvable.')}</Texte>;

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
        {!liste.length && (
          <Texte muted>
            {t('Les messages passent de téléphone en téléphone par Bluetooth, sans réseau, jusqu’à environ 100 m, et rebondissent sur les autres téléphones Refuge. Garde l’appli ouverte. Seuls les membres du groupe peuvent les lire.')}
          </Texte>
        )}
        {liste.map((m) => (
          <Bulle key={m.id} m={m} />
        ))}
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

function Bulle({ m }: { m: MessageGroupe }) {
  const heure = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const couleur = m.k === 'aide' ? c.danger : m.k === 'ok' ? c.ok : m.moi ? c.accent : c.cardAlt;
  const texte =
    m.k === 'ok' ? t('✅ Je vais bien') : m.k === 'aide' ? t('🆘 J’ai besoin d’aide') : m.k === 'pos' ? t('📍 Ma position') : (m.x ?? '');
  const surCouleur = m.k === 'msg' && !m.moi ? c.text : c.surJaune;
  return (
    <View style={{ alignSelf: m.moi ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: couleur, borderRadius: 16, padding: space.md, gap: 4 }}>
      {!m.moi && <Text style={{ color: surCouleur, fontWeight: '800', fontSize: 13 }}>{m.nom}</Text>}
      <Text style={{ color: surCouleur, fontSize: 16 }}>{texte}</Text>
      {m.la !== undefined && m.lo !== undefined && (
        <Pressable onPress={() => Linking.openURL(geoUri(m.la!, m.lo!, m.nom))}>
          <Text style={{ color: surCouleur, textDecorationLine: 'underline', fontSize: 14 }}>
            {m.la}, {m.lo} · {t('Ouvrir sur la carte')}
          </Text>
        </Pressable>
      )}
      <Text style={{ color: surCouleur, fontSize: 11, opacity: 0.8, alignSelf: 'flex-end' }}>{heure}</Text>
    </View>
  );
}
