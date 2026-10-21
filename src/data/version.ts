// Ce fichier voyage dans les mises à jour automatiques (EAS Update).
//
// DERNIER_APK : renseigné quand une nouvelle version COMPLÈTE de l'appli (nouvel APK) est publiée.
// Les téléphones qui ont une version plus ancienne le reçoivent par mise à jour automatique et
// proposent alors de télécharger et d'installer le nouvel APK d'un bouton.
// Procédure : voir README, section « Publier une mise à jour ».

export type VersionApk = {
  /** versionCode Android du nouvel APK (numéro de build EAS). */
  versionCode: number;
  version: string;
  url: string;
  octets: number;
  date: string;
};

export const DERNIER_APK: VersionApk | null = null;

/** Notes de version, la plus récente en premier. Affichées dans « Mises à jour ». */
export const NOUVEAUTES: { version: string; date: string; points: string[] }[] = [
  {
    version: '0.7',
    date: '2026-10-22',
    points: [
      'Mises à jour en un bouton : plus besoin de retélécharger l’appli.',
      'L’appli prévient quand une mise à jour existe et n’a pas encore été installée.',
      'Préparation de nouvelles fonctions (vibrations, luminosité, SMS de groupe, photos, impression du plan…).',
    ],
  },
  {
    version: '0.6.1',
    date: '2026-10-21',
    points: [
      '28 nouvelles fiches d’urgence : incendie, gaz, AVC, infarctus, allergie, séisme, inondation…',
      'Recherche plus juste : synonymes et correction des fautes de dictée.',
      'L’IA précise « Je ne suis pas médecin » pour les questions de santé.',
    ],
  },
  {
    version: '0.6',
    date: '2026-10-21',
    points: ['IA beaucoup plus rapide, indicateur « l’IA réfléchit », test de l’IA.', 'Choix de la langue : français, allemand, italien, anglais.'],
  },
];
