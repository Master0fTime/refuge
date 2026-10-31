import type { Contact, Groupe, Profil } from './types';

// Format des QR codes échangés entre téléphones, sans Internet.
const PREFIXE = 'REFUGE1:';

export type PayloadContact = { t: 'c'; id: string; nom: string; tel?: string };
export type PayloadGroupe = { t: 'g'; g: Groupe };
export type Payload = PayloadContact | PayloadGroupe;

export const encoder = (p: Payload) => PREFIXE + JSON.stringify(p);

export function decoder(data: string): Payload | null {
  if (!data.startsWith(PREFIXE)) return null;
  try {
    const p = JSON.parse(data.slice(PREFIXE.length));
    if (p?.t === 'c' && typeof p.id === 'string' && typeof p.nom === 'string') return p;
    if (p?.t === 'g' && typeof p.g?.id === 'string' && Array.isArray(p.g.points)) return p;
  } catch {}
  return null;
}

export const payloadProfil = (p: Profil): PayloadContact => ({
  t: 'c',
  id: p.id,
  nom: `${p.prenom} ${p.nom}`.trim() || 'Sans nom',
  tel: p.telephone || undefined,
});

export function ajouterContact(contacts: Contact[], p: PayloadContact): Contact[] {
  const existant = contacts.find((c) => c.id === p.id);
  if (existant) return contacts.map((c) => (c.id === p.id ? { ...c, nom: p.nom, telephone: p.tel } : c));
  return [...contacts, { id: p.id, nom: p.nom, telephone: p.tel, prioritaire: false, ajouteLe: Date.now() }];
}

/** Fusionne un groupe reçu : la version la plus récente gagne, les membres s'additionnent. */
export function fusionnerGroupe(groupes: Groupe[], recu: Groupe): Groupe[] {
  const local = groupes.find((g) => g.id === recu.id);
  if (!local) return [...groupes, recu];
  const base = recu.majLe > local.majLe ? recu : local;
  const membres = [...local.membres];
  // Les surnoms donnés localement ne voyagent pas : on garde ceux de ce téléphone.
  for (const { surnom: _, ...m } of recu.membres) if (!membres.some((x) => x.id === m.id)) membres.push(m);
  return groupes.map((g) => (g.id === recu.id ? { ...base, membres } : g));
}

/** Texte lisible pour SMS : le réseau GSM fonctionne souvent quand Internet est coupé. */
export function texteGroupe(g: Groupe) {
  const pts = [...g.points]
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => `${p.ordre}. ${p.nom} : ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}${p.note ? ` (${p.note})` : ''}`)
    .join('\n');
  return [
    `PLAN ${g.nom.toUpperCase()}`,
    pts && `Points de ralliement :\n${pts}`,
    g.plan.consignes && `Consignes : ${g.plan.consignes}`,
    g.plan.canalRadio && `Radio : ${g.plan.canalRadio}`,
    g.plan.vacations && `Vacations : ${g.plan.vacations}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
