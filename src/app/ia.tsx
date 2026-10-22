import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { DownloadResumable } from 'expo-file-system/legacy';
import { Bouton, Carte, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { liberer, tester } from '@/lib/ia/moteur';
import {
  espaceLibre,
  estInstalle,
  finaliser,
  formatTaille,
  importer,
  MODELES,
  modeleConseille,
  preparerDossier,
  ramGo,
  supprimer,
  telecharger,
  type Modele,
} from '@/lib/ia/modeles';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

type EtatDl = { progres: number; tache: DownloadResumable; enPause: boolean };

export default function ReglagesIA() {
  const [actif, setActif] = useStored<string | null>(KEYS.modele, null);
  const [test, setTest] = useState<string | null>(null);
  const [installes, setInstalles] = useState<Record<string, boolean>>({});
  const [dl, setDl] = useState<Record<string, EtatDl>>({});
  const [libre, setLibre] = useState<number | null>(null);
  const monte = useRef(true);
  const conseille = modeleConseille();
  const ram = ramGo();

  const rafraichir = async () => {
    const r: Record<string, boolean> = {};
    for (const m of MODELES) r[m.id] = await estInstalle(m);
    if (monte.current) {
      setInstalles(r);
      setLibre(await espaceLibre());
    }
  };

  useEffect(() => {
    rafraichir();
    return () => {
      monte.current = false;
    };
  }, []);

  const majDl = (id: string, patch: Partial<EtatDl> | null) =>
    monte.current &&
    setDl((d) => {
      const n = { ...d };
      if (patch === null) delete n[id];
      else n[id] = { ...n[id], ...patch };
      return n;
    });

  const terminer = async (m: Modele) => {
    await finaliser(m);
    majDl(m.id, null);
    await rafraichir();
    if (!actif) setActif(m.id);
    Alert.alert(t("IA installée"), t("{nom} fonctionne maintenant sans Internet.", { nom: t(m.nom) }));
  };

  const lancer = async (m: Modele) => {
    if (libre !== null && libre < m.octets * 1.1) {
      Alert.alert(t("Pas assez de place"), t("Il faut {v1} libres (il reste {v2}).", { v1: formatTaille(m.octets), v2: formatTaille(libre) }));
      return;
    }
    await preparerDossier();
    const tache = telecharger(m, (p) => majDl(m.id, { progres: p }));
    majDl(m.id, { progres: 0, tache, enPause: false });
    try {
      const r = await tache.downloadAsync();
      if (r) await terminer(m);
    } catch (e) {
      majDl(m.id, { enPause: true });
      Alert.alert(t("Téléchargement interrompu"), t("{v1}\nTu peux reprendre là où il s’est arrêté.", { v1: e instanceof Error ? e.message : e }));
    }
  };

  const pause = async (m: Modele) => {
    await dl[m.id]?.tache.pauseAsync();
    majDl(m.id, { enPause: true });
  };

  const reprendre = async (m: Modele) => {
    const tache = dl[m.id]?.tache;
    if (!tache) return;
    majDl(m.id, { enPause: false });
    try {
      const r = await tache.resumeAsync();
      if (r) await terminer(m);
    } catch (e) {
      majDl(m.id, { enPause: true });
      Alert.alert(t("Téléchargement interrompu"), String(e instanceof Error ? e.message : e));
    }
  };

  const retirer = (m: Modele) =>
    Alert.alert(t("Supprimer"), t("Supprimer {nom} ({v2}) ?", { nom: t(m.nom), v2: formatTaille(m.octets) }), [
      { text: t("Annuler") },
      {
        text: t("Supprimer"),
        style: 'destructive',
        onPress: async () => {
          if (actif === m.id) {
            await liberer();
            setActif(null);
          }
          await supprimer(m);
          rafraichir();
        },
      },
    ]);

  const importerFichier = async () => {
    try {
      const m = await importer(MODELES);
      if (!m) return;
      await rafraichir();
      setActif(m.id);
      Alert.alert(t("IA importée"), t("{nom} est prête.", { nom: t(m.nom) }));
    } catch (e) {
      Alert.alert(t("Import impossible"), String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <Ecran>
      <Carte couleur={c.info}>
        <Texte>
          {t("L’IA tourne ENTIÈREMENT sur ton téléphone : rien n’est envoyé sur Internet. Elle ne répond qu’à partir des fiches de l’appli et cite ses sources.")}</Texte>
        <Texte muted>
          {t("Mémoire du téléphone : ")}{ram ? `${ram.toFixed(1)} Go` : 'inconnue'} {t(" · Espace libre : ")}{libre !== null ? formatTaille(libre) : '…'}
        </Texte>
        {!conseille && (
          <Texte>{t("Ton téléphone a peu de mémoire : l’IA risque d’être lente ou de planter. Les fiches et la recherche marchent sans elle.")}</Texte>
        )}
      </Carte>
      <Texte muted>{t("Télécharge le modèle MAINTENANT, en Wi-Fi, pendant qu’Internet fonctionne.")}</Texte>

      {MODELES.map((m) => {
        const d = dl[m.id];
        const ok = installes[m.id];
        return (
          <Carte key={m.id} couleur={actif === m.id && ok ? c.ok : conseille?.id === m.id ? c.accent : undefined}>
            <Titre>{t(m.nom)}</Titre>
            <Texte muted>
              {formatTaille(m.octets)} · {m.ramMinGo} {t(" Go de mémoire minimum")}{conseille?.id === m.id ? t(" · CONSEILLÉ pour ton téléphone") : ''}
            </Texte>
            <Texte>{t(m.description)}</Texte>
            {ok ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Bouton
                    label={actif === m.id ? t("Utilisé ✓") : t("Utiliser")}
                    discret={actif === m.id}
                    onPress={async () => {
                      await liberer();
                      setActif(m.id);
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Bouton label={t("Supprimer")} icone="trash" discret onPress={() => retirer(m)} />
                </View>
              </View>
            ) : d ? (
              <>
                <View style={{ height: 10, backgroundColor: c.cardAlt, borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.round(d.progres * 100)}%`, height: '100%', backgroundColor: c.accent }} />
                </View>
                <Texte muted>
                  {Math.round(d.progres * 100)} % · {formatTaille(d.progres * m.octets)} / {formatTaille(m.octets)}
                </Texte>
                <Bouton
                  label={d.enPause ? t("Reprendre") : t("Pause")}
                  icone={d.enPause ? 'play' : 'pause'}
                  discret
                  onPress={() => (d.enPause ? reprendre(m) : pause(m))}
                />
              </>
            ) : (
              <Bouton label={t("Télécharger ({v1})", { v1: formatTaille(m.octets) })} icone="download" discret={conseille?.id !== m.id} onPress={() => lancer(m)} />
            )}
          </Carte>
        );
      })}

      <Sous>{t("Diagnostic")}</Sous>
      <Bouton
        label={test === '…' ? t("Test en cours…") : t("Tester l’IA")}
        icone="speedometer"
        discret
        onPress={async () => {
          const m = MODELES.find((x) => x.id === actif);
          if (!m || !installes[m.id] || test === '…') return setTest(m ? t("Le modèle choisi n’est pas installé.") : t("Aucun modèle choisi."));
          setTest('…');
          try {
            const r = await tester(m);
            setTest(
              t("Chargement : {v1} s · premier mot : {v2} s · {motsParSeconde} mots/s\nRéponse : « {texte} »", { v1: (r.chargementMs / 1000).toFixed(1), v2: (r.premierMs / 1000).toFixed(1), motsParSeconde: r.motsParSeconde, texte: r.texte }),
            );
          } catch (e) {
            setTest(t("Erreur : {v1}", { v1: e instanceof Error ? e.message : String(e) }));
          }
        }}
      />
      {test && test !== '…' && (
        <Carte>
          <Text selectable style={{ color: c.text }}>
            {test}
          </Text>
        </Carte>
      )}

      <Sous>{t("Sans Internet")}</Sous>
      <Texte muted>
        {t("Un proche a déjà le fichier du modèle ? Copie-le sur ton téléphone (câble USB, carte SD, partage de fichiers), puis importe-le ici.")}</Texte>
      <Bouton label={t("Importer un modèle depuis un fichier")} icone="folder-open" discret onPress={importerFichier} />
    </Ecran>
  );
}
