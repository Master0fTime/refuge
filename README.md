# Refuge

Appli de survie **100 % hors ligne**, libre et gratuite (licence MIT).

- Fiches de secours et de survie (72), assistant guidé (problème → lieu → réflexes), mode « Je panique », métronome de massage cardiaque.
- IA locale qui répond à partir des fiches, sans Internet, avec dictée et lecture à voix haute.
- Cartes hors ligne, groupe et points de ralliement par QR code, carte de vie (infos médicales), boutons « Je vais bien » / « J'ai besoin d'aide » par SMS.
- Partage de l'appli et des données publiques de téléphone à téléphone, sans Internet (Wi-Fi local + QR code). Les données privées ne sont jamais partagées.
- Pays : Suisse (par défaut), France, Allemagne, Italie, Autriche, Liechtenstein. Langues : français, allemand, italien.

> Le contenu médical doit encore être relu par un professionnel. En cas d'urgence, appeler le 112 ou le numéro du pays.

## Installer (Android)

1. Télécharger le dernier `refuge-<n>.apk` depuis la page [Releases](https://github.com/Master0fTime/refuge/releases/latest).
2. L'ouvrir sur le téléphone et autoriser l'installation (« sources inconnues »).
3. Au premier lancement, « Préparer mon téléphone » télécharge l'IA, la voix et les cartes choisies.

On n'installe l'APK **qu'une fois** : ensuite, l'écran « Mises à jour » de l'appli s'occupe de tout. iPhone : pas encore disponible (compte Apple payant nécessaire).

## Développer

Expo SDK 58, React Native (New Architecture), Expo Router (`src/app/`), TypeScript strict.

```bash
npm install
npx tsc --noEmit
```

Les modules natifs (llama.cpp, whisper.cpp, MapLibre, SQLite, partage local) demandent une *development build* : Expo Go ne suffit pas. Les APK se construisent dans le cloud avec EAS : la compilation locale sous Windows échoue sur la limite de longueur des chemins.

### Windows : installation de `llama.rn`

Son `postinstall` télécharge les bibliothèques natives et échoue avec le `tar` de Git Bash (qui prend `C:` pour un hôte distant). Si `npm install` échoue :

```bash
npm install --ignore-scripts
PATH="/c/Windows/System32:$PATH" node node_modules/llama.rn/install/download-native-artifacts.js
```

### Attention à l'empreinte native

Les mises à jour automatiques ne s'appliquent qu'aux APK de même empreinte native (`runtimeVersion: fingerprint`). Toute modification de `package.json` (dépendances, mais aussi scripts), de `app.json` ou de `modules/` change l'empreinte. Avant de publier, comparer avec celle de l'APK installé :

```bash
npx expo-updates runtimeversion:resolve --platform android
```

## Publier une mise à jour

### 1. Contenu ou code (cas le plus courant)

Fiches, écrans, IA, traductions, corrections : tout ce qui n'ajoute pas de module natif.

1. Ajouter une entrée en tête de `NOUVEAUTES` dans `src/data/version.ts`.
2. Publier :

```bash
npx eas-cli@latest update --channel preview --environment preview --platform android --message "Ce qui change"
```

Les téléphones la téléchargent seuls au lancement, puis proposent « Installer maintenant ».

### 2. Nouvelle version complète (nouveau module natif)

1. Monter `version` dans `app.json`, puis construire l'APK (le n° de build s'incrémente tout seul) :

```bash
npx eas-cli@latest build -p android --profile preview
```

2. Publier l'APK sur GitHub Releases, **nommé `refuge-<n° de build>.apk`** (c'est ce nom que l'appli reconnaît) :

```bash
gh release create v0.8.0 refuge-3.apk --title "Refuge 0.8.0" --notes "Ce qui change"
```

Les téléphones déjà installés interrogent `releases/latest` à l'ouverture (`src/lib/mises-a-jour.ts`). Ils proposent alors « Télécharger et installer ». Android demande de confirmer, et les données sont conservées (même clé de signature EAS). Les liens GitHub n'expirent pas, contrairement aux APK hébergés par Expo (environ 30 jours).

> `DERNIER_APK` (`src/data/version.ts`) reste un moyen de secours : une mise à jour de contenu peut aussi annoncer un APK.

## Structure

- `src/app/` : écrans (Expo Router)
- `src/data/` : fiches, fiches d'urgence, assistant guidé, pays, notes de version
- `src/i18n/` : traductions (le texte français sert de clé ; `t()`, `traduireFiche()`, `traduireProbleme()`)
- `src/lib/ia/` : modèles Qwen3 GGUF, moteur llama.rn, garde-fous d'urgence (FR/DE/IT)
- `src/lib/recherche.ts` : index SQLite FTS5 des fiches, synonymes, correction des fautes, extraits pour l'IA
- `src/lib/voix.ts` : dictée whisper.cpp (PCM 16 kHz) et lecture `expo-speech`
- `src/lib/pays.ts` : numéros et variables par pays (`{secours}`, `{police}`…)
- `src/lib/mises-a-jour.ts` : mises à jour de contenu (EAS Update) et d'APK (GitHub Releases)
- `modules/partage-local/` : module Android (Wi-Fi local + petit serveur HTTP qui ne sert que `documentDirectory/partage/` et l'APK)
- `docs/AUDIT.md` : audit du contenu et de la communication de crise

## IA locale

- llama.cpp via `llama.rn` 0.12.9, sur le processeur seulement. Modèles Qwen3 (Apache 2.0) : 0.6B, 1.7B (par défaut) ou 4B selon la mémoire du téléphone.
- La question est cherchée dans les fiches. Les meilleurs extraits sont donnés au modèle, qui cite ses sources.
- Une urgence vitale détectée dans la question affiche tout de suite la fiche et le numéro, avant la réponse de l'IA.
- Sans modèle installé, « Poser une question » renvoie les fiches correspondantes.

## Feuille de route

- Traduire les écrans de réglages et le SMS de statut ; ajouter l'anglais.
- Recherche par le sens (embeddings), plus de fiches (manuels du domaine public, Wikipédia hors ligne).
- Communication sans réseau (Meshtastic, Wi-Fi Direct).
- Version iPhone (PWA « Refuge Lite » ou App Store).
