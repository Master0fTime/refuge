import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Carte, Ecran, Ligne, Sous, Texte, Titre } from '@/components/ui';
import { CATEGORIES, fiche } from '@/data/fiches';
import { c } from '@/lib/theme';

export default function FicheEcran() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const f = fiche(id);
  if (!f) {
    return (
      <Ecran>
        <Texte>Fiche introuvable.</Texte>
      </Ecran>
    );
  }
  const cat = CATEGORIES.find((x) => x.id === f.cat);

  return (
    <Ecran>
      <Stack.Screen options={{ title: cat?.nom ?? '' }} />
      <Titre>{f.titre}</Titre>
      <Texte muted>{f.resume}</Texte>

      {f.choix?.map((ch) => (
        <Ligne key={ch.fiche} titre={ch.label} icone="arrow-forward-circle" couleur={cat?.couleur} onPress={() => router.push(`/fiche/${ch.fiche}`)} />
      ))}

      {f.etapes && (
        <Carte couleur={cat?.couleur}>
          {f.etapes.map((e, i) => (
            <Texte key={i}>
              <Texte muted>{i + 1}. </Texte>
              {e}
            </Texte>
          ))}
        </Carte>
      )}

      {f.attention && (
        <>
          <Sous>Attention</Sous>
          <Carte couleur={c.danger}>
            {f.attention.map((a, i) => (
              <Texte key={i}>⚠ {a}</Texte>
            ))}
          </Carte>
        </>
      )}

      {f.ensuite && (
        <>
          <Sous>Ensuite</Sous>
          <Carte>
            {f.ensuite.map((a, i) => (
              <Texte key={i}>• {a}</Texte>
            ))}
          </Carte>
        </>
      )}

      {f.liees && (
        <>
          <Sous>Voir aussi</Sous>
          {f.liees.map((lid) => {
            const l = fiche(lid);
            return l ? <Ligne key={lid} titre={l.titre} icone="document-text" onPress={() => router.push(`/fiche/${lid}`)} /> : null;
          })}
        </>
      )}

      <Texte muted>Source : {f.source}</Texte>
    </Ecran>
  );
}
