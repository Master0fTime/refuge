import { router } from 'expo-router';
import { useState } from 'react';
import { Bouton, Carte, Ecran, Ligne, Sous, Texte, Titre } from '@/components/ui';
import { fiche } from '@/data/fiches';
import { conseilsPour, LIEUX, PROBLEMES, type LieuId, type Probleme } from '@/data/guide';
import { c } from '@/lib/theme';

export default function Guide() {
  const [probleme, setProbleme] = useState<Probleme | null>(null);
  const [triFait, setTriFait] = useState(false);
  const [lieu, setLieu] = useState<LieuId | null>(null);

  const recommencer = () => {
    setProbleme(null);
    setTriFait(false);
    setLieu(null);
  };

  // 1. Quel est le problème ?
  if (!probleme) {
    return (
      <Ecran>
        <Titre>Quel est le problème ?</Titre>
        {PROBLEMES.map((p) => (
          <Ligne key={p.id} titre={p.label} icone={p.icone} couleur={p.couleur} onPress={() => setProbleme(p)} />
        ))}
      </Ecran>
    );
  }

  // 2. Tri : une urgence vitale part directement sur sa fiche.
  if (probleme.tri && !triFait) {
    return (
      <Ecran>
        <Titre>{probleme.tri.question}</Titre>
        {probleme.tri.options.map((o) => (
          <Ligne
            key={o.label}
            titre={o.label}
            icone={o.fiche ? 'alert-circle' : 'ellipsis-horizontal-circle'}
            couleur={o.fiche ? c.danger : c.muted}
            onPress={() => (o.fiche ? router.replace(`/fiche/${o.fiche}`) : setTriFait(true))}
          />
        ))}
        <Bouton label="Retour" discret onPress={recommencer} />
      </Ecran>
    );
  }

  // 3. Où es-tu ?
  if (!lieu) {
    return (
      <Ecran>
        <Titre>Où es-tu en ce moment ?</Titre>
        {LIEUX.map((l) => (
          <Ligne key={l.id} titre={l.label} icone={l.icone} onPress={() => setLieu(l.id)} />
        ))}
        <Bouton label="Retour" discret onPress={recommencer} />
      </Ecran>
    );
  }

  // 4. Réflexes adaptés.
  const r = conseilsPour(probleme, lieu);
  return (
    <Ecran>
      <Titre>{probleme.label}</Titre>
      <Texte muted>{LIEUX.find((l) => l.id === lieu)?.label}</Texte>

      <Sous>Tout de suite</Sous>
      <Carte couleur={c.danger}>
        {r.immediat.map((t, i) => (
          <Texte key={i}>• {t}</Texte>
        ))}
      </Carte>

      {r.ensuite.length > 0 && (
        <>
          <Sous>Ensuite</Sous>
          <Carte couleur={c.accent}>
            {r.ensuite.map((t, i) => (
              <Texte key={i}>• {t}</Texte>
            ))}
          </Carte>
        </>
      )}

      <Sous>Pour aller plus loin</Sous>
      {r.fiches.map((id) => {
        const f = fiche(id);
        return f ? <Ligne key={id} titre={f.titre} icone="document-text" onPress={() => router.push(`/fiche/${id}`)} /> : null;
      })}

      <Bouton label="Autre problème" icone="refresh" discret onPress={recommencer} />
    </Ecran>
  );
}
