# Packs « Encyclopédie »

L'encyclopédie hors ligne de Refuge est la partie **médecine** de Wikipédia (environ 15 000 articles par langue), réduite à ce qui aide à agir : introduction, symptômes, traitement, premiers secours, prévention. Le texte est découpé en passages courts dans une base SQLite FTS5, que l'appli ouvre directement (`src/lib/encyclopedie.ts`) pour la recherche et pour l'IA.

## Fabriquer un pack

1. Télécharger le fichier Kiwix de la langue (version sans images) :
   - https://download.kiwix.org/zim/wikipedia/wikipedia_fr_medicine_nopic_AAAA-MM.zim
   - même nom avec `_de_` ou `_it_`
2. Convertir (Python 3.12, `pip install libzim`) :

```bash
python -I zim-vers-sqlite.py wikipedia_fr_medicine_nopic_2026-10.zim encyclopedie-fr-2026-10.db fr 2026-10
```

3. Publier les trois fichiers sur une Release GitHub nommée `encyclopedie-AAAA-MM` :

```bash
gh release create encyclopedie-2026-10 encyclopedie-fr-2026-10.db encyclopedie-de-2026-10.db encyclopedie-it-2026-10.db --title "Encyclopédie hors ligne 2026-10" --notes "…"
```

4. Mettre à jour `PACKS_ENCYCLOPEDIE` dans `src/lib/encyclopedie.ts` : nom de la Release, taille exacte en octets (`ls -l`) et nombre d'articles (table `info`). La taille sert à vérifier qu'un téléchargement est complet.

## Licence

Le contenu vient de Wikipédia, sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr). Les packs restent sous cette licence, et l'appli cite la source sous chaque article. Le texte est abrégé (sections choisies, sans images ni tableaux), ce que la licence permet en le signalant.

Les fichiers ZIM sont produits par [Kiwix](https://kiwix.org) (openZIM). Un don à Kiwix ou à Wikimedia est une belle façon de remercier.
