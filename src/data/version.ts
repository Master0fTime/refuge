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
    version: '0.7.6',
    date: '2026-10-22',
    points: [
      'Envoie une photo à l’IA (bouton 📷 dans « Poser une question ») : elle dit ce qu’elle voit (lieu, objet, boîte de médicament…) et répond à ta question, sans Internet.',
      'À installer une fois depuis « IA hors ligne » → « Comprendre une photo » (environ 1,5 Go).',
      'Champignons, plantes, baies, médicaments : un avertissement fixe s’affiche toujours, quoi que dise l’IA.',
    ],
  },
  {
    version: '0.7.5',
    date: '2026-10-22',
    points: [
      'Encyclopédie hors ligne : environ 15 000 articles de médecine de Wikipédia (maladies, symptômes, traitements), à installer depuis « Préparer mon téléphone ».',
      'L’IA s’en sert pour mieux expliquer, en citant [E1] ; les gestes viennent toujours d’abord des fiches.',
      'La recherche de l’onglet Savoir montre aussi les articles de l’encyclopédie.',
    ],
  },
  {
    version: '0.7.4',
    date: '2026-10-22',
    points: [
      'Toute l’appli en allemand et en italien : réglages, outils, cartes, groupe, carte de vie, partage, mises à jour.',
      'Les SMS « Je vais bien » / « J’ai besoin d’aide » partent dans la langue choisie.',
      'Infos pays traduites : centres antipoison, radios, abris, réserves, organisations d’aide.',
    ],
  },
  {
    version: '0.7.3',
    date: '2026-10-22',
    points: [
      'Refuge est désormais un projet ouvert sur GitHub (github.com/Master0fTime/refuge).',
      'Les nouvelles versions complètes sont cherchées directement sur GitHub : le lien de téléchargement n’expire plus.',
    ],
  },
  {
    version: '0.7.2',
    date: '2026-10-22',
    points: [
      'Allemand et italien : les 72 fiches, l’assistant guidé, le mode « Je panique », le massage cardiaque et les écrans principaux.',
      'Langue au choix dans « Pays, langue et numéros » ; l’IA et la voix suivent la langue choisie.',
      'Alertes d’urgence reconnues aussi en allemand et en italien.',
    ],
  },
  {
    version: '0.7.1',
    date: '2026-10-22',
    points: [
      'Métronome de massage cardiaque : son et vibration à 110 par minute, cycles 30/2, rappel de relais toutes les 2 minutes.',
      'Boutons « Je vais bien » et « J’ai besoin d’aide » : un SMS avec ta position à tout ton groupe.',
      'Bouton « Écouter la fiche » : les gestes lus à voix haute, mains libres.',
      'Schémas : massage cardiaque, PLS, étouffement, garrot.',
    ],
  },
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
