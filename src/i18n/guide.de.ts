import type { GuideTraduit } from './index';

export const GUIDE_DE: GuideTraduit = {
  lieux: {
    maison: 'Zuhause / in einem Gebäude',
    ville: 'Draussen, in der Stadt',
    nature: 'Wald / Land',
    montagne: 'Berge',
    eau: 'Am Wasser (Meer, See, Fluss)',
    vehicule: 'Im Auto / auf der Strasse',
  },
  problemes: {
    blesse: {
      label: 'Jemand ist verletzt oder es geht ihm schlecht',
      tri: {
        question: 'Was siehst du?',
        options: [
          'Blutet stark',
          'Reagiert nicht und atmet nicht',
          'Reagiert nicht, atmet aber',
          'Erstickt, kann nicht mehr sprechen',
          'Verbrennung',
          'Mehrere Verletzte gleichzeitig',
          'Knochenbruch, Verstauchung',
          'Eine Geburt beginnt',
          'Andere Verletzung (Schnitt, Sturz…)',
        ],
      },
      commun: {
        immediat: [
          'Zuerst dich schützen: Bei Gefahr (Verkehr, Feuer, Steinschlag) die Gefahr beseitigen oder die Person nur wegbringen, wenn es unbedingt nötig ist.',
          'Die {secours} anrufen. Wenn es nicht durchkommt: {smsOu}von einem höheren Ort aus nochmals versuchen.',
          'Mit der Person sprechen, sie beruhigen, nichts zu trinken geben, falls sie operiert werden muss.',
          'Eine Person, die aus der Höhe gestürzt ist und Rücken- oder Nackenschmerzen hat, nicht bewegen, ausser bei unmittelbarer Gefahr.',
        ],
        ensuite: [
          'Die Person zudecken (auch im Sommer verliert man durch den Schock Wärme).',
          'Alle 5 Minuten prüfen: Reagiert sie? Atmet sie?',
          'Uhrzeit des Unfalls und den Hergang für die Rettung notieren.',
        ],
      },
      lieux: {
        montagne: {
          immediat: ['Die Person vom Boden isolieren und vor Wind schützen: Kälte verschlimmert alles.'],
          ensuite: ['Bergrettung: 112. Ohne Netz, Notsignal: 6 Pfiffe pro Minute.'],
        },
        eau: { immediat: ['Ertrinken: aus dem Wasser holen, ohne dich in Gefahr zu bringen (Ast reichen oder etwas Schwimmendes zuwerfen). Wenn sie nicht atmet: 5 Beatmungen, dann Herzmassage.'] },
        vehicule: {
          immediat: [
            'Warnblinker an, Warnweste anziehen, Pannendreieck aufstellen (wenn ungefährlich), Zündung aus.',
            'Einem Motorradfahrer den Helm nicht abnehmen (ausser er atmet nicht und muss wiederbelebt werden).',
          ],
        },
        nature: { ensuite: ['Wenn du die Person verlassen musst, um Netz oder Hilfe zu suchen: GPS-Position speichern (Reiter Werkzeuge), um zurückzufinden.'] },
      },
    },
    perdu: {
      label: 'Ich habe mich verirrt',
      commun: {
        immediat: [
          'S.T.O.P.: Stehen bleiben, Tief durchatmen, Orientieren, Planen. Geh nicht planlos los.',
          'Dein GPS funktioniert OHNE Internet: Reiter Werkzeuge öffnen, um deine Position zu sehen und zu notieren.',
          'Akku sparen: Flugmodus (GPS bleibt aktiv), Helligkeit minimal.',
        ],
        ensuite: [
          'Wenn jemand weiss, wo du bist: bleib, wo du bist, so wirst du leichter gefunden.',
          'Sonst, bevor du gehst: ein Zeichen hinterlassen (Pfeil aus Steinen oder Ästen, Notiz) mit der eingeschlagenen Richtung.',
          'Vor der Nacht (1,5 Stunden vorher): anhalten und eine Unterkunft bauen.',
        ],
      },
      lieux: {
        nature: {
          ensuite: [
            'Auf eine Anhöhe steigen, um zu sehen und Netz zu bekommen.',
            'Einem Bach flussabwärts folgen führt oft zu Häusern (aber nicht in Schluchten oder Felswände).',
            'Einen Weg, eine Stromleitung, einen Zaun suchen: Sie führen zu Menschen.',
          ],
        },
        montagne: {
          immediat: ['Bei Nebel oder in steilem Gelände: NICHT planlos absteigen (Felswände). Bleib, wo du bist, und mach dich bemerkbar.'],
          ensuite: ['Nie in eine unbekannte Schlucht oder Rinne absteigen.'],
        },
        ville: { ensuite: ['Such eine Hauptstrasse, einen Bahnhof oder ein öffentliches Gebäude (Gemeindehaus, Spital, Schule): Das sind oft Sammelpunkte.'] },
      },
    },
    separe: {
      label: 'Ich bin von meinen Nächsten getrennt',
      commun: {
        immediat: [
          'Reiter Gruppe öffnen: Dein Plan, deine Treffpunkte und dein Funkkanal sind dort.',
          'Eine kurze SMS senden (kommt besser durch als ein Anruf): «[Vorname] OK, in [Ort], gehe zu Treffpunkt 1.»',
          'Eure Kontaktperson ausserhalb der Region benachrichtigen.',
        ],
        ensuite: [
          'Den Plan anwenden: zu Treffpunkt 1 gehen (oder nach der vereinbarten Frist zu Treffpunkt 2).',
          'Beim Verlassen eines Ortes eine sichtbare Nachricht hinterlassen: Name, Uhrzeit, Ziel.',
          'Funk: nur zu den vereinbarten Funkzeiten einschalten.',
        ],
      },
    },
    froid: {
      label: 'Mir ist kalt / es ist sehr kalt',
      commun: {
        immediat: [
          'Vor WIND und NÄSSE schützen.',
          'Vom Boden isolieren (Rucksack, Karton, Äste): Das ist Priorität Nummer 1.',
          'Nasse Kleider ausziehen. Kopf, Hals und Hände bedecken.',
        ],
        ensuite: ['Wenn möglich warm essen und trinken: Der Körper braucht Energie, um sich aufzuwärmen.', 'Eng zusammenrücken.'],
      },
      lieux: {
        maison: {
          immediat: ['Heizungsausfall: alle in EINEM kleinen Raum versammeln, abdichten (Decken an die Fenster, Tücher unter die Türen).'],
          ensuite: [
            'NIE Grill, Generator oder Gasheizofen drinnen: Kohlenmonoxid tötet geruchlos.',
            'Angezogen schlafen, Mütze auf dem Kopf, zu mehreren unter den Decken.',
          ],
        },
        vehicule: {
          immediat: [
            'Im Schnee stecken geblieben: IM Fahrzeug bleiben.',
            'Den Auspuff vom Schnee befreien, bevor du den Motor startest, dann 10 Minuten pro Stunde laufen lassen und ein Fenster einen Spalt öffnen (Kohlenmonoxidgefahr).',
          ],
        },
      },
    },
    chaleur: {
      label: 'Es ist sehr heiss',
      commun: {
        immediat: ['Schatten, Ruhe, regelmässig trinken, ohne auf Durst zu warten.', 'Haut und Kleider befeuchten, Luft zufächeln.'],
        ensuite: ['Nur früh am Morgen oder am Abend bewegen.', 'Die Schwächsten im Auge behalten: Babys, ältere Menschen, Kranke.'],
      },
      lieux: {
        maison: { immediat: ['Fenster und Läden tagsüber schliessen, nachts öffnen und Durchzug machen. Im kühlsten Raum bleiben.'] },
        vehicule: { immediat: ['NIE ein Kind oder Tier im Auto lassen, auch nicht 5 Minuten.'] },
      },
    },
    eau: {
      label: 'Ich habe kein Trinkwasser mehr',
      commun: { immediat: ['Verluste begrenzen: Schatten, wenig Anstrengung, nichts Salziges essen.', 'Kein Meerwasser und keinen Urin trinken.'] },
      lieux: {
        maison: {
          immediat: [
            'Angekündigter Ausfall: SOFORT Badewanne, Töpfe und Flaschen füllen.',
            'Versteckte Reserven: Boiler (Hahn unten), WC-Spülkasten, Eiswürfel, Gemüsekonserven (der Saft).',
          ],
        },
        nature: { immediat: ['Abwärts suchen: Talsohlen, grüne Vegetation, Insekten, Vögel.'] },
      },
    },
    faim: {
      label: 'Wir haben nichts mehr zu essen',
      commun: {
        immediat: [
          'Keine Panik: Ohne Essen hält man Wochen durch, ohne Wasser nur 3 Tage. Zuerst sicherstellen, dass es Wasser gibt.',
          'Energie sparen: wenig Anstrengung, warm bleiben.',
          'Kinder, Kranke oder ältere Menschen essen zuerst.',
        ],
        ensuite: ['Iss nie eine Pflanze oder einen Pilz, die du nicht zu 100 % erkennst.'],
      },
      lieux: {
        ville: {
          immediat: [
            'Organisierte Hilfe suchen: Gemeinde, {orgsAide}, religiöse Gemeinschaften. Radio hören ({radios}) für die Verteilstellen.',
            'Nachbarn und Läden im Quartier fragen und einen Tausch oder deine Hilfe anbieten.',
          ],
          ensuite: ['In unruhigen Zeiten Menschenansammlungen vor Läden meiden.'],
        },
        maison: {
          immediat: ['Alle Schränke vollständig durchsuchen: Oft vergisst man Konserven, Reis, Teigwaren, Zucker.', 'Zuerst essen, was verdirbt (Kühlschrank, dann Tiefkühler).'],
        },
        nature: { ensuite: ['Einfache, sichere Pflanzen: Brennnessel (gekocht), Löwenzahn, Wegerich, Brombeeren, sofern du sie sicher erkennst.'] },
      },
    },
    nuit: {
      label: 'Ich muss die Nacht draussen verbringen',
      commun: {
        immediat: ['Mindestens 1,5 Stunden vor der Nacht mit der Unterkunft beginnen.', 'Zuerst vom Boden isolieren, dann vor Wind schützen.'],
        ensuite: ['Das Holz für die ganze Nacht vorbereiten, bevor es dunkel wird (3 Mal mehr, als du denkst).', 'Lampe und Pfeife griffbereit halten.'],
      },
      lieux: { ville: { immediat: ['Einen geschützten, beleuchteten Ort suchen: Bahnhof, Halle, Parkhaus, Gotteshaus, Notunterkunft.'] } },
    },
    catastrophe: {
      label: 'Katastrophe (Erdbeben, Hochwasser, Brand…)',
      tri: {
        question: 'Welche Art?',
        options: [
          'Erdbeben',
          'Jemand ist unter Trümmern eingeklemmt',
          'Überschwemmung / steigendes Wasser',
          'Brand / Waldbrand',
          'Atom- oder Chemiealarm',
          'Schüsse oder Explosionen in meiner Nähe',
          'Krawalle, Unruhen, Bürgerkrieg',
          'Anderes',
        ],
      },
      commun: {
        immediat: [
          'Radio hören ({radios}) und den offiziellen Anweisungen folgen ({alerteApp}).',
          'Die Kinder nicht von der Schule holen: Schulen haben einen Schutzplan.',
          'Nicht telefonieren, ausser bei Lebensgefahr: nur SMS, um das Netz nicht zu überlasten.',
        ],
        ensuite: ['Deine Gruppe benachrichtigen: SMS an die Kontaktperson, dann den Plan anwenden.'],
      },
      lieux: {
        maison: {
          immediat: [
            'Erdbeben: unter einen stabilen Tisch, Kopf schützen, Ende der Erschütterungen abwarten. Danach über die Treppe hinaus (nicht mit dem Lift) und das Gas abstellen.',
            'Überschwemmung: in obere Stockwerke, Strom und Gas abstellen. Nicht in den Keller oder die Garage gehen.',
            'Atom- oder Chemiealarm: HINEINGEHEN und drinnen bleiben, schliessen und abdichten, Lüftung abstellen.',
          ],
        },
        vehicule: {
          immediat: [
            'Überschwemmung: NIE auf eine überflutete Strasse fahren. 30 cm Wasser reichen, um ein Auto mitzureissen.',
            'Erdbeben: fern von Brücken, Gebäuden und Stromleitungen anhalten, im Fahrzeug bleiben.',
          ],
        },
        nature: { immediat: ['Waldbrand: quer zum Wind weggehen, Richtung bereits verbrannter oder offener Flächen (breite Strasse, gepflügtes Feld, Gewässer).'] },
        ville: { immediat: ['Erdbeben: weg von Fassaden, Fenstern und Leitungen, auf einen offenen Platz.'] },
        eau: { immediat: ['Sofort eine Anhöhe aufsuchen. Nie zu Fuss fliessendes Wasser durchqueren.'] },
      },
    },
    danger: {
      label: 'Ich fühle mich bedroht',
      commun: {
        immediat: [
          'Weggehen, in Richtung eines belebten, beleuchteten Ortes.',
          'Die {police} oder 112 anrufen. {smsSilencieux}',
          'Nichts für Gegenstände riskieren: gib, was verlangt wird.',
        ],
        ensuite: ['Eine nahestehende Person über deinen Standort informieren (Reiter Gruppe → meine Position senden).'],
      },
    },
  },
};
