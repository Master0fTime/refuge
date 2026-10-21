import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Bouton, Carte, Ecran, Ligne, Sous, Texte, Titre } from '@/components/ui';
import { fiche } from '@/data/fiches';
import { conseilsPour, LIEUX, PROBLEMES, type LieuId, type Probleme } from '@/data/guide';
import { nomLieu, t, traduireFiche, traduireProbleme } from '@/i18n';
import { localiser } from '@/lib/pays';
import { c } from '@/lib/theme';

export default function Guide() {
  // Ouvert depuis « Je panique » (ou un autre écran) avec un problème déjà choisi.
  const { probleme: depart } = useLocalSearchParams<{ probleme?: string }>();
  const trouve = PROBLEMES.find((p) => p.id === depart);
  // Le problème choisi est gardé déjà traduit : question de tri, options et conseils suivent la langue.
  const [probleme, setProbleme] = useState<Probleme | null>(trouve ? traduireProbleme(trouve) : null);
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
        <Titre>{t('Quel est le problème ?')}</Titre>
        {PROBLEMES.map((p) => (
          <Ligne key={p.id} titre={traduireProbleme(p).label} icone={p.icone} couleur={p.couleur} onPress={() => setProbleme(traduireProbleme(p))} />
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
        <Bouton label={t('Retour')} discret onPress={recommencer} />
      </Ecran>
    );
  }

  // 3. Où es-tu ?
  if (!lieu) {
    return (
      <Ecran>
        <Titre>{t('Où es-tu en ce moment ?')}</Titre>
        {LIEUX.map((l) => (
          <Ligne key={l.id} titre={nomLieu(l.id, l.label)} icone={l.icone} onPress={() => setLieu(l.id)} />
        ))}
        <Bouton label={t('Retour')} discret onPress={recommencer} />
      </Ecran>
    );
  }

  // 4. Réflexes adaptés.
  const r = conseilsPour(probleme, lieu);
  return (
    <Ecran>
      <Titre>{probleme.label}</Titre>
      <Texte muted>{nomLieu(lieu, LIEUX.find((l) => l.id === lieu)?.label ?? '')}</Texte>

      <Sous>{t('Tout de suite')}</Sous>
      <Carte couleur={c.danger}>
        {r.immediat.map((texte, i) => (
          <Texte key={i}>• {localiser(texte)}</Texte>
        ))}
      </Carte>

      {r.ensuite.length > 0 && (
        <>
          <Sous>{t('Ensuite')}</Sous>
          <Carte couleur={c.accent}>
            {r.ensuite.map((texte, i) => (
              <Texte key={i}>• {localiser(texte)}</Texte>
            ))}
          </Carte>
        </>
      )}

      <Sous>{t('Pour aller plus loin')}</Sous>
      {r.fiches.map((id) => {
        const f = fiche(id);
        return f ? <Ligne key={id} titre={traduireFiche(f).titre} icone="document-text" onPress={() => router.push(`/fiche/${id}`)} /> : null;
      })}

      <Bouton label={t('Autre problème')} icone="refresh" discret onPress={recommencer} />
    </Ecran>
  );
}
