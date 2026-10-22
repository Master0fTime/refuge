import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ILLUSTRATIONS } from '@/components/Illustrations';
import { Bouton, Carte, Ecran, Ligne, Sous, Texte, Titre } from '@/components/ui';
import { CATEGORIES, fiche } from '@/data/fiches';
import { localiser, usePays } from '@/lib/pays';
import { c } from '@/lib/theme';
import { arreterLecture, dire } from '@/lib/voix';
import { t, traduireFiche } from '@/i18n';

export default function FicheEcran() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const brute = fiche(id);
  const f = brute && traduireFiche(brute);
  const [pays] = usePays();
  const L = (t: string) => localiser(t, pays);
  const [lecture, setLecture] = useState(false);
  useEffect(
    () => () => {
      arreterLecture();
    },
    [id],
  );
  if (!f) {
    return (
      <Ecran>
        <Texte>{t('Fiche introuvable.')}</Texte>
      </Ecran>
    );
  }
  const cat = CATEGORIES.find((x) => x.id === f.cat);

  return (
    <Ecran>
      <Stack.Screen options={{ title: cat ? t(cat.nom) : '' }} />
      <Titre>{f.titre}</Titre>
      <Texte muted>{L(f.resume)}</Texte>

      {f.id === 'rcp' && <Bouton label={t('Lancer le métronome de massage')} icone="pulse" couleur={c.danger} grand onPress={() => router.push('/rcp')} />}
      {ILLUSTRATIONS[f.id] && (() => {
        const Schema = ILLUSTRATIONS[f.id];
        return <Schema />;
      })()}
      {(f.etapes || f.sansSecours) && (
        <Bouton
          label={lecture ? t('Arrêter la lecture') : t('Écouter la fiche')}
          icone={lecture ? 'stop-circle' : 'volume-high'}
          discret
          onPress={() => {
            if (lecture) {
              arreterLecture();
              setLecture(false);
              return;
            }
            // Lecture étape par étape, pour garder les mains libres pendant les gestes.
            const texte = [
              f.titre,
              L(f.resume),
              ...(f.etapes ?? []).map((e, i) => `${t('Étape {n}.', { n: i + 1 })} ${L(e)}`),
              ...(f.sansSecours?.length ? [t('Si personne ne peut venir.'), ...f.sansSecours.map(L)] : []),
              ...(f.attention ?? []).map((a) => t("Attention. {v1}", { v1: L(a) })),
            ].join(' ');
            setLecture(true);
            dire(texte, { finie: () => setLecture(false) });
          }}
        />
      )}

      {f.choix?.map((ch) => (
        <Ligne key={ch.fiche} titre={L(ch.label)} icone="arrow-forward-circle" couleur={cat?.couleur} onPress={() => router.push(`/fiche/${ch.fiche}`)} />
      ))}

      {f.etapes && (
        <Carte couleur={cat?.couleur}>
          {f.etapes.map((e, i) => (
            <Texte key={i}>
              <Texte muted>{i + 1}. </Texte>
              {L(e)}
            </Texte>
          ))}
        </Carte>
      )}

      {f.sansSecours && (
        <>
          <Sous>{t('Si personne ne peut venir')}</Sous>
          <Carte couleur={c.accent}>
            {f.sansSecours.map((a, i) => (
              <Texte key={i}>• {L(a)}</Texte>
            ))}
          </Carte>
        </>
      )}

      {f.attention && (
        <>
          <Sous>{t('Attention')}</Sous>
          <Carte couleur={c.danger}>
            {f.attention.map((a, i) => (
              <Texte key={i}>⚠ {L(a)}</Texte>
            ))}
          </Carte>
        </>
      )}

      {f.ensuite && (
        <>
          <Sous>{t('Ensuite')}</Sous>
          <Carte>
            {f.ensuite.map((a, i) => (
              <Texte key={i}>• {L(a)}</Texte>
            ))}
          </Carte>
        </>
      )}

      {f.liees && (
        <>
          <Sous>{t('Voir aussi')}</Sous>
          {f.liees.map((lid) => {
            const l = fiche(lid);
            return l ? <Ligne key={lid} titre={traduireFiche(l).titre} icone="document-text" onPress={() => router.push(`/fiche/${lid}`)} /> : null;
          })}
        </>
      )}

      <Texte muted>{t('Source : {s}', { s: f.source })}</Texte>
    </Ecran>
  );
}
