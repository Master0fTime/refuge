import * as SMS from 'expo-sms';
import { positionActuelle } from '@/lib/position';
import { KEYS, lire } from '@/lib/store';
import { profilVide, type Contact, type Groupe, type Profil } from '@/lib/types';

// « Je vais bien » / « J'ai besoin d'aide » : un SMS prêt pour tout le groupe et les contacts prioritaires.
// Le SMS passe souvent quand Internet et les appels sont saturés.

export type Statut = 'ok' | 'aide';

export function destinataires() {
  const profil = lire<Profil>(KEYS.profil, profilVide(''));
  const groupes = lire<Groupe[]>(KEYS.groupes, []);
  const contacts = lire<Contact[]>(KEYS.contacts, []);
  const nums = new Set<string>();
  for (const g of groupes) for (const m of g.membres) if (m.telephone && m.id !== profil.id) nums.add(m.telephone);
  for (const c of contacts) if (c.prioritaire && c.telephone) nums.add(c.telephone);
  return [...nums];
}

export async function envoyerStatut(statut: Statut) {
  const profil = lire<Profil>(KEYS.profil, profilVide(''));
  const nums = destinataires();
  if (!nums.length) throw new Error('Aucun destinataire : ajoute tes proches (onglet Groupe) avec leur numéro, ou marque des contacts ★ prioritaires.');
  if (!(await SMS.isAvailableAsync())) throw new Error('Ce téléphone ne peut pas envoyer de SMS.');

  let position = '';
  try {
    const p = await Promise.race([
      positionActuelle(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('lent')), 8000)), // pas d'attente infinie sans GPS
    ]);
    const { latitude: la, longitude: lo, accuracy } = p.coords;
    position = `\nPosition : ${la.toFixed(5)}, ${lo.toFixed(5)} (±${Math.round(accuracy ?? 0)} m)`;
  } catch {
    // Sans position, le message part quand même.
  }
  const heure = new Date().toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
  const nom = `${profil.prenom} ${profil.nom}`.trim() || 'Moi';
  const corps =
    statut === 'ok'
      ? `[Refuge] ${nom} : JE VAIS BIEN (${heure}).${position}`
      : `[Refuge] ${nom} : J'AI BESOIN D'AIDE (${heure}). Rappelle-moi ou viens si tu peux.${position}`;
  return SMS.sendSMSAsync(nums, corps);
}
