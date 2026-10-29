import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { BoutonsStatut } from '@/components/BoutonsStatut';
import { Bouton, Ecran, Ligne, Sous, Texte } from '@/components/ui';
import { FICHES } from '@/data/fiches';
import { usePays } from '@/lib/pays';
import { c } from '@/lib/theme';
import { t, traduireFiche } from '@/i18n';

/** Bouton SOS au centre de la barre : tout ce qui sert dans l'urgence, rien d'autre. */
export default function Urgence() {
  const vitales = FICHES.filter((f) => f.cat === 'vital');
  const [pays] = usePays();

  return (
    <Ecran>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label={t('Appeler le 112')} icone="call" couleur={c.danger} grand onPress={() => Linking.openURL('tel:112')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label={t('Numéros {drapeau}', { drapeau: pays.drapeau })} icone="list" discret onPress={() => router.push('/pays')} />
        </View>
      </View>

      <Bouton label={t('Que se passe-t-il ?')} icone="help-buoy" grand onPress={() => router.push('/guide')} />
      <Texte muted>{t('Réponds à 2 ou 3 questions : l’appli te donne les bons réflexes selon l’endroit où tu es.')}</Texte>
      <Bouton label={t('J’ai peur, je panique')} icone="heart-circle" couleur="#2dd4bf" onPress={() => router.push('/panique')} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 3 }}>
          <Bouton label={t('Parler à l’IA')} icone="mic" couleur={c.info} grand onPress={() => router.push({ pathname: '/demander', params: { voix: '1' } })} />
        </View>
        <View style={{ flex: 2 }}>
          <Bouton label={t('Écrire')} icone="create" discret grand onPress={() => router.push('/demander')} />
        </View>
      </View>

      <Sous>{t('Prévenir mes proches')}</Sous>
      <BoutonsStatut />

      <Sous>{t('Urgences vitales')}</Sous>
      <Bouton label={t('Massage cardiaque : métronome')} icone="pulse" couleur={c.danger} onPress={() => router.push('/rcp')} />
      {vitales.map((f) => (
        <Ligne key={f.id} titre={traduireFiche(f).titre} icone="heart" couleur={c.danger} onPress={() => router.push(`/fiche/${f.id}`)} />
      ))}
    </Ecran>
  );
}
