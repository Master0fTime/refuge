import { useUpdates } from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Carte, Ecran, Sous, Texte, Titre } from '@/components/ui';
import { NOUVEAUTES } from '@/data/version';
import { formatTaille } from '@/lib/ia/modeles';
import { chercherApk, useApkDisponible, appliquerContenu, installerApk, verifierContenu, versionInstallee, type EtatContenu } from '@/lib/mises-a-jour';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

const date = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function MisesAJour() {
  const v = versionInstallee();
  const apk = useApkDisponible();
  const { isUpdatePending, isUpdateAvailable, isDownloading, downloadProgress, availableUpdate } = useUpdates();
  const [etat, setEtat] = useState<EtatContenu | 'verif' | null>(null);
  const [progresApk, setProgresApk] = useState<number | null>(null);
  const [test, setTest] = useStored<boolean>(KEYS.versionsTest, false);

  const basculerTest = () => {
    setTest(!test);
    chercherApk();
  };

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
      Alert.alert(t("Installation impossible"), String(e instanceof Error ? e.message : e));
    } finally {
      setProgresApk(null);
    }
  };

  return (
    <Ecran>
      <Titre>{t("Refuge ")}{v.version}</Titre>
      <Texte muted>
        {t("Version de l’appli : ")}{v.version} (n° {v.build}){'\n'}
        {t("Contenu : ")}{v.contenu ? t("mise à jour du {v1} ({idContenu})", { v1: date(v.contenu), idContenu: v.idContenu }) : t("version d’origine de l’appli")}
      </Texte>

      {apk && (
        <Carte couleur={c.danger}>
          <Texte>{t("Une nouvelle version COMPLÈTE de Refuge (")}{apk.version}{t(") est disponible : elle apporte de nouvelles fonctions.")}</Texte>
          <Texte muted>
            {formatTaille(apk.octets)} {t(" · publiée le ")}{new Date(apk.date).toLocaleDateString('fr-CH')} {t(" · tes données sont conservées")}</Texte>
          {progresApk !== null ? (
            <>
              <View style={{ height: 10, backgroundColor: c.cardAlt, borderRadius: 5, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(progresApk * 100)}%`, height: '100%', backgroundColor: c.accent }} />
              </View>
              <Texte muted>{Math.round(progresApk * 100)} %</Texte>
            </>
          ) : (
            <Bouton label={t("Télécharger et installer")} icone="download" grand onPress={installerNouvelleVersion} />
          )}
          <Texte muted>{t("Android te demandera d’autoriser l’installation depuis Refuge (une seule fois), puis de confirmer « Mettre à jour ».")}</Texte>
        </Carte>
      )}

      <Sous>{t("Mise à jour du contenu")}</Sous>
      <Carte couleur={prete ? c.ok : isUpdateAvailable ? c.accent : undefined}>
        {prete ? (
          <>
            <Texte>
              {t("Une mise à jour est téléchargée et prête")}{availableUpdate?.createdAt ? ` (du ${date(availableUpdate.createdAt)})` : ''}.
            </Texte>
            <Bouton label={t("Installer maintenant (redémarre l’appli)")} icone="refresh" grand couleur={c.ok} onPress={appliquerContenu} />
          </>
        ) : (
          <>
            <Texte>
              {isDownloading
                ? t("Téléchargement… {v1} %", { v1: Math.round((downloadProgress ?? 0) * 100) })
                : etat === 'verif'
                  ? t("Recherche de mise à jour…")
                  : etat === 'a-jour'
                    ? t("Refuge est à jour ✓")
                    : etat === 'hors-ligne'
                      ? t("Pas de connexion : impossible de vérifier. Réessaie quand tu as Internet.")
                      : etat === 'indisponible'
                        ? t("Vérification indisponible dans cette version (mode développement).")
                        : ''}
            </Texte>
            <Bouton label={t("Rechercher une mise à jour")} icone="cloud-download" discret onPress={verifier} />
          </>
        )}
      </Carte>
      <Texte muted>{t("Refuge vérifie aussi tout seul à chaque ouverture, quand Internet est disponible, et te prévient sur l’accueil.")}</Texte>

      <Sous>{t('Versions de test')}</Sous>
      <Carte couleur={test ? c.accent : undefined}>
        <Texte>
          {test
            ? t('Activées : Refuge te propose aussi les versions complètes en cours d’essai, dès leur publication.')
            : t('Pour tester les nouveautés avant tout le monde. Elles peuvent contenir des bugs.')}
        </Texte>
        <Bouton label={test ? t('Ne plus recevoir les versions de test') : t('Recevoir les versions de test')} icone="flask" discret={test} onPress={basculerTest} />
      </Carte>

      <Sous>{t("Nouveautés")}</Sous>
      {NOUVEAUTES.map((n) => (
        <Carte key={n.version}>
          <Texte>
            {t("Version ")}{n.version} · {new Date(n.date).toLocaleDateString('fr-CH')}
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
