#!/usr/bin/env bash
# Publie l'APK d'un build EAS sur GitHub Releases, pour que les téléphones le proposent tout seuls
# (bouton « Télécharger et installer » dans Refuge, sans QR code).
#
#   outils/publier-apk.sh <id-du-build-EAS> [--stable]
#
# Sans --stable : pré-version, proposée seulement aux téléphones qui ont activé « Recevoir les versions de test ».
# Avec --stable : version normale, proposée à tout le monde (releases/latest).
set -euo pipefail

BUILD="${1:?Usage : outils/publier-apk.sh <id-du-build-EAS> [--stable]}"
STABLE="${2:-}"
GH="${GH:-gh}"
command -v "$GH" >/dev/null || GH="/c/Program Files/GitHub CLI/gh.exe"

INFO=$(npx eas-cli@latest build:view "$BUILD" --json)
lire() { python -c "import sys,json;d=json.load(sys.stdin);print($1)" <<<"$INFO"; }
STATUT=$(lire "d['status']")
[ "$STATUT" = "FINISHED" ] || { echo "Build pas terminé (statut : $STATUT)"; exit 1; }
URL=$(lire "d['artifacts']['buildUrl']")
CODE=$(lire "d['appBuildVersion']")
VERSION=$(lire "d['appVersion']")
TAG="v$VERSION"

DOSSIER=$(mktemp -d)
FICHIER="$DOSSIER/refuge-$CODE.apk"
echo "Téléchargement de l'APK $VERSION (versionCode $CODE)…"
curl -fsSL "$URL" -o "$FICHIER"

if [ "$STABLE" = "--stable" ]; then
  OPTIONS=(--latest)
  NOTE="Version complète $VERSION. Installe-la depuis Refuge : Réglages → Mises à jour."
else
  OPTIONS=(--prerelease --latest=false)
  NOTE="Version de test $VERSION. Proposée aux téléphones qui ont activé « Recevoir les versions de test » (Réglages → Mises à jour)."
fi

if "$GH" release view "$TAG" >/dev/null 2>&1; then
  "$GH" release upload "$TAG" "$FICHIER" --clobber
else
  "$GH" release create "$TAG" "$FICHIER" --title "Refuge $VERSION" --notes "$NOTE" "${OPTIONS[@]}"
fi
rm -rf "$DOSSIER"
echo "Publié : $TAG (refuge-$CODE.apk)"
