import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Carte, Texte, Titre } from '@/components/ui';
import { espaceLibre, finaliser, formatTaille, FICHIERS_VISION, preparerDossier, ramGo, supprimer, telecharger, VISION, visionInstallee } from '@/lib/ia/modeles';
import { liberer } from '@/lib/ia/moteur';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

const TOTAL = FICHIERS_VISION.reduce((s, f) => s + f.octets, 0);

/** Pack optionnel « Vision » : comprendre une photo. Deux fichiers téléchargés l'un après l'autre. */
export function CarteVision() {
  const [installee, setInstallee] = useState<boolean | null>(null);
  const [progres, setProgres] = useState<number | null>(null);
  const ram = ramGo();
  const tropPeu = ram !== null && ram < VISION.ramMinGo - 0.5;

  useEffect(() => {
    visionInstallee().then(setInstallee);
  }, []);

  const installer = async () => {
    const libre = await espaceLibre();
    if (libre < TOTAL * 1.1) {
      Alert.alert(t('Pas assez de place'), t('Il faut {v1} libres (il reste {v2}).', { v1: formatTaille(TOTAL), v2: formatTaille(libre) }));
      return;
    }
    await preparerDossier();
    setProgres(0);
    let fait = 0;
    try {
      for (const f of FICHIERS_VISION) {
        const r = await telecharger(f, (x) => setProgres((fait + x * f.octets) / TOTAL)).downloadAsync();
        if (!r || r.status >= 400) throw new Error(t('Téléchargement interrompu.'));
        await finaliser(f);
        fait += f.octets;
      }
      setInstallee(true);
    } catch (e) {
      Alert.alert(t('Téléchargement interrompu'), t('{v1}\nVérifie ta connexion et réessaie.', { v1: e instanceof Error ? e.message : String(e) }));
    } finally {
      setProgres(null);
    }
  };

  const retirer = () =>
    Alert.alert(t('Supprimer'), t('Supprimer {nom} ({v2}) ?', { nom: t(VISION.nom), v2: formatTaille(TOTAL) }), [
      { text: t('Annuler') },
      {
        text: t('Supprimer'),
        style: 'destructive',
        onPress: async () => {
          await liberer();
          for (const f of FICHIERS_VISION) await supprimer(f);
          setInstallee(false);
        },
      },
    ]);

  return (
    <Carte couleur={installee ? c.ok : undefined}>
      <Titre>{t(VISION.nom)}</Titre>
      <Texte>{t(VISION.description)}</Texte>
      <Texte muted>
        {t('{taille} · {ram} Go de mémoire minimum · optionnel', { taille: formatTaille(TOTAL), ram: VISION.ramMinGo })}
      </Texte>
      {tropPeu && <Texte muted>{t('Ton téléphone a peu de mémoire pour la vision : elle risque d’être très lente ou de planter.')}</Texte>}
      {progres !== null ? (
        <>
          <View style={{ height: 8, backgroundColor: c.cardAlt, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(progres * 100)}%`, height: '100%', backgroundColor: c.accent }} />
          </View>
          <Texte muted>{Math.round(progres * 100)} %</Texte>
        </>
      ) : installee ? (
        <>
          <Texte>{t('Installée ✓ Utilise le bouton 📷 dans « Poser une question ».')}</Texte>
          <Bouton label={t('Supprimer')} icone="trash" discret onPress={retirer} />
        </>
      ) : (
        <Bouton label={t('Télécharger ({v1})', { v1: formatTaille(TOTAL) })} icone="camera" onPress={installer} />
      )}
    </Carte>
  );
}
