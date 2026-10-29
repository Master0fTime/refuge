import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Bouton } from '@/components/ui';
import { formatTaille } from '@/lib/ia/modeles';
import { packs, type IdPack } from '@/lib/packs';
import { preparer, taillePack, usePreparation } from '@/lib/preparation';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

/**
 * « Ce qui va être installé » : tout est coché par défaut, un seul bouton lance tout.
 * « Personnaliser » permet de décocher, pour les téléphones qui manquent de place.
 */
export function FenetreKit({ visible, onFermer, onLance }: { visible: boolean; onFermer: () => void; onLance?: () => void }) {
  const { prets } = usePreparation();
  const liste = packs().filter((p) => p.disponible && p.id !== 'fiches');
  const [choix, setChoix] = useState<Partial<Record<IdPack, boolean>>>({});
  const [perso, setPerso] = useState(false);

  useEffect(() => {
    if (visible) setChoix(Object.fromEntries(liste.map((p) => [p.id, true])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const aFaire = liste.filter((p) => !prets[p.id] && choix[p.id]);
  const total = aFaire.reduce((s, p) => s + taillePack(p), 0);

  const lancer = async () => {
    const go = () => {
      onFermer();
      onLance?.();
      preparer(aFaire.map((p) => p.id)).then((erreur) => erreur && Alert.alert(t('Téléchargement interrompu'), erreur));
    };
    const n = await Network.getNetworkStateAsync();
    const wifi = n.type === Network.NetworkStateType.WIFI || n.type === Network.NetworkStateType.ETHERNET;
    if (!wifi) {
      Alert.alert(t('Pas de Wi-Fi'), t('Tu vas télécharger {v1} avec tes données mobiles. Continuer ?', { v1: formatTaille(total) }), [
        { text: t('Annuler') },
        { text: t('Continuer'), onPress: go },
      ]);
    } else go();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onFermer} />
      <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, gap: space.md, maxHeight: '85%' }}>
        <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: c.border }} />
        <Text style={{ color: c.text, fontSize: 21, fontWeight: '800' }}>{t('Ce qui va être installé')}</Text>
        <ScrollView contentContainerStyle={{ gap: 2 }}>
          {liste.map((p) => {
            const deja = !!prets[p.id];
            const coche = deja || !!choix[p.id];
            return (
              <Pressable
                key={p.id}
                disabled={!perso || deja}
                onPress={() => setChoix((x) => ({ ...x, [p.id]: !x[p.id] }))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: coche ? c.accent : c.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={p.icone} size={22} color={coche ? c.surJaune : c.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{t(p.nom)}</Text>
                  <Text style={{ color: c.muted, fontSize: 14, lineHeight: 19 }}>{t(p.utilite)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: deja ? c.ok : c.muted, fontSize: 13, fontWeight: '700' }}>{deja ? t('Installé') : `≈ ${formatTaille(taillePack(p))}`}</Text>
                  {perso && !deja && <Ionicons name={coche ? 'checkbox' : 'square-outline'} size={24} color={coche ? c.accent : c.muted} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {aFaire.length ? (
          <Bouton label={t('Lancer ({v1})', { v1: formatTaille(total) })} icone="download" grand onPress={lancer} />
        ) : (
          <Bouton label={t('Fermer')} discret onPress={onFermer} />
        )}
        <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>
          {t('Wi-Fi conseillé. Tu peux utiliser l’appli pendant le téléchargement.')}
        </Text>
        {!perso && (
          <Pressable onPress={() => setPerso(true)} hitSlop={8}>
            <Text style={{ color: c.accent, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{t('Personnaliser')}</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}
