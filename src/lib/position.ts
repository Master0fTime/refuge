import * as Location from 'expo-location';
import { t } from '@/i18n';

export async function positionActuelle() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new Error(t('Autorise la localisation pour utiliser le GPS.'));
  // Le GPS fonctionne sans réseau : on demande une précision élevée pour forcer la puce GPS.
  return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
}
