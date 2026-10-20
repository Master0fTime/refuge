import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Bouton, Carte, Texte } from '@/components/ui';
import { detecter, type Alerte } from '@/lib/ia/garde-fous';
import { estInstalle, MODELES } from '@/lib/ia/modeles';
import { arreter, charger, repondre, type Message } from '@/lib/ia/moteur';
import { chercher, type Resultat } from '@/lib/recherche';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';

type Bulle = { role: 'user' | 'assistant'; texte: string; sources?: Resultat[]; alertes?: Alerte[]; sansIA?: boolean };

const EXEMPLES = ['Comment faire du feu sans briquet ?', 'Comment rendre l’eau de pluie potable ?', 'Je me suis coupé, je n’ai pas de pansement', 'J’ai froid, je dois dormir dehors'];

export default function Demander() {
  useKeepAwake();
  const [actif] = useStored<string | null>(KEYS.modele, null);
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [q, setQ] = useState('');
  const [etat, setEtat] = useState<'libre' | 'chargement' | 'reponse'>('libre');
  const [iaDispo, setIaDispo] = useState<boolean | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const modele = MODELES.find((m) => m.id === actif);

  useEffect(() => {
    if (modele) estInstalle(modele).then(setIaDispo);
    else setIaDispo(false);
  }, [modele]);

  const majDerniere = (patch: Partial<Bulle>) =>
    setBulles((b) => b.map((x, i) => (i === b.length - 1 ? { ...x, ...patch } : x)));

  const envoyer = async (texte = q) => {
    const question = texte.trim();
    if (!question || etat !== 'libre') return;
    setQ('');
    // On enrichit la recherche avec la question précédente pour les relances (« et si je n'ai pas de corde ? »).
    const precedente = [...bulles].reverse().find((b) => b.role === 'user')?.texte ?? '';
    const sources = chercher(`${question} ${precedente}`, 4);
    const alertes = detecter(question);
    const historique: Message[] = bulles.filter((b) => !b.sansIA).map((b) => ({ role: b.role, content: b.texte }));
    setBulles((b) => [...b, { role: 'user', texte: question }, { role: 'assistant', texte: '', sources, alertes, sansIA: !iaDispo }]);

    if (!iaDispo || !modele) {
      majDerniere({
        texte: sources.length
          ? 'L’IA n’est pas installée. Voici les fiches qui correspondent à ta question :'
          : 'Je n’ai pas trouvé de fiche sur ce sujet. Essaie avec d’autres mots, ou parcours l’onglet Savoir.',
      });
      return;
    }

    try {
      setEtat('chargement');
      await charger(modele);
      setEtat('reponse');
      const finale = await repondre(question, sources, historique, (t) => majDerniere({ texte: t }));
      majDerniere({ texte: finale.trim() });
    } catch (e) {
      majDerniere({ texte: `L’IA a rencontré un problème (${e instanceof Error ? e.message : e}). Les fiches ci-dessous restent valables.`, sansIA: true });
    } finally {
      setEtat('libre');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, gap: space.md }} onContentSizeChange={() => scroll.current?.scrollToEnd()}>
        {iaDispo === false && (
          <Carte couleur={c.accent}>
            <Texte>L’IA n’est pas encore installée sur ce téléphone. Les réponses se limiteront aux fiches correspondantes.</Texte>
            <Bouton label="Installer l’IA (hors ligne)" icone="download" discret onPress={() => router.push('/ia')} />
          </Carte>
        )}
        {bulles.length === 0 && (
          <>
            <Texte muted>Pose ta question avec tes mots. Exemples :</Texte>
            {EXEMPLES.map((e) => (
              <Bouton key={e} label={e} discret onPress={() => envoyer(e)} />
            ))}
          </>
        )}
        {bulles.map((b, i) =>
          b.role === 'user' ? (
            <View key={i} style={{ alignSelf: 'flex-end', backgroundColor: c.accent, borderRadius: 14, padding: space.md, maxWidth: '85%' }}>
              <Text style={{ color: '#000', fontSize: 16 }}>{b.texte}</Text>
            </View>
          ) : (
            <View key={i} style={{ gap: space.sm }}>
              {b.alertes?.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={() => (a.fiche ? router.push(`/fiche/${a.fiche}`) : a.tel && Linking.openURL(`tel:${a.tel}`))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.danger, borderRadius: 12, padding: space.md }}>
                  <Ionicons name={a.fiche ? 'heart' : 'call'} size={22} color="#000" />
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 16, flex: 1 }}>{a.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#000" />
                </Pressable>
              ))}
              <Carte>
                <Texte>{b.texte || (etat === 'chargement' ? 'Démarrage de l’IA… (quelques secondes)' : '…')}</Texte>
              </Carte>
              {!!b.sources?.length && (
                <View style={{ gap: 6 }}>
                  <Texte muted>Sources :</Texte>
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
            </View>
          ),
        )}
        {bulles.length > 0 && (
          <Text style={{ color: c.muted, fontSize: 12 }}>
            L’IA peut se tromper. En cas d’urgence vitale, suis les fiches et appelle le 112.
          </Text>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 8, padding: space.md, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Ta question…"
          placeholderTextColor={c.muted}
          multiline
          style={{ flex: 1, color: c.text, fontSize: 16, maxHeight: 120, paddingHorizontal: 8 }}
        />
        {etat === 'reponse' ? (
          <Pressable onPress={arreter} hitSlop={8} style={{ justifyContent: 'center' }}>
            <Ionicons name="stop-circle" size={40} color={c.danger} />
          </Pressable>
        ) : (
          <Pressable onPress={() => envoyer()} hitSlop={8} style={{ justifyContent: 'center' }} disabled={etat !== 'libre'}>
            <Ionicons name="arrow-up-circle" size={40} color={q.trim() && etat === 'libre' ? c.accent : c.muted} />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
