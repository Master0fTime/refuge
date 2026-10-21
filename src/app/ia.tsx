import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import type { DownloadResumable } from 'expo-file-system/legacy';
import { Bouton, Carte, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { liberer } from '@/lib/ia/moteur';
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

type EtatDl = { progres: number; tache: DownloadResumable; enPause: boolean };

export default function ReglagesIA() {
  const [actif, setActif] = useStored<string | null>(KEYS.modele, null);
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
    Alert.alert('IA installée', `${m.nom} fonctionne maintenant sans Internet.`);
  };

  const lancer = async (m: Modele) => {
    if (libre !== null && libre < m.octets * 1.1) {
      Alert.alert('Pas assez de place', `Il faut ${formatTaille(m.octets)} libres (il reste ${formatTaille(libre)}).`);
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
      Alert.alert('Téléchargement interrompu', `${e instanceof Error ? e.message : e}\nTu peux reprendre là où il s’est arrêté.`);
    }
  };

  const pause = async (m: Modele) => {
    await dl[m.id]?.tache.pauseAsync();
    majDl(m.id, { enPause: true });
  };

  const reprendre = async (m: Modele) => {
    const t = dl[m.id]?.tache;
    if (!t) return;
    majDl(m.id, { enPause: false });
    try {
      const r = await t.resumeAsync();
      if (r) await terminer(m);
    } catch (e) {
      majDl(m.id, { enPause: true });
      Alert.alert('Téléchargement interrompu', String(e instanceof Error ? e.message : e));
    }
  };

  const retirer = (m: Modele) =>
    Alert.alert('Supprimer', `Supprimer ${m.nom} (${formatTaille(m.octets)}) ?`, [
      { text: 'Annuler' },
      {
        text: 'Supprimer',
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
      Alert.alert('IA importée', `${m.nom} est prête.`);
    } catch (e) {
      Alert.alert('Import impossible', String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <Ecran>
      <Carte couleur={c.info}>
        <Texte>
          L’IA tourne ENTIÈREMENT sur ton téléphone : rien n’est envoyé sur Internet. Elle ne répond qu’à partir des fiches de
          l’appli et cite ses sources.
        </Texte>
        <Texte muted>
          Mémoire du téléphone : {ram ? `${ram.toFixed(1)} Go` : 'inconnue'} · Espace libre : {libre !== null ? formatTaille(libre) : '…'}
        </Texte>
        {!conseille && (
          <Texte>Ton téléphone a peu de mémoire : l’IA risque d’être lente ou de planter. Les fiches et la recherche marchent sans elle.</Texte>
        )}
      </Carte>
      <Texte muted>Télécharge le modèle MAINTENANT, en Wi-Fi, pendant qu’Internet fonctionne.</Texte>

      {MODELES.map((m) => {
        const d = dl[m.id];
        const ok = installes[m.id];
        return (
          <Carte key={m.id} couleur={actif === m.id && ok ? c.ok : conseille?.id === m.id ? c.accent : undefined}>
            <Titre>{m.nom}</Titre>
            <Texte muted>
              {formatTaille(m.octets)} · {m.ramMinGo} Go de mémoire minimum
              {conseille?.id === m.id ? ' · CONSEILLÉ pour ton téléphone' : ''}
            </Texte>
            <Texte>{m.description}</Texte>
            {ok ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Bouton
                    label={actif === m.id ? 'Utilisé ✓' : 'Utiliser'}
                    discret={actif === m.id}
                    onPress={async () => {
                      await liberer();
                      setActif(m.id);
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Bouton label="Supprimer" icone="trash" discret onPress={() => retirer(m)} />
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
                  label={d.enPause ? 'Reprendre' : 'Pause'}
                  icone={d.enPause ? 'play' : 'pause'}
                  discret
                  onPress={() => (d.enPause ? reprendre(m) : pause(m))}
                />
              </>
            ) : (
              <Bouton label={`Télécharger (${formatTaille(m.octets)})`} icone="download" discret={conseille?.id !== m.id} onPress={() => lancer(m)} />
            )}
          </Carte>
        );
      })}

      <Sous>Sans Internet</Sous>
      <Texte muted>
        Un proche a déjà le fichier du modèle ? Copie-le sur ton téléphone (câble USB, carte SD, partage de fichiers), puis importe-le ici.
      </Texte>
      <Bouton label="Importer un modèle depuis un fichier" icone="folder-open" discret onPress={importerFichier} />
    </Ecran>
  );
}
