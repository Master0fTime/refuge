import { Ionicons } from '@expo/vector-icons';
import { useBatteryLevel } from 'expo-battery';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { useUpdates } from 'expo-updates';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FenetreKit } from '@/components/FenetreKit';
import type { IconName } from '@/components/ui';
import { appliquerContenu, useApkDisponible } from '@/lib/mises-a-jour';
import { packs, type IdPack } from '@/lib/packs';
import { usePreparation } from '@/lib/preparation';
import { KEYS, useStored } from '@/lib/store';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

type Tuile = { nom: string; icone: IconName; route: Href; pack?: IdPack; rouge?: true };

// L'accueil ressemble à l'écran d'un téléphone : une tuile = un outil. 3 × 3, sans défiler.
const TUILES: Tuile[] = [
  { nom: 'Secours', icone: 'medkit', route: { pathname: '/savoir', params: { mode: 'fiches' } }, rouge: true },
  { nom: 'IA', icone: 'chatbubbles', route: '/demander', pack: 'ia' },
  { nom: 'Carte', icone: 'map', route: '/carte', pack: 'cartes' },
  { nom: 'Wikipédia', icone: 'library', route: { pathname: '/savoir', params: { mode: 'encyclo' } }, pack: 'encyclopedie' },
  { nom: 'Photo', icone: 'camera', route: { pathname: '/demander', params: { photo: '1' } }, pack: 'vision' },
  { nom: 'Que faire ?', icone: 'help-buoy', route: '/guide' },
  { nom: 'Numéros', icone: 'call', route: '/pays', rouge: true },
  { nom: 'Outils', icone: 'flashlight', route: '/outils' },
  { nom: 'Réglages', icone: 'settings', route: '/reglages' },
];

export default function Accueil() {
  const insets = useSafeAreaInsets();
  const [accueilVu] = useStored<boolean>(KEYS.accueilVu, false);
  const { prets, progres, enCours, file } = usePreparation();
  const [fenetre, setFenetre] = useState(false);
  const batterie = useBatteryLevel();
  const { isUpdatePending, isUpdateAvailable } = useUpdates();
  const nouvelApk = useApkDisponible();

  // Premier lancement : l'écran de bienvenue explique pourquoi tout télécharger maintenant.
  useEffect(() => {
    if (!accueilVu) router.push('/bienvenue');
  }, [accueilVu]);

  const utiles = packs().filter((p) => p.disponible && !p.facultatif);
  const charge = Object.keys(prets).length > 0;
  const part = utiles.filter((p) => prets[p.id]).length / utiles.length;
  const heure = new Date().getHours();
  const salut = heure < 5 || heure >= 18 ? t('Bonsoir') : t('Bonjour');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.lg, gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>{salut}</Text>
          <Text style={{ color: c.muted, fontSize: 15 }}>
            {t('Tout fonctionne hors ligne')}
            {batterie >= 0 ? ` · ${t('batterie {n} %', { n: Math.round(batterie * 100) })}` : ''}
          </Text>
        </View>
        {charge && (
          <Pressable
            onPress={() => setFenetre(true)}
            style={{ backgroundColor: part === 1 ? c.accent : c.cardAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Ionicons name={part === 1 ? 'checkmark-circle' : 'download'} size={16} color={part === 1 ? c.surJaune : c.accent} />
            <Text style={{ color: part === 1 ? c.surJaune : c.text, fontWeight: '800', fontSize: 13 }}>
              {part === 1 ? t('Kit prêt') : t('Kit {n} %', { n: Math.round(part * 100) })}
            </Text>
          </Pressable>
        )}
      </View>

      {enCours ? (
        <View style={{ backgroundColor: c.card, borderRadius: 14, padding: space.md, gap: 6 }}>
          <Text style={{ color: c.text, fontWeight: '700' }}>
            {t('Téléchargement : {nom} · {n} %', { nom: t(packs().find((p) => p.id === enCours)?.nom ?? ''), n: Math.round((progres[enCours] ?? 0) * 100) })}
          </Text>
          <View style={{ height: 6, backgroundColor: c.cardAlt, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round((progres[enCours] ?? 0) * 100)}%`, height: '100%', backgroundColor: c.accent }} />
          </View>
          <Text style={{ color: c.muted, fontSize: 13 }}>
            {file.length ? t('Encore {n} après celui-ci. Garde l’appli ouverte.', { n: file.length }) : t('Dernier élément. Garde l’appli ouverte.')}
          </Text>
        </View>
      ) : (
        charge &&
        part < 1 && (
          <Pressable onPress={() => setFenetre(true)} style={{ backgroundColor: c.accent, borderRadius: 14, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name="download" size={24} color={c.surJaune} />
            <Text style={{ color: c.surJaune, fontWeight: '800', fontSize: 16, flex: 1 }}>{t('Ton kit n’est pas complet. Terminer maintenant')}</Text>
            <Ionicons name="chevron-forward" size={20} color={c.surJaune} />
          </Pressable>
        )
      )}

      {(nouvelApk || isUpdatePending || isUpdateAvailable) && (
        <Pressable
          onPress={() => (isUpdatePending && !nouvelApk ? appliquerContenu() : router.push('/mises-a-jour'))}
          style={{ backgroundColor: c.card, borderRadius: 14, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="refresh-circle" size={26} color={c.info} />
          <Text style={{ color: c.text, flex: 1 }}>
            {nouvelApk
              ? t('Nouvelle version de Refuge disponible ({version}) : elle n’est pas encore installée.', { version: nouvelApk.version })
              : t('Une mise à jour de Refuge est disponible et n’est pas encore installée.')}
          </Text>
        </Pressable>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.xl, marginTop: space.sm }}>
        {TUILES.map((tu) => (
          <TuileAppli key={tu.nom} tuile={tu} pret={!tu.pack || !charge || !!prets[tu.pack]} progres={tu.pack && enCours === tu.pack ? progres[tu.pack] ?? 0 : undefined} />
        ))}
      </View>

      <FenetreKit visible={fenetre} onFermer={() => setFenetre(false)} />
    </ScrollView>
  );
}

function TuileAppli({ tuile, pret, progres }: { tuile: Tuile; pret: boolean; progres?: number }) {
  const fond = tuile.rouge ? c.danger : pret ? c.accent : c.cardAlt;
  const encre = tuile.rouge ? '#fff' : pret ? c.surJaune : c.muted;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        router.push(tuile.route);
      }}
      accessibilityRole="button"
      accessibilityLabel={t(tuile.nom)}
      style={({ pressed }) => ({ width: '33.33%', alignItems: 'center', gap: 8, transform: [{ scale: pressed ? 0.93 : 1 }] })}>
      <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: fond, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={tuile.icone} size={36} color={encre} />
        {progres !== undefined && (
          <View style={{ position: 'absolute', bottom: 8, left: 10, right: 10, height: 5, borderRadius: 3, backgroundColor: c.bg, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(progres * 100)}%`, height: '100%', backgroundColor: c.accent }} />
          </View>
        )}
        {!pret && progres === undefined && <View style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: c.accent, borderWidth: 3, borderColor: c.bg }} />}
      </View>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{t(tuile.nom)}</Text>
    </Pressable>
  );
}
