# Audit Refuge — ce qu'il manque pour être vraiment utile en crise

Version 1 — 22 octobre 2026. État de départ : v0.3 (38 fiches, assistant guidé, IA locale, voix, groupe, carte de vie).

Ce document recense ce que l'appli doit contenir **en local**, pour l'utilisateur comme pour l'IA, afin de rester utile dans toutes les crises, **y compris quand les secours ne répondent plus**. Il se termine par une feuille de route priorisée.

---

## 1. Les principes qui changent tout

1. **Les secours peuvent ne pas venir.** Aujourd'hui, nos fiches disent « appelle le 112, puis fais X en attendant ». En guerre, lors d'une catastrophe majeure ou d'un effondrement des réseaux, *personne ne vient*, ou pas avant des heures, voire des jours. Chaque fiche vitale doit donc avoir une suite **« Si personne ne peut venir »** : quand s'arrêter, comment transporter, comment surveiller pendant des jours, à quoi reconnaître une aggravation.
2. **Trois horizons de temps.** Toute réponse se pense en *minutes* (survivre maintenant), en *heures et jours* (tenir) et en *semaines et mois* (s'organiser). Il faut couvrir les trois.
3. **Une personne qui panique ne lit pas.** Elle a besoin d'une seule instruction à la fois, en gros, avec la voix et des vibrations, sans choix compliqué. Le mode urgence doit fonctionner d'une main, sans réfléchir.
4. **Ce qui est vrai dépend du pays.** Numéros d'urgence, alertes, radios, organisations, plantes, faune, climat, réglementation radio : tout change. Le contenu se répartit entre un **socle universel** et des **packs pays**.
5. **Tout doit pouvoir se transmettre sans Internet.** L'appli, ses packs et ses cartes doivent passer d'un téléphone à l'autre, sans jamais transmettre les données privées.
6. **L'IA ne remplace pas les fiches, elle les relie.** Les fiches restent la vérité vérifiée. L'IA comprend la situation, choisit les bonnes fiches et les adapte. Plus les fiches sont riches, plus l'IA est fiable.

---

## 2. Le grand manque : « Si personne ne peut venir »

À ajouter en priorité, sous forme de **suites** des fiches vitales existantes et de nouvelles fiches.

| Situation | Ce qu'il faut ajouter |
|---|---|
| **Arrêt cardiaque sans secours** | Combien de temps masser (relais toutes les 2 minutes) ; quand il devient raisonnable d'arrêter (épuisement, danger, signes évidents de mort, au-delà de 20 à 30 minutes sans aucun signe de vie ni défibrillateur) ; cas où l'on continue plus longtemps (noyade, hypothermie, enfant). Comment vivre ce moment et l'annoncer aux proches. |
| **Hémorragie, garrot posé** | Surveillance (pouls en aval, couleur, douleur) ; durée ; transport par ses propres moyens vers un lieu de soins qui fonctionne ; ce qu'on ne fait jamais seul (desserrer un garrot ancien). |
| **Plaie sur plusieurs jours** | Nettoyage quotidien ; quand ne jamais fermer une plaie ; fermeture retardée ; signes d'infection et de septicémie ; morsures ; tétanos. |
| **Fractures et entorses** | Attelles improvisées (carton, magazine, bâtons, écharpe) ; immobilisation ; fracture ouverte ; surveillance de la circulation ; quand et comment déplacer. |
| **Transporter un blessé** | Brancards improvisés (couverture et bâtons, vestes) ; portage à deux ; rachis (dos et cou) ; choix de l'itinéraire. |
| **Plusieurs blessés à la fois** | Tri simplifié (START) : qui marche, qui respire, qui saigne ; par qui commencer ; organiser les témoins. |
| **Personnes coincées sous des décombres** | Signaler sa présence (taper sur les tuyaux, sifflet) ; dégager sans s'exposer ; syndrome d'écrasement (ne pas libérer brutalement un membre écrasé depuis des heures sans avis médical). |
| **Accouchement d'urgence** | Étapes, cordon, réchauffer le bébé, délivrance, hémorragie après l'accouchement, allaitement. |
| **Maladies chroniques sans pharmacie** | Diabète (conserver l'insuline sans frigo, hypoglycémie avec du sucre), asthme, épilepsie, cœur, dialyse, traitements psychiatriques interrompus : quoi faire et quels signes surveiller. |
| **Fièvre et douleur** | Posologies courantes du paracétamol et de l'ibuprofène selon le poids et l'âge, contre-indications (**relecture médicale obligatoire**) ; fièvre du nourrisson ; quand c'est grave. |
| **Déshydratation** | Solution de réhydratation orale (déjà en place) et signes de gravité chez l'enfant. |
| **Infections graves** | Méningite, septicémie, pneumonie : signes ; ce qu'on peut faire sans médecin (peu de choses) ; priorités. |
| **Décès** | Gestes de respect, hygiène, identification (photos, notes, objets), conservation, informer les proches. Source : guide du CICR sur la gestion des dépouilles après une catastrophe. |
| **Trouver un lieu de soins** | Hôpitaux, cliniques, pharmacies et postes de secours sur la **carte hors ligne** (voir §6), y compris les structures humanitaires (MSF, Croix-Rouge, Croissant-Rouge). |

**Source de référence à intégrer :** *Là où il n'y a pas de docteur* (Hesperian, version française disponible). C'est exactement l'esprit « sans médecin ». Il faut vérifier la licence (usage non commercial, ce qui reste compatible avec une appli gratuite). Autres sources : *Where There Is No Dentist*, le guide de premiers secours du CICR, les normes Sphere (santé humanitaire) et le manuel MSF *Clinical guidelines*, en libre accès mais à vérifier.

---

## 3. Toutes les crises, et ce qu'elles demandent de spécifique

Légende : ✅ déjà couvert · ◐ partiellement · ❌ manquant.

### 3.1 Catastrophes naturelles

| Crise | État | À ajouter |
|---|---|---|
| Séisme | ◐ | Pendant : se mettre à l'abri sous une table, et non sous un encadrement de porte. Après : répliques, odeur de gaz, bâtiments fissurés, recherche sous les décombres. |
| Inondation, crue | ◐ | Montée des eaux, voiture dans l'eau (sortir par la fenêtre), eau contaminée, retour au logement (électricité, moisissures). |
| Tempête, cyclone | ❌ | Préparation (vitres, objets), pièce sûre, œil du cyclone (piège du faux calme), après la tempête (câbles au sol). |
| Canicule | ◐ | Rafraîchir un logement sans électricité, personnes fragiles, eau. |
| Grand froid, neige | ◐ | Chauffer une seule pièce, monoxyde de carbone, gelures (ne pas frotter), panne de voiture dans la neige. |
| Feu de forêt | ◐ | Évacuer tôt, se confiner dans une maison si on est piégé, en voiture. |
| Tsunami | ❌ | Signes naturels (retrait de la mer, grondement), monter immédiatement, ne pas revenir avant la fin des vagues. |
| Avalanche, montagne | ❌ | Détecteur de victimes (DVA), sonde, pelle, se dégager une poche d'air. |
| Éruption volcanique | ❌ | Cendres (masque, yeux, toits), évacuation. |
| Orage, foudre | ❌ | Règle des 30/30, position accroupie, voiture = abri. |
| Glissement de terrain | ❌ | Signes précurseurs, s'éloigner perpendiculairement. |
| Sécheresse longue | ❌ | Économiser l'eau, récupérer l'eau de pluie, réutiliser les eaux grises. |

### 3.2 Crises technologiques

| Crise | État | À ajouter |
|---|---|---|
| Panne d'électricité géante (black-out) | ❌ | **Prioritaire.** Les 72 premières heures, l'eau qui s'arrête ensuite, les ascenseurs, le congélateur, recharger un téléphone (voiture, solaire, dynamo), l'éclairage, les appareils médicaux. |
| Coupure d'eau prolongée | ◐ | Réserves cachées (déjà en place), rationnement, assainissement. |
| Accident chimique ou industriel | ◐ | Se confiner (calfeutrer, couper la ventilation), chlore et ammoniac, décontaminer (enlever ses vêtements = 80 % de la contamination). |
| Accident nucléaire | ◐ | Se mettre à l'abri au centre du bâtiment ou au sous-sol, iode **uniquement sur ordre des autorités**, se décontaminer, l'eau et les aliments. |
| Rupture de barrage | ❌ | Zones à risque, sirènes, rejoindre les hauteurs. |
| Effondrement des télécoms | ◐ | Communications sans réseau (déjà en place) ; ajouter des plans de vacation radio par pays. |
| Cyberattaque (banques, carte bancaire) | ❌ | Argent liquide, troc, garder des copies papier de ses documents. |

### 3.3 Crises sanitaires

| Crise | État | À ajouter |
|---|---|---|
| Pandémie | ❌ | Isoler un malade à la maison, masques improvisés, aération, désinfection (javel diluée), quand consulter. |
| Choléra, diarrhées épidémiques | ◐ | Réhydratation (déjà en place), hygiène de l'eau, gestion des excréments. |
| Pénurie de médicaments | ❌ | Prioriser les traitements, conserver ses médicaments, ne pas en partager au hasard. |
| Intoxication (champignons, monoxyde, produits) | ◐ | Conduite à tenir, ne pas faire vomir, centres antipoison par pays. |

### 3.4 Crises sociales et conflits

| Crise | État | À ajouter |
|---|---|---|
| Guerre, bombardements | ◐ | Abri (déjà en place), alertes aériennes, munitions non explosées (**pack pays**), sortir d'une zone de combat, couloirs humanitaires. |
| Guerre civile, troubles | ◐ | Déjà en place : sécurité, barrages. À ajouter : se déplacer entre zones, rester neutre, protéger ses données (téléphone fouillé : verrouillage, applis sensibles). |
| Occupation | ❌ | Droits des civils (droit international humanitaire, CICR), documents, couvre-feu. |
| Terrorisme | ◐ | S'échapper, se cacher, alerter (réflexes officiels). |
| Pénuries, hyperinflation | ❌ | Troc, compétences à échanger, priorités d'achat, faire durer, entraide de quartier. |
| Déplacement, exil, réfugié | ❌ | **Prioritaire.** Documents à emporter, droits (demande d'asile, HCR), passages de frontière, éviter les passeurs dangereux, garder le contact avec la famille. |
| Retrouver des proches disparus | ❌ | Service Rétablissement des liens familiaux du CICR (*Trace the Face*), Croix-Rouge du pays, messages laissés sur place (en partie fait avec les groupes). |
| Violences sexuelles | ❌ | Mise en sécurité, soins dans les 72 h (traitement préventif), aide spécialisée par pays. Ton juste, sans jugement. |
| Effondrement des services publics | ❌ | S'organiser par quartier : eau, déchets, sécurité, soins, enfants. Comment monter un groupe d'entraide. |

### 3.5 Situations individuelles du quotidien

Perdu (✅), voiture en panne dans le désert ou la neige (◐), coincé dans un ascenseur, piqûres et morsures (serpents, tiques, guêpes avec allergie, méduses) (❌), hypoglycémie (❌), crise d'épilepsie (❌), AVC (◐, à faire en fiche avec le test « VITE » : Visage, Inertie d'un membre, Trouble de la parole, En urgence), infarctus (❌), allergie grave et stylo d'adrénaline (❌), noyade (◐).

---

## 4. Santé mentale et pédagogie : le mode « Je panique »

Les fiches ne suffisent pas pour une personne en pleine crise d'angoisse. Il faut un **mode guidé**, accessible en un geste depuis l'accueil et proposé automatiquement par l'IA quand elle détecte la panique.

**Écran « Je panique » :**
1. Plein écran sombre, une seule phrase en très gros : « Tu es en sécurité pour l'instant. On respire ensemble. »
2. **Respiration guidée animée** : un cercle qui grandit et rétrécit, avec des **vibrations** (inspire 4 s, bloque 4 s, expire 6 s) et la **voix**. La durée se règle, par défaut 2 minutes.
3. **Ancrage 5-4-3-2-1** pas à pas : « Dis-moi 5 choses que tu vois. » (au micro ou en touchant l'écran).
4. Puis **une question à la fois** : « Es-tu blessé ? Oui / Non », « Es-tu en danger maintenant ? Oui / Non ». On redirige vers l'assistant guidé ou vers une seule action concrète.
5. Des phrases de réassurance qui tournent, rédigées selon les premiers secours psychologiques de l'OMS (« Regarder, écouter, orienter »).

**Autres contenus pédagogiques :**
- **Enfants** : expliquer la situation selon l'âge, jeux calmes sans écran, rituels du coucher, enfant séparé de ses parents (réflexes à lui apprendre : nom, adresse, numéro appris par cœur ou écrit sur le bras).
- **Deuil en crise** : accompagner, rituels possibles, s'occuper de soi.
- **Personnes âgées ou handicapées** : mobilité, traitements, appareils médicaux électriques en cas de panne.
- **Groupe** : prendre des décisions à plusieurs, répartir les rôles, gérer les conflits et les rations.
- **S'entraîner** : petits exercices en temps normal (« fais un feu ce week-end », « teste ton plan familial »), un **quiz de connaissances** et un **badge de préparation**. C'est aussi un levier d'engagement, donc de diffusion.

---

## 5. Autonomie sur le long terme (semaines et mois)

| Domaine | Contenu à ajouter |
|---|---|
| Eau | Récupérer l'eau de pluie (calcul selon la surface du toit), filtres biosable, puits, stockage. |
| Nourriture | Potager express (radis, salades, pommes de terre), semences, séchage, salaison, lacto-fermentation, conserves (stérilisation, botulisme), petit élevage (poules), pêche, piégeage **selon la loi du pays**. |
| Énergie | Recharger un téléphone (voiture, petit panneau solaire, dynamo, piles), économiser la batterie, éclairage, cuisine sans gaz (rocket stove, cuiseur solaire, marmite norvégienne). |
| Chauffage | Isoler une pièce, poêles d'appoint en sécurité, monoxyde de carbone. |
| Hygiène | Savon maison, gestion des déchets, poux et gale, santé dentaire sans dentiste. |
| Réparations | Outils de base, couture, réparer des chaussures, vélo (le meilleur moyen de transport en crise). |
| Organisation | Inventaire, rotation des stocks, planning du groupe, tours de garde. |

---

## 6. Cartes hors ligne

**Le constat :** on peut envoyer sa position, mais il n'y a aucune carte dans l'appli.

**La solution recommandée :**
- **Moteur de carte** : MapLibre (libre, gratuit), intégré à l'appli.
- **Données** : OpenStreetMap, sous forme de fichiers **PMTiles** (un seul fichier par région, lisible hors ligne). On les découpe gratuitement depuis les fichiers Protomaps avec l'outil `pmtiles extract` (un rectangle géographique et un niveau de zoom maximum).
- **Taille** : elle dépend surtout du zoom maximum. On vise un **zoom 14** (rues lisibles) par **région ou département**, soit environ 50 à 400 Mo selon la zone, et une **carte du pays entier à faible zoom** (environ 50 à 150 Mo) pour s'orienter à grande échelle. *Tailles à mesurer précisément lors de la première génération.*
- **Points utiles (POI)** en base locale, consultable par l'IA : hôpitaux, pharmacies, médecins, points d'eau et fontaines, abris, mairies, casernes de pompiers, gendarmeries et commissariats, gares, stations-service, supermarchés. Ils sont extraits d'OpenStreetMap (Geofabrik) dans un petit fichier SQLite par pays.
- **Dans l'appli** :
  - un onglet **Carte** avec ma position GPS, les points de ralliement du groupe, les points utiles et mes repères ;
  - la recherche d'un lieu par nom ;
  - le cap et la distance vers n'importe quel point (déjà en place pour les points de ralliement).
- **L'IA** peut alors répondre à « où est l'hôpital ou le point d'eau le plus proche ? ».
- **Hébergement gratuit** : les cartes vont dans les GitHub Releases (2 Go maximum par fichier).

---

## 7. Packs par pays

**Ce qui change d'un pays à l'autre :**
- numéros d'urgence (police, pompiers, SAMU, centre antipoison, aide aux victimes, prévention du suicide) et SMS d'urgence pour les personnes sourdes ;
- système d'alerte (FR-Alert, NL-Alert, alertes cellulaires) et sirènes (signal et sens) ;
- radios d'urgence (stations et fréquences par région) et réglementation radio (PMR446, CB, bandes LoRa : 868 MHz en Europe, 915 MHz en Amérique) ;
- organisations (Croix-Rouge nationale, protection civile, banques alimentaires) ;
- risques majeurs du pays (séismes, cyclones, volcans, nucléaire, mines) ;
- faune et flore dangereuses ou comestibles (serpents, araignées, plantes) ;
- climat et saisons ;
- langue (fiches traduites) et **phrases d'urgence** dans les langues voisines ;
- loi : pêche, chasse, cueillette, port d'objets ;
- noms commerciaux des médicaments courants.

**L'architecture proposée :**
1. **Socle universel** dans l'APK : gestes vitaux, eau, feu, abri, mental… Il est valable partout et rédigé sans numéro de téléphone en dur (« appelle le numéro d'urgence »).
2. **Pack pays** : un petit fichier JSON plus quelques fiches spécifiques, de quelques centaines de Ko à quelques Mo. Les numéros de téléphone y sont des variables : `{urgence}`, `{samu}`, `{police}`, `{antipoison}`.
3. Au premier lancement, l'appli **propose le pays détecté** (langue et région du téléphone), que l'on peut modifier. On peut **cumuler plusieurs pays** (frontaliers, voyageurs, personnes réfugiées).
4. Un **catalogue** (`catalogue.json`) hébergé gratuitement sur GitHub Pages liste, pour chaque pays, le pack, les cartes disponibles et leur taille. L'écran « Préparer mon téléphone » le lit et propose : *« France : pack pays (2 Mo), carte nationale (120 Mo), carte de ta région (Île-de-France, 300 Mo) »*.
5. La **page web de téléchargement** propose le même choix de pays et donne l'APK et les liens des packs.
6. La **même liste** sert au partage hors ligne (§8) : je peux transmettre mon pays et ma région à un ami.

**Ordre de déploiement :** France (pack de référence), puis Belgique, Suisse, Canada et pays francophones d'Afrique, puis le reste de l'Europe. La traduction des fiches peut être préparée par IA, mais elle doit être **relue par des locuteurs natifs**.

---

## 8. Partage de l'appli sans Internet

**L'objectif :** j'ai Refuge, mes 3 amis ne l'ont pas, il n'y a plus de réseau. Je leur transmets l'appli complète, sans aucune de mes données privées.

**La solution :**
1. Bouton **« Partager Refuge sans Internet »**.
2. Mon téléphone crée **son propre Wi-Fi local** (fonction Android *LocalOnlyHotspot* : réseau et mot de passe générés automatiquement, sans carte SIM ni Internet).
3. L'écran affiche **QR code n° 1** : « Rejoindre le Wi-Fi ». L'appareil photo de l'ami le reconnaît nativement et se connecte en un geste.
4. Puis **QR code n° 2** : l'adresse de la page de téléchargement servie par **mon téléphone** (petit serveur web local).
5. La page, en français, propose :
   - **l'APK de Refuge** (une copie de l'appli installée sur mon téléphone) ;
   - **les packs** : IA, voix, pays, cartes, chacun avec sa taille.
6. Une fois installé, le Refuge de l'ami ouvre « Préparer mon téléphone » et propose **« Récupérer les packs depuis un proche »**. Il télécharge alors tout depuis mon téléphone, à la vitesse du Wi-Fi local (plusieurs dizaines de Mo/s : environ 2 minutes pour 1 Go).
7. **Solution de secours** : envoyer l'APK par **Quick Share** ou **Bluetooth** via le menu de partage d'Android (lent, mais universel).

**La garantie de confidentialité, par construction :** le serveur ne sert **qu'un seul dossier dédié** (`partage/`), qui contient l'APK et les packs. La carte de vie, les groupes, les contacts et la base de données sont stockés ailleurs. Il est **techniquement impossible** de les servir, même par erreur.

**Limites honnêtes :**
- Cela fonctionne d'Android à Android. Un iPhone ne peut pas installer d'APK : pour lui, on ne peut partager que les fiches en page web consultable hors ligne. Ce n'est déjà pas rien.
- L'ami doit accepter « Installer depuis des sources inconnues ».

---

## 9. Outils interactifs à ajouter

| Outil | Utilité |
|---|---|
| **Métronome de massage cardiaque** | Bip et vibration à 110 par minute, compteur 30/2, rappel de relais toutes les 2 minutes. |
| **Carnet de soins** | Heure du garrot, constantes, médicaments donnés, évolution d'une plaie, pour soi et pour les secours. |
| **Mode « Je panique »** | Voir §4. |
| **Phrases d'urgence traduites** | Ne pas pouvoir se faire comprendre est un danger réel (exil, voyage, secours étrangers). Liste audio et texte de phrases clés en 10 à 20 langues. |
| **Calculateurs** | Eau et rations pour le groupe, solution de réhydratation, durée d'autonomie, consommation de batterie. |
| **Check-lists** | Kit 72 h, sac d'évacuation, préparation du logement avant tempête ou froid, avec suivi des dates de péremption. |
| **Carte et points** | Voir §6. |
| **« Je vais bien »** | Envoyer en un geste un SMS préparé à tout le groupe, avec position et état. |
| **Lampe rouge** | Préserve la vision nocturne et reste discrète. |
| **Journal de bord** | Notes datées, utiles pour le groupe et pour se rappeler (le stress efface la mémoire). |
| **Messagerie sans réseau** (plus tard) | Bluetooth ou Wi-Fi entre téléphones proches, puis intégration Meshtastic (LoRa, plusieurs km). |

---

## 10. Ce qui rend l'IA meilleure

- **Plus de fiches, mieux structurées.** Chaque fiche porte des métadonnées : type de crise, horizon de temps, matériel nécessaire, pays, niveau de danger. La recherche ramène alors les bonnes sources selon la situation.
- **Fiche de situation persistante.** L'IA tient un petit résumé (lieu, personnes, ressources, blessures, heure du garrot…) qui survit à la fermeture de l'appli et reste visible et corrigeable par l'utilisateur.
- **Encyclopédie hors ligne.** Résumés de Wikipédia dans la langue du pays (quelques centaines de Mo), pour les questions générales.
- **Accès aux points de la carte** (§6) pour les questions « où ».
- **Évaluation.** Une batterie de 100 à 200 questions réalistes (« en ville avec ma sœur, plus rien à manger, guerre civile »), avec les réponses attendues, pour tester chaque modèle et chaque version des consignes.

---

## 11. Sources libres à intégrer (licences à vérifier une par une)

| Source | Contenu | Licence |
|---|---|---|
| Manuels de l'armée américaine (ATP 3-50.21, FM 21-76) | Survie | Domaine public |
| FEMA, Ready.gov, CDC | Catastrophes, santé publique | Domaine public |
| CICR (publications) | Conflits, premiers secours, gestion des dépouilles, droit humanitaire | Libre accès, souvent non commercial |
| OMS | Premiers secours psychologiques, eau, hygiène | Souvent CC BY-NC-SA |
| Normes Sphere | Normes humanitaires (eau, abri, santé) | Libre accès |
| Hesperian (*Là où il n'y a pas de docteur*) | Médecine sans médecin | Usage non commercial |
| Wikipédia, Wikibooks, Wikivoyage | Encyclopédie, guides | CC BY-SA |
| Appropedia | Low-tech | CC BY-SA |
| OpenStreetMap | Cartes et points utiles | ODbL |
| Gouvernements nationaux (France : risques.gouv.fr, Belgique, Suisse…) | Consignes officielles et numéros | Information publique, généralement réutilisable |

> Les licences « non commerciales » restent compatibles avec une appli gratuite. Elles **ne le sont pas** avec une future offre payante pour les structures : il faudra séparer clairement ces contenus.

---

## 12. Feuille de route priorisée

**P0 : les manques qui peuvent coûter des vies**
1. Suites **« Si personne ne peut venir »** pour toutes les fiches vitales, plus les fractures, le transport des blessés, le tri de plusieurs victimes et l'accouchement.
2. **Mode « Je panique »** : respiration guidée avec vibrations et voix, puis questions une par une.
3. **Partage de l'appli sans Internet** (QR code, Wi-Fi local, sans données privées).
4. **Cartes hors ligne et points utiles** de la région.
5. **Pack pays France** et socle universel sans numéro en dur.

**P1 : élargir à toutes les crises**
6. Black-out, tempête, inondation, pandémie, exil et déplacement, retrouver des proches.
7. Maladies chroniques, fièvre et douleur (avec relecture médicale), piqûres et morsures, AVC, infarctus, allergie grave, épilepsie, hypoglycémie.
8. Métronome de massage cardiaque, carnet de soins, bouton « Je vais bien », check-lists.

**P2 : tenir dans la durée, et l'international**
9. Autonomie long terme (énergie, potager, conservation, chauffage).
10. Packs pays Belgique, Suisse, Canada, Afrique francophone, puis le reste de l'Europe ; phrases d'urgence traduites.
11. Encyclopédie hors ligne.

**P3 : aller plus loin**
12. Messagerie sans réseau (Bluetooth, puis Meshtastic).
13. Entraînement et quiz, mode groupe ou quartier.
14. Relecture médicale et juridique de tout le contenu, avant toute diffusion à grande échelle.
