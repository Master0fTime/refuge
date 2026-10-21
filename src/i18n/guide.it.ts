import type { GuideTraduit } from './index';

export const GUIDE_IT: GuideTraduit = {
  lieux: {
    maison: 'A casa / in un edificio',
    ville: 'Fuori, in città',
    nature: 'Bosco / campagna',
    montagne: 'Montagna',
    eau: 'Vicino all’acqua (mare, lago, fiume)',
    vehicule: 'In auto / sulla strada',
  },
  problemes: {
    blesse: {
      label: 'Qualcuno è ferito o ha un malore',
      tri: {
        question: 'Che cosa vedi?',
        options: [
          'Sanguina molto',
          'Non risponde e non respira',
          'Non risponde ma respira',
          'Sta soffocando, non riesce più a parlare',
          'Ustione',
          'Più feriti insieme',
          'Osso rotto, distorsione',
          'Un parto sta iniziando',
          'Altra ferita (taglio, caduta…)',
        ],
      },
      commun: {
        immediat: [
          'Prima proteggiti: se c’è un pericolo (traffico, fuoco, caduta sassi), eliminalo o sposta la persona solo se è indispensabile.',
          'Chiama il {secours}. Se non passa: {smsOu}riprova da un punto più alto.',
          'Parla alla persona, rassicurala, non darle da bere se potrebbe dover essere operata.',
          'Non spostare una persona caduta dall’alto che ha male alla schiena o al collo, salvo pericolo immediato.',
        ],
        ensuite: [
          'Copri la persona (anche d’estate lo shock fa perdere calore).',
          'Controlla ogni 5 minuti: risponde? respira?',
          'Annota l’ora dell’incidente e cosa è successo, per i soccorsi.',
        ],
      },
      lieux: {
        montagne: {
          immediat: ['Isola la persona dal suolo e proteggila dal vento: il freddo peggiora tutto.'],
          ensuite: ['Soccorso in montagna: 112. Senza rete, segnale di soccorso: 6 fischi al minuto.'],
        },
        eau: { immediat: ['Annegamento: tirala fuori dall’acqua senza metterti in pericolo (porgi un ramo o lancia qualcosa che galleggia). Se non respira: 5 insufflazioni, poi massaggio cardiaco.'] },
        vehicule: {
          immediat: [
            'Accendi le quattro frecce, indossa il gilet, posiziona il triangolo (se senza pericolo), spegni il motore.',
            'Non togliere il casco a un motociclista (salvo se non respira e bisogna rianimarlo).',
          ],
        },
        nature: { ensuite: ['Se devi lasciare la persona per cercare rete o aiuto: salva la posizione GPS (scheda Strumenti) per poter tornare.'] },
      },
    },
    perdu: {
      label: 'Mi sono perso',
      commun: {
        immediat: [
          'S.T.O.P.: Sosta, Tranquillizzati, Osserva, Pianifica. Non camminare a caso.',
          'Il tuo GPS funziona SENZA Internet: apri la scheda Strumenti per vedere la tua posizione e annotarla.',
          'Risparmia la batteria: modalità aereo (il GPS resta attivo), luminosità al minimo.',
        ],
        ensuite: [
          'Se qualcuno sa dove sei: resta dove sei, è più facile ritrovarti.',
          'Altrimenti, prima di muoverti: lascia un segno (freccia di sassi o rami, biglietto) con la direzione presa.',
          'Prima della notte (1 ora e mezza prima): fermati e prepara un riparo.',
        ],
      },
      lieux: {
        nature: {
          ensuite: [
            'Sali su un punto alto per vedere e prendere la rete.',
            'Seguire un corso d’acqua verso valle porta spesso a delle case (ma non in gole o dirupi).',
            'Cerca un sentiero, una linea elettrica, una recinzione: portano agli esseri umani.',
          ],
        },
        montagne: {
          immediat: ['Con la nebbia o su terreno ripido: NON scendere a caso (dirupi). Resta dove sei e segnalati.'],
          ensuite: ['Non scendere mai in un burrone o un canalone sconosciuto.'],
        },
        ville: { ensuite: ['Cerca una strada principale, una stazione o un edificio pubblico (municipio, ospedale, scuola): sono spesso punti di raccolta.'] },
      },
    },
    separe: {
      label: 'Sono separato dai miei cari',
      commun: {
        immediat: [
          'Apri la scheda Gruppo: lì ci sono il tuo piano, i punti di ritrovo e il canale radio.',
          'Manda un SMS breve (passa meglio di una chiamata): «[Nome] OK, a [luogo], vado al punto 1.»',
          'Avvisa il vostro contatto di riferimento fuori regione.',
        ],
        ensuite: [
          'Applica il piano: raggiungi il punto 1 (o il punto 2 dopo il tempo concordato).',
          'Lasciando un luogo, lascia un messaggio visibile: nome, ora, destinazione.',
          'Radio: accendi solo agli orari di collegamento concordati.',
        ],
      },
    },
    froid: {
      label: 'Ho freddo / fa molto freddo',
      commun: {
        immediat: [
          'Ripararsi dal VENTO e dall’UMIDITÀ.',
          'Isolarsi dal suolo (zaino, cartone, rami): è la priorità numero 1.',
          'Togliere i vestiti bagnati. Coprire testa, collo e mani.',
        ],
        ensuite: ['Mangiare e bere caldo se possibile: il corpo ha bisogno di energia per riscaldarsi.', 'Stringersi gli uni agli altri.'],
      },
      lieux: {
        maison: {
          immediat: ['Riscaldamento guasto: riunisci tutti in UNA sola stanza piccola, isola (coperte alle finestre, asciugamani sotto le porte).'],
          ensuite: [
            'MAI barbecue, generatore né stufetta a gas all’interno: il monossido di carbonio uccide senza odore.',
            'Dormire vestiti, berretto in testa, in più persone sotto le coperte.',
          ],
        },
        vehicule: {
          immediat: [
            'Bloccato nella neve: resta DENTRO il veicolo.',
            'Libera il tubo di scarico dalla neve prima di accendere il motore, poi fallo girare 10 minuti all’ora con un finestrino socchiuso (rischio di monossido di carbonio).',
          ],
        },
      },
    },
    chaleur: {
      label: 'Fa molto caldo',
      commun: {
        immediat: ['Ombra, riposo, bere regolarmente senza aspettare la sete.', 'Bagnare pelle e vestiti, fare aria.'],
        ensuite: ['Muoversi solo al mattino presto o alla sera.', 'Sorvegliare i più fragili: neonati, anziani, malati.'],
      },
      lieux: {
        maison: { immediat: ['Chiudi finestre e persiane di giorno, apri di notte per fare corrente. Resta nella stanza più fresca.'] },
        vehicule: { immediat: ['Non lasciare MAI un bambino o un animale in auto, nemmeno 5 minuti.'] },
      },
    },
    eau: {
      label: 'Non ho più acqua potabile',
      commun: { immediat: ['Limitare le perdite: ombra, pochi sforzi, niente cibi salati.', 'Non bere acqua di mare né urina.'] },
      lieux: {
        maison: {
          immediat: [
            'Interruzione annunciata: riempi SUBITO vasca, pentole e bottiglie.',
            'Riserve nascoste: boiler (rubinetto in basso), cassetta del WC, cubetti di ghiaccio, verdure in scatola (il liquido).',
          ],
        },
        nature: { immediat: ['Cerca scendendo: fondovalle, vegetazione verde, insetti, uccelli.'] },
      },
    },
    faim: {
      label: 'Non abbiamo più niente da mangiare',
      commun: {
        immediat: [
          'Niente panico: si resiste settimane senza mangiare, ma solo 3 giorni senz’acqua. Assicurati prima di avere acqua.',
          'Risparmia energia: pochi sforzi, stare al caldo.',
          'Se ci sono bambini, malati o anziani, mangiano per primi.',
        ],
        ensuite: ['Non mangiare mai una pianta o un fungo che non riconosci al 100 %.'],
      },
      lieux: {
        ville: {
          immediat: [
            'Cerca l’aiuto organizzato: comune, {orgsAide}, luoghi di culto. Ascolta la radio ({radios}) per i punti di distribuzione.',
            'Chiedi ai vicini e ai negozi del quartiere, proponendo uno scambio o il tuo aiuto.',
          ],
          ensuite: ['Evita gli assembramenti davanti ai negozi in periodi di disordini.'],
        },
        maison: {
          immediat: ['Fai l’inventario completo degli armadi: spesso si dimenticano scatolette, riso, pasta, zucchero.', 'Mangia prima ciò che scade (frigo, poi congelatore).'],
        },
        nature: { ensuite: ['Piante facili e sicure: ortica (cotta), tarassaco, piantaggine, more, a patto di riconoscerle con certezza.'] },
      },
    },
    nuit: {
      label: 'Devo passare la notte fuori',
      commun: {
        immediat: ['Inizia il riparo almeno 1 ora e mezza prima della notte.', 'Prima isolarsi dal suolo, poi proteggersi dal vento.'],
        ensuite: ['Prepara la legna per tutta la notte prima che faccia buio (3 volte più di quanto pensi).', 'Tieni lampada e fischietto a portata di mano.'],
      },
      lieux: { ville: { immediat: ['Cerca un luogo riparato e illuminato: stazione, atrio, parcheggio coperto, luogo di culto, centro di accoglienza.'] } },
    },
    catastrophe: {
      label: 'Catastrofe (terremoto, alluvione, incendio…)',
      tri: {
        question: 'Di che tipo?',
        options: [
          'Terremoto',
          'Qualcuno è intrappolato sotto le macerie',
          'Alluvione / acqua che sale',
          'Incendio / incendio boschivo',
          'Allarme nucleare o chimico',
          'Spari o esplosioni vicino a me',
          'Sommosse, disordini, guerra civile',
          'Altro',
        ],
      },
      commun: {
        immediat: [
          'Ascoltare la radio ({radios}) e seguire le istruzioni ufficiali ({alerteApp}).',
          'Non andare a prendere i bambini a scuola: le scuole hanno un piano di messa in sicurezza.',
          'Non telefonare, salvo urgenza vitale: solo SMS, per non saturare la rete.',
        ],
        ensuite: ['Avvisare il tuo gruppo: SMS al contatto di riferimento, poi applicare il piano.'],
      },
      lieux: {
        maison: {
          immediat: [
            'Terremoto: sotto un tavolo robusto, proteggere la testa, aspettare la fine delle scosse. Poi uscire dalle scale (non con l’ascensore) e chiudere il gas.',
            'Alluvione: salire ai piani superiori, staccare elettricità e gas. Non scendere in cantina né nel parcheggio.',
            'Nucleare o chimico: ENTRARE e restare all’interno, chiudere e sigillare, spegnere la ventilazione.',
          ],
        },
        vehicule: {
          immediat: [
            'Alluvione: non imboccare MAI una strada allagata. 30 cm d’acqua bastano a trascinare un’auto.',
            'Terremoto: fermarsi lontano da ponti, edifici e linee elettriche, restare nel veicolo.',
          ],
        },
        nature: { immediat: ['Incendio boschivo: allontanarsi perpendicolarmente al vento, verso una zona già bruciata o aperta (strada larga, campo arato, specchio d’acqua).'] },
        ville: { immediat: ['Terremoto: allontanarsi da facciate, vetrate e cavi, andare in uno spazio aperto.'] },
        eau: { immediat: ['Raggiungere subito un punto alto. Non attraversare mai a piedi acqua in movimento.'] },
      },
    },
    danger: {
      label: 'Mi sento minacciato',
      commun: {
        immediat: [
          'Allontanarsi, andare verso un luogo frequentato e illuminato.',
          'Chiamare il {police} o il 112. {smsSilencieux}',
          'Non rischiare nulla per degli oggetti: dai ciò che ti chiedono.',
        ],
        ensuite: ['Avvisare una persona cara della tua posizione (scheda Gruppo → condividi la mia posizione).'],
      },
    },
  },
};
