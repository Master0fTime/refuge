# Refuge

Appli de survie 100 % hors ligne : fiches de savoir, assistant guidé, IA locale qui répond à partir des fiches, groupe et points de ralliement par QR code, carte de vie, lampe/SOS/boussole/GPS.

## Installer l'APK sur un téléphone Android

```bash
npx expo prebuild -p android --no-install
cd android && ./gradlew assembleRelease
```

L'APK est dans `android/app/build/outputs/apk/release/app-release.apk`. Copie-le sur le téléphone et ouvre-le (autoriser « sources inconnues »), ou avec le téléphone branché en USB :

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

> L'APK release est signé avec la clé de debug : parfait pour tester et partager entre proches, pas pour le Play Store.

## Développer

Modules natifs (caméra, GPS, SQLite, llama.cpp) : il faut une *development build*, pas Expo Go.

```bash
npx expo run:android
```

### Windows : installation de `llama.rn`

Son `postinstall` télécharge les bibliothèques natives et échoue avec le `tar` de Git Bash (qui prend `C:` pour un hôte distant). Si `npm install` échoue :

```bash
npm install --ignore-scripts
PATH="/c/Windows/System32:$PATH" node node_modules/llama.rn/install/download-native-artifacts.js
```

## IA locale (v0.2)

- Moteur : llama.cpp via `llama.rn`, modèles Qwen3 GGUF (Apache 2.0) : 0.6B / 1.7B / 4B selon la mémoire du téléphone.
- Le modèle se télécharge depuis l'écran « IA hors ligne » (avec pause/reprise) ou s'importe depuis un fichier (carte SD, USB, partage entre proches).
- RAG : la question est cherchée dans l'index SQLite FTS5 des fiches (`src/lib/recherche.ts`), les 4 meilleures fiches sont données au modèle, qui doit citer ses sources `[n]`.
- Garde-fous (`src/lib/ia/garde-fous.ts`) : une urgence vitale détectée dans la question affiche immédiatement la fiche fixe et le numéro d'urgence, avant la réponse de l'IA.
- Sans modèle installé, « Poser une question » renvoie les fiches correspondantes.

## Structure

- `src/app/` : écrans (Expo Router)
- `src/data/fiches.ts` : fiches de savoir (contenu médical à faire relire par un professionnel)
- `src/data/guide.ts` : arbre de l'assistant (problème → tri → lieu → réflexes)
- `src/lib/partage.ts` : format des QR codes échangés entre téléphones (contacts, groupes)
- `src/lib/ia/` : modèles, moteur, garde-fous

## Feuille de route

- v0.3 : cartes hors ligne MapLibre + PMTiles OpenStreetMap ; recherche par le sens (embeddings + sqlite-vec)
- v0.4 : partage P2P (Wi-Fi Direct / Nearby) de l'appli et des packs, intégration Meshtastic
- Contenu : passer de 31 à plusieurs centaines de fiches (manuels du domaine public, Wikipédia ZIM)
