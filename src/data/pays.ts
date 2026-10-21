// Informations qui changent d'un pays à l'autre. Les fiches utilisent des variables ({secours},
// {police}…) remplacées selon le pays choisi : le même contenu sert partout.
// À FAIRE VÉRIFIER par une personne de chaque pays avant diffusion (champ `verifie`).

export type Numero = { nom: string; numero: string };

export type Pays = {
  code: 'CH' | 'FR' | 'DE' | 'IT' | 'AT' | 'LI';
  nom: string;
  drapeau: string;
  police: string;
  ambulance: string;
  pompiers: string;
  antipoison: string;
  antipoisonNom: string;
  aidePsy: string;
  aidePsyNom: string;
  /** SMS d'urgence (personnes sourdes, ou quand on ne peut pas parler). */
  sms?: string;
  autres: Numero[];
  alerteApp: string;
  sirenes: string[];
  radios: string;
  orgsAide: string;
  abris?: string;
  provisions?: string;
  verifie: boolean;
};

export const PAYS: Pays[] = [
  {
    code: 'CH',
    nom: 'Suisse',
    drapeau: '🇨🇭',
    police: '117',
    ambulance: '144',
    pompiers: '118',
    antipoison: '145',
    antipoisonNom: 'Tox Info Suisse',
    aidePsy: '143',
    aidePsyNom: 'La Main Tendue',
    autres: [
      { nom: 'Rega (sauvetage aérien)', numero: '1414' },
      { nom: 'Pro Juventute (enfants et jeunes)', numero: '147' },
    ],
    alerteApp: 'Alertswiss',
    sirenes: [
      'ALARME GÉNÉRALE : son oscillant continu pendant 1 minute, répété après 2 minutes → écoute la radio, suis les consignes des autorités, informe tes voisins.',
      'ALARME EAU : série de sons graves continus (12 fois 20 secondes, à 10 secondes d’intervalle) → quitte immédiatement la zone menacée (en aval d’un barrage).',
      'Essai annuel des sirènes : premier mercredi de février, à 13 h 30.',
    ],
    radios: 'RTS La Première, SRF 1, RSI Rete Uno',
    orgsAide: 'Croix-Rouge suisse, Caritas, Table Suisse, Tischlein deck dich, Armée du Salut',
    abris: 'Chaque habitant dispose d’une place dans un abri de la protection civile. Ta commune (ou ta gérance) peut te dire lequel. Les autorités annoncent quand s’y rendre.',
    provisions: 'La Confédération recommande une réserve de 9 litres d’eau par personne et de la nourriture pour une semaine.',
    verifie: false,
  },
  {
    code: 'FR',
    nom: 'France',
    drapeau: '🇫🇷',
    police: '17',
    ambulance: '15',
    pompiers: '18',
    antipoison: '15',
    antipoisonNom: 'centre antipoison (via le 15)',
    aidePsy: '3114',
    aidePsyNom: 'numéro national de prévention du suicide',
    sms: '114',
    autres: [
      { nom: 'Violences femmes info', numero: '3919' },
      { nom: 'Enfance en danger', numero: '119' },
    ],
    alerteApp: 'FR-Alert',
    sirenes: [
      'SIGNAL NATIONAL D’ALERTE : son montant et descendant de 1 minute 41 secondes, répété 3 fois → mets-toi à l’abri dans un bâtiment et écoute la radio.',
      'Fin d’alerte : son continu de 30 secondes.',
      'Essai : premier mercredi du mois, à midi.',
    ],
    radios: 'France Inter, France Info, ICI (ex-France Bleu)',
    orgsAide: 'Restos du Cœur, Secours populaire, Secours catholique, banques alimentaires, CCAS de la mairie',
    verifie: false,
  },
  {
    code: 'DE',
    nom: 'Allemagne',
    drapeau: '🇩🇪',
    police: '110',
    ambulance: '112',
    pompiers: '112',
    antipoison: '112',
    antipoisonNom: 'Giftnotruf de ta région (ou le 112)',
    aidePsy: '0800 111 0 111',
    aidePsyNom: 'Telefonseelsorge',
    autres: [{ nom: 'Médecin de garde (Ärztlicher Bereitschaftsdienst)', numero: '116117' }],
    alerteApp: 'NINA (et alertes DE-Alert)',
    sirenes: [
      'ALERTE : son montant et descendant pendant 1 minute → mets-toi à l’abri et écoute la radio.',
      'Fin d’alerte : son continu de 1 minute.',
      'Journée nationale d’alerte : deuxième jeudi de septembre.',
    ],
    radios: 'Deutschlandfunk, stations régionales de l’ARD (WDR, BR, SWR, NDR…)',
    orgsAide: 'Tafel (banques alimentaires), DRK (Croix-Rouge allemande), Caritas, Diakonie',
    verifie: false,
  },
  {
    code: 'IT',
    nom: 'Italie',
    drapeau: '🇮🇹',
    police: '113',
    ambulance: '118',
    pompiers: '115',
    antipoison: '118',
    antipoisonNom: 'Centro antiveleni (via le 118)',
    aidePsy: '02 2327 2327',
    aidePsyNom: 'Telefono Amico',
    autres: [{ nom: 'Carabinieri', numero: '112' }],
    alerteApp: 'IT-alert',
    sirenes: ['Pas de signal de sirène national unique : suis IT-alert et les consignes de la Protezione Civile de ta commune.'],
    radios: 'Rai Radio 1, Isoradio',
    orgsAide: 'Croce Rossa Italiana, Caritas, Banco Alimentare, Protezione Civile',
    verifie: false,
  },
  {
    code: 'AT',
    nom: 'Autriche',
    drapeau: '🇦🇹',
    police: '133',
    ambulance: '144',
    pompiers: '122',
    antipoison: '01 406 43 43',
    antipoisonNom: 'Vergiftungsinformationszentrale',
    aidePsy: '142',
    aidePsyNom: 'Telefonseelsorge',
    autres: [
      { nom: 'Secours en montagne (Bergrettung)', numero: '140' },
      { nom: 'Médecin de garde (Ärztefunkdienst)', numero: '141' },
    ],
    alerteApp: 'AT-Alert',
    sirenes: [
      'AVERTISSEMENT (Warnung) : son continu de 3 minutes → un danger approche, écoute la radio.',
      'ALARME : son montant et descendant pendant 1 minute → danger immédiat, mets-toi à l’abri et écoute la radio.',
      'Fin d’alerte (Entwarnung) : son continu de 1 minute.',
      'Essai : chaque samedi à midi (15 secondes), grand essai national le premier samedi d’octobre.',
    ],
    radios: 'Ö1, Ö3, radios régionales de l’ORF',
    orgsAide: 'Croix-Rouge autrichienne, Caritas, Volkshilfe, Tafel Österreich',
    verifie: false,
  },
  {
    code: 'LI',
    nom: 'Liechtenstein',
    drapeau: '🇱🇮',
    police: '117',
    ambulance: '144',
    pompiers: '118',
    antipoison: '145',
    antipoisonNom: 'Tox Info Suisse',
    aidePsy: '143',
    aidePsyNom: 'Telefonseelsorge',
    autres: [{ nom: 'Rega (sauvetage aérien)', numero: '1414' }],
    alerteApp: 'les consignes des autorités (Radio Liechtenstein)',
    sirenes: ['Sirènes sur le modèle suisse : son oscillant continu = alarme générale → écoute la radio et suis les consignes.'],
    radios: 'Radio Liechtenstein, SRF 1',
    orgsAide: 'Croix-Rouge du Liechtenstein, Caritas Liechtenstein',
    verifie: false,
  },
];

export const PAYS_DEFAUT: Pays['code'] = 'CH';

/** Pays proposé au premier lancement : celui du téléphone s'il est connu, sinon la Suisse. */
export function paysDuTelephone(): Pays['code'] {
  try {
    const region = new Intl.DateTimeFormat().resolvedOptions().locale.split('-').pop()?.toUpperCase();
    return PAYS.find((p) => p.code === region)?.code ?? PAYS_DEFAUT;
  } catch {
    return PAYS_DEFAUT;
  }
}
