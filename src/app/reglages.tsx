import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Ecran, Ligne, Sous } from '@/components/ui';
import { useLangue } from '@/lib/langue';
import { usePays } from '@/lib/pays';
import { activerRappels, desactiverRappels, rappelsActifs } from '@/lib/rappels';
import { t } from '@/i18n';

/** Tuile « Réglages » : tout ce qui se règle une fois, rangé à l'écart des boutons d'urgence. */
export default function Reglages() {
  const [pays] = usePays();
  const [langue] = useLangue();
  const [rappels, setRappels] = useState<boolean | null>(null);
  useFocusEffect(
    useCallback(() => {
      rappelsActifs().then(setRappels).catch(() => setRappels(false));
    }, []),
  );

  const basculerRappels = async () => {
    if (rappels) {
      await desactiverRappels();
      setRappels(false);
    } else if (await activerRappels()) setRappels(true);
    else Alert.alert(t('Notifications refusées'), t('Autorise les notifications de Refuge dans les réglages du téléphone.'));
  };

  return (
    <Ecran>
      <Ligne
        titre={t('Pays, langue et numéros')}
        sous={`${pays.drapeau} ${t(pays.nom)} · ${langue.drapeau} ${langue.nom}`}
        icone="flag"
        onPress={() => router.push('/pays')}
      />

      <Sous>{t('Hors ligne')}</Sous>
      <Ligne titre={t('Téléchargements hors ligne')} sous={t('IA, voix, encyclopédie, photo, cartes')} icone="cloud-download" onPress={() => router.push('/preparer')} />
      <Ligne titre={t('Cartes hors ligne')} sous={t('Ajouter la carte détaillée de ma zone')} icone="map" onPress={() => router.push('/cartes')} />
      <Ligne titre={t('Récupérer depuis un proche')} sous={t('Sans Internet, depuis son téléphone')} icone="phone-portrait" onPress={() => router.push('/recevoir')} />

      <Sous>{t('IA')}</Sous>
      <Ligne titre={t('Réglages de l’IA')} sous={t('Changer de modèle, importer un fichier')} icone="hardware-chip" onPress={() => router.push('/ia')} />
      <Ligne titre={t('Voix de l’IA')} sous={t('Choisir une voix plus naturelle, la vitesse')} icone="volume-high" onPress={() => router.push('/reglages-voix')} />

      <Sous>{t('Téléphone')}</Sous>
      <Ligne titre={t('Autorisations utiles')} sous={t('Position, appareil photo, micro, photos')} icone="shield-checkmark" onPress={() => router.push('/autorisations')} />
      <Ligne
        titre={rappels ? t('Rappels de préparation : activés') : t('Rappels de préparation : désactivés')}
        sous={t('Batterie externe chaque mois, réserves tous les 6 mois. Touche pour changer.')}
        icone={rappels ? 'notifications' : 'notifications-off'}
        onPress={basculerRappels}
      />
      <Ligne titre={t('Fond d’écran d’urgence')} sous={t('Tes infos vitales sur l’écran verrouillé')} icone="image" onPress={() => router.push('/carte-urgence')} />
      <Ligne titre={t('Mises à jour de Refuge')} sous={t('Version installée, nouveautés, installer en un bouton')} icone="refresh-circle" onPress={() => router.push('/mises-a-jour')} />
      <Ligne titre={t('Revoir l’écran de bienvenue')} icone="home" onPress={() => router.push('/bienvenue')} />
    </Ecran>
  );
}
