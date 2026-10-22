"""Convertit un fichier ZIM (Wikipédia hors ligne de Kiwix) en pack « Encyclopédie » pour Refuge.

On garde seulement le texte utile d'un article : l'introduction, puis les sections qui aident à agir
(symptômes, traitement, premiers secours, prévention…), découpés en passages courts. Le résultat est
une base SQLite FTS5 que l'appli ouvre directement, sans décompression.

Usage : python -I zim-vers-sqlite.py <fichier.zim> <sortie.db> <fr|de|it> [date]
Sources : https://download.kiwix.org/zim/wikipedia/ (ex. wikipedia_fr_medicine_nopic_2026-10.zim)
Licence du contenu : CC BY-SA 4.0, auteurs de Wikipédia. Le pack doit rester sous cette licence.
"""
import html
import os
import re
import sqlite3
import sys
import time

from libzim.reader import Archive

source, sortie, langue = sys.argv[1], sys.argv[2], sys.argv[3]
date = sys.argv[4] if len(sys.argv) > 4 else time.strftime('%Y-%m')

PASSAGES_INTRO = 3  # l'introduction résume presque toujours l'essentiel
PASSAGES_MAX = 10  # par article, pour garder un pack léger
TAILLE_PASSAGE = 700  # caractères : assez pour l'IA, assez court pour l'écran

# Sections utiles en situation de crise, et sections à ignorer, selon la langue.
UTILES = {
    'fr': r'sympt|signe|traitement|soin|secours|urgence|prise en charge|prévention|complication|cause|diagnostic|conduite',
    'de': r'symptom|anzeichen|behandlung|therapie|erste hilfe|notfall|prävention|vorbeugung|komplikation|ursache|diagnos',
    'it': r'sintom|segni|trattamento|terapia|cura|primo soccorso|emergenza|prevenzione|complicanz|caus|diagnos',
}[langue]
INUTILES = {
    'fr': r'référence|voir aussi|lien|bibliographie|note|histoire|historique|culture|étymologie|recherche',
    'de': r'nachweis|literatur|weblink|siehe auch|anmerkung|geschichte|kultur|etymologie|forschung',
    'it': r'note|bibliografia|voci correlate|collegamenti|altri progetti|storia|cultura|etimologia|ricerca',
}[langue]

def sections(page_html: str):
    """Découpe la page en (titre de section, lignes de texte). La 1re section est l'introduction."""
    h = re.sub(r'(?is)<(script|style|table|figure|sup|math)[^>]*>.*?</\1>', ' ', page_html)
    morceaux = re.split(r'(?is)<h[23][^>]*>(.*?)</h[23]>', h)
    yield '', morceaux[0]
    for i in range(1, len(morceaux) - 1, 2):
        yield html.unescape(re.sub(r'<[^>]+>', '', morceaux[i])).strip().lower(), morceaux[i + 1]

def lignes(fragment: str):
    t = re.sub(r'(?i)</?(p|li|br|div|section|dd|dt)[^>]*>', '\n', fragment)
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    out = [re.sub(r'\s+', ' ', l).strip() for l in t.split('\n')]
    return [l for l in out if len(l) > 40]  # de vraies phrases, pas des légendes

def decouper(ls, taille=TAILLE_PASSAGE):
    bloc = ''
    for l in ls:
        if len(bloc) + len(l) > taille and bloc:
            yield bloc
            bloc = ''
        bloc += (' ' if bloc else '') + l
    if bloc:
        yield bloc

def passages_article(page_html: str):
    intro, utiles = [], []
    for titre, frag in sections(page_html):
        if not titre:
            intro = list(decouper(lignes(frag)))[:PASSAGES_INTRO]
        elif re.search(UTILES, titre) and not re.search(INUTILES, titre):
            utiles += list(decouper(lignes(frag)))
    return (intro + utiles)[:PASSAGES_MAX]

if os.path.exists(sortie):
    os.remove(sortie)
zim = Archive(source)
db = sqlite3.connect(sortie)
db.executescript('''
  CREATE TABLE info(cle TEXT PRIMARY KEY, valeur TEXT);
  CREATE TABLE article(id INTEGER PRIMARY KEY, titre TEXT NOT NULL);
  CREATE VIRTUAL TABLE passage USING fts5(titre, texte, article UNINDEXED, tokenize='unicode61 remove_diacritics 2');
''')
debut = time.time()
n_art = n_pass = 0
for i in range(zim.all_entry_count):
    e = zim._get_entry_by_id(i)
    if e.is_redirect:
        continue
    it = e.get_item()
    if it.mimetype != 'text/html':
        continue
    ps = passages_article(bytes(it.content).decode('utf-8', 'ignore'))
    if not ps:
        continue
    n_art += 1
    db.execute('INSERT INTO article VALUES (?,?)', (n_art, e.title))
    db.executemany('INSERT INTO passage VALUES (?,?,?)', [(e.title, p, n_art) for p in ps])
    n_pass += len(ps)
db.executemany('INSERT INTO info VALUES (?,?)', [
    ('format', '1'), ('langue', langue), ('date', date), ('source', os.path.basename(source)),
    ('articles', str(n_art)), ('passages', str(n_pass)),
    ('licence', 'CC BY-SA 4.0 — contributeurs de Wikipédia'),
])
db.execute("INSERT INTO passage(passage) VALUES('optimize')")
db.commit()
db.execute('VACUUM')
db.close()
print(f'{langue}: {n_art} articles, {n_pass} passages, {os.path.getsize(sortie) // 1048576} Mo, {time.time() - debut:.0f} s')
