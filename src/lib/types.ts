export type Profil = {
  id: string;
  prenom: string;
  nom: string;
  naissance: string;
  telephone: string;
  groupeSanguin: string;
  allergies: string;
  traitements: string;
  antecedents: string;
  poids: string;
  langues: string;
  personneConfiance: string;
  notes: string;
};

export type Contact = {
  id: string;
  nom: string;
  telephone?: string;
  role?: string;
  prioritaire: boolean;
  ajouteLe: number;
};

export type PointRalliement = {
  id: string;
  nom: string;
  lat: number;
  lon: number;
  note: string;
  ordre: number; // 1 = principal, 2 = secours, ...
};

export type PlanGroupe = {
  consignes: string;
  canalRadio: string;
  vacations: string;
  motCode: string;
};

export type Membre = { id: string; nom: string; telephone?: string };

export type Groupe = {
  id: string;
  nom: string;
  points: PointRalliement[];
  plan: PlanGroupe;
  membres: Membre[];
  majLe: number;
};

export const profilVide = (id: string): Profil => ({
  id,
  prenom: '',
  nom: '',
  naissance: '',
  telephone: '',
  groupeSanguin: '',
  allergies: '',
  traitements: '',
  antecedents: '',
  poids: '',
  langues: '',
  personneConfiance: '',
  notes: '',
});
