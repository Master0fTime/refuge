import { useUpdates } from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Carte, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { NOUVEAUTES } from '@/data/version';
import { formatTaille } from '@/lib/ia/modeles';
import { useApkDisponible, appliquerContenu, installerApk, verifierContenu, versionInstallee, type EtatContenu } from '@/lib/mises-a-jour';
import { c } from '@/lib/theme';

const date = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function MisesAJour() {
  const v = versionInstallee();
  const apk = useApkDisponible();
  const { isUpdatePending, isUpdateAvailable, isDownloading, downloadProgress, availableUpdate } = useUpdates();
  const [etat, setEtat] = useState<EtatContenu | 'verif' | null>(null);
  const [progresApk, setProgresApk] = useState<number | null>(null);

  const verifier = async () => {
    setEtat('verif');
    setEtat(await verifierContenu());
  };

  useEffect(() => {
    verifier();
  }, []);

  const prete = isUpdatePending || etat === 'prete';

  const installerNouvelleVersion = async () => {
    setProgresApk(0);
    try {
      await installerApk(setProgresApk);
    } catch (e) {
      Alert.alert('Installation impossible', String(e instanceof Error ? e.message : e));
    } finally {
      setProgresApk(null);
    }
  };

  return (
    <Ecran>
      <Titre>Refuge {v.version}</Titre>
      <Texte muted>
        Version de l’appli : {v.version} (n° {v.build}){'\n'}
        Contenu : {v.contenu ? `mise à jour du ${date(v.contenu)} (${v.idContenu})` : 'version d’origine de l’appli'}
      </Texte>

      {apk && (
        <Carte couleur={c.danger}>
          <Texte>Une nouvelle version COMPLÈTE de Refuge ({apk.version}) est disponible : elle apporte de nouvelles fonctions.</Texte>
          <Texte muted>
            {formatTaille(apk.octets)} · publiée le {new Date(apk.date).toLocaleDateString('fr-CH')} · tes données sont conservées
          </Texte>
          {progresApk !== null ? (
            <>
              <View style={{ height: 10, backgroundColor: c.cardAlt, borderRadius: 5, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(progresApk * 100)}%`, height: '100%', backgroundColor: c.accent }} />
              </View>
              <Texte muted>{Math.round(progresApk * 100)} %</Texte>
            </>
          ) : (
            <Bouton label="Télécharger et installer" icone="download" grand onPress={installerNouvelleVersion} />
          )}
          <Texte muted>Android te demandera d’autoriser l’installation depuis Refuge (une seule fois), puis de confirmer « Mettre à jour ».</Texte>
        </Carte>
      )}

      <Sous>Mise à jour du contenu</Sous>
      <Carte couleur={prete ? c.ok : isUpdateAvailable ? c.accent : undefined}>
        {prete ? (
          <>
            <Texte>
              Une mise à jour est téléchargée et prête{availableUpdate?.createdAt ? ` (du ${date(availableUpdate.createdAt)})` : ''}.
            </Texte>
            <Bouton label="Installer maintenant (redémarre l’appli)" icone="refresh" grand couleur={c.ok} onPress={appliquerContenu} />
          </>
        ) : (
          <>
            <Texte>
              {isDownloading
                ? `Téléchargement… ${Math.round((downloadProgress ?? 0) * 100)} %`
                : etat === 'verif'
                  ? 'Recherche de mise à jour…'
                  : etat === 'a-jour'
                    ? 'Refuge est à jour ✓'
                    : etat === 'hors-ligne'
                      ? 'Pas de connexion : impossible de vérifier. Réessaie quand tu as Internet.'
                      : etat === 'indisponible'
                        ? 'Vérification indisponible dans cette version (mode développement).'
                        : ''}
            </Texte>
            <Bouton label="Rechercher une mise à jour" icone="cloud-download" discret onPress={verifier} />
          </>
        )}
      </Carte>
      <Texte muted>Refuge vérifie aussi tout seul à chaque ouverture, quand Internet est disponible, et te prévient sur l’accueil.</Texte>

      <Sous>Nouveautés</Sous>
      {NOUVEAUTES.map((n) => (
        <Carte key={n.version}>
          <Texte>
            Version {n.version} · {new Date(n.date).toLocaleDateString('fr-CH')}
          </Texte>
          {n.points.map((p, i) => (
            <Texte key={i} muted>
              • {p}
            </Texte>
          ))}
        </Carte>
      ))}
    </Ecran>
  );
}
