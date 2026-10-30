import * as Notifications from 'expo-notifications';
import { t } from '@/i18n';

// Rappels de préparation, programmés sur le téléphone (aucun serveur) : un kit n'est utile que s'il est à jour.

const JOUR = 24 * 3600;
const RAPPELS = [
  { titre: 'Batterie externe', corps: 'Recharge ta batterie externe : elle se vide toute seule avec le temps.', jours: 30 },
  { titre: 'Réserves et trousse', corps: 'Vérifie tes réserves d’eau et de nourriture, les piles et les dates de tes médicaments.', jours: 182 },
  { titre: 'Refuge à jour', corps: 'Ouvre Refuge avec du Wi-Fi : mises à jour, cartes et contacts de ton groupe.', jours: 90 },
];

/** Active les rappels. Renvoie false si les notifications sont refusées. */
export async function activerRappels() {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  await Notifications.setNotificationChannelAsync('rappels', { name: t('Rappels de préparation'), importance: Notifications.AndroidImportance.DEFAULT });
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of RAPPELS) {
    await Notifications.scheduleNotificationAsync({
      content: { title: t(r.titre), body: t(r.corps) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: r.jours * JOUR, repeats: true, channelId: 'rappels' },
    });
  }
  return true;
}

export const desactiverRappels = () => Notifications.cancelAllScheduledNotificationsAsync();

export async function rappelsActifs() {
  return (await Notifications.getAllScheduledNotificationsAsync()).length > 0;
}
