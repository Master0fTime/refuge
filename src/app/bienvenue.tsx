import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FenetreKit } from '@/components/FenetreKit';
import { Montagne } from '@/components/Montagne';
import { formatTaille } from '@/lib/ia/modeles';
import { packs } from '@/lib/packs';
import { taillePack, usePreparation } from '@/lib/preparation';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

/** Premier lancement : expliquer pourquoi tout télécharger maintenant, et le faire en un bouton. */
export default function Bienvenue() {
  const insets = useSafeAreaInsets();
  const [, setAccueilVu] = useStored<boolean>(KEYS.accueilVu, false);
  const [fenetre, setFenetre] = useState(false);
  const { prets } = usePreparation();
  const total = packs()
    .filter((p) => p.disponible && !prets[p.id])
    .reduce((s, p) => s + taillePack(p), 0);

  const terminer = (route: '/' | '/autorisations' | '/sos' | '/recevoir') => {
    setAccueilVu(true);
    if (route === '/autorisations' || route === '/recevoir') return router.replace(route);
    // Ouvert par-dessus l'accueil : on referme plutôt que d'empiler un second accueil.
    if (router.canGoBack()) router.back();
    if (route === '/sos' || !router.canGoBack()) router.navigate(route);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.lg, flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Ionicons name="home" size={22} color={c.accent} />
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>Refuge</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Montagne />
      </View>

      <Text style={{ color: c.text, fontSize: 27, fontWeight: '800', lineHeight: 33 }}>{t('Prêt même sans Internet ni réseau')}</Text>
      <Text style={{ color: c.muted, fontSize: 17, lineHeight: 25 }}>
        {t('Refuge fonctionne entièrement hors ligne : IA, fiches de secours, cartes, encyclopédie. Pour ça, télécharge maintenant tout ce dont l’appli a besoin, tant que tu as du Wi-Fi.')}
      </Text>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setFenetre(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('Tout préparer')}
        style={({ pressed }) => ({
          alignSelf: 'center',
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: c.accent,
          borderWidth: 8,
          borderColor: '#f7e08a',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: space.md,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}>
        <Ionicons name="download" size={46} color={c.surJaune} />
        <Text style={{ color: c.surJaune, fontSize: 21, fontWeight: '800', textAlign: 'center' }}>{t('Tout préparer')}</Text>
      </Pressable>
      <Text style={{ color: c.muted, fontSize: 15, textAlign: 'center' }}>
        {t('≈ {taille} · Wi-Fi conseillé · une seule fois', { taille: formatTaille(total) })}
      </Text>

      <Pressable
        onPress={() => terminer('/recevoir')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: c.card, borderRadius: 12, padding: space.md }}>
        <Ionicons name="phone-portrait" size={24} color={c.accent} />
        <Text style={{ color: c.text, fontSize: 15, flex: 1 }}>
          <Text style={{ fontWeight: '800' }}>{t('Pas d’Internet ?')}</Text> {t('Récupère tout depuis le téléphone d’un proche qui a Refuge (Wi-Fi local, sans réseau).')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={c.muted} />
      </Pressable>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={() => terminer('/sos')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderColor: c.danger, borderRadius: 12, padding: space.md }}>
        <Ionicons name="alert-circle" size={24} color={c.danger} />
        <Text style={{ color: c.text, fontSize: 15, flex: 1 }}>{t('Urgence maintenant ? Les fiches de secours et les numéros marchent déjà, sans rien télécharger.')}</Text>
      </Pressable>
      <Pressable onPress={() => terminer('/')} hitSlop={8}>
        <Text style={{ color: c.muted, fontSize: 15, textAlign: 'center', textDecorationLine: 'underline' }}>{t('Plus tard')}</Text>
      </Pressable>

      <FenetreKit visible={fenetre} onFermer={() => setFenetre(false)} onLance={() => terminer('/autorisations')} />
    </ScrollView>
  );
}
