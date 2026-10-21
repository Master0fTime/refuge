import { router, useFocusEffect } from 'expo-router';
import { useUpdates } from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { BoutonsStatut } from '@/components/BoutonsStatut';
import { Bouton, Carte, Ecran, Ligne, Sous, Texte } from '@/components/ui';
import { FICHES } from '@/data/fiches';
import { apkDisponible, appliquerContenu } from '@/lib/mises-a-jour';
import { telephonePret } from '@/lib/packs';
import { usePays } from '@/lib/pays';
import { useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { t, traduireFiche } from '@/i18n';

export default function Urgence() {
  const vitales = FICHES.filter((f) => f.cat === 'vital');
  const [pret, setPret] = useState<boolean | null>(null);
  const [accueilVu, setAccueilVu] = useStored<boolean>('accueilVu', false);
  const { isUpdatePending, isUpdateAvailable } = useUpdates();
  const nouvelApk = apkDisponible();
  const [pays] = usePays();

  useFocusEffect(
    useCallback(() => {
      telephonePret().then(setPret);
    }, []),
  );

  // Premier lancement : on ouvre directement la préparation, c'est la première chose à faire.
  useEffect(() => {
    if (!accueilVu) {
      setAccueilVu(true);
      router.push('/preparer');
    }
  }, [accueilVu, setAccueilVu]);

  return (
    <Ecran>
      {pret === false && (
        <Carte couleur={c.ok}>
          <Texte>{t('Ton téléphone n’est pas encore prêt pour fonctionner sans Internet.')}</Texte>
          <Bouton label={t('Préparer mon téléphone')} icone="download" couleur={c.ok} grand onPress={() => router.push('/preparer')} />
        </Carte>
      )}
      {(nouvelApk || isUpdatePending || isUpdateAvailable) && (
        <Carte couleur={c.info}>
          <Texte>
            {nouvelApk
              ? t('Nouvelle version de Refuge disponible ({version}) : elle n’est pas encore installée.', { version: nouvelApk.version })
              : t('Une mise à jour de Refuge est disponible et n’est pas encore installée.')}
          </Texte>
          <Bouton
            label={isUpdatePending && !nouvelApk ? t('Installer maintenant') : t('Voir la mise à jour')}
            icone="refresh"
            couleur={c.info}
            onPress={() => (isUpdatePending && !nouvelApk ? appliquerContenu() : router.push('/mises-a-jour'))}
          />
        </Carte>
      )}

      <Bouton label={t('Que se passe-t-il ?')} icone="help-buoy" grand onPress={() => router.push('/guide')} />
      <Texte muted>{t('Réponds à 2 ou 3 questions : l’appli te donne les bons réflexes selon l’endroit où tu es.')}</Texte>
      <Bouton label={t('J’ai peur, je panique')} icone="heart-circle" couleur="#2dd4bf" onPress={() => router.push('/panique')} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 3 }}>
          <Bouton label={t('Parler à l’IA')} icone="mic" couleur={c.info} grand onPress={() => router.push({ pathname: '/demander', params: { voix: '1' } })} />
        </View>
        <View style={{ flex: 2 }}>
          <Bouton label={t('Écrire')} icone="create" discret grand onPress={() => router.push('/demander')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label={t('Appeler le 112')} icone="call" couleur={c.danger} onPress={() => Linking.openURL('tel:112')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label={t('Numéros {drapeau}', { drapeau: pays.drapeau })} icone="list" discret onPress={() => router.push('/pays')} />
        </View>
      </View>

      <Sous>{t('Prévenir mes proches')}</Sous>
      <BoutonsStatut />

      <Sous>{t('Urgences vitales')}</Sous>
      <Bouton label={t('Massage cardiaque : métronome')} icone="pulse" couleur={c.danger} onPress={() => router.push('/rcp')} />
      {vitales.map((f) => (
        <Ligne key={f.id} titre={traduireFiche(f).titre} icone="heart" couleur={c.danger} onPress={() => router.push(`/fiche/${f.id}`)} />
      ))}

      <Sous>{t('Accès rapide')}</Sous>
      <Ligne titre={t('Mon groupe et nos points de ralliement')} icone="people" onPress={() => router.push('/groupe')} />
      <Ligne titre={t('Ma carte de vie')} sous={t('Groupe sanguin, allergies, contacts')} icone="id-card" onPress={() => router.push('/moi')} />
      <Ligne titre={t('Lampe, SOS, boussole, GPS')} icone="flashlight" onPress={() => router.push('/outils')} />
      <Ligne titre={t('Partager Refuge sans Internet')} sous={t('Wi-Fi local + QR code, sans tes données privées')} icone="share-social" onPress={() => router.push('/partager')} />
      <Ligne titre={t('Mises à jour de Refuge')} sous={t('Version installée, nouveautés, installer en un bouton')} icone="refresh-circle" onPress={() => router.push('/mises-a-jour')} />
      <Ligne
        titre={t('Téléchargements hors ligne')}
        sous={pret ? t('Téléphone prêt ✓') : t('IA, voix, contenus hors ligne')}
        icone="cloud-download"
        onPress={() => router.push('/preparer')}
      />
      <Ligne titre={t('Réglages de l’IA')} sous={t('Changer de modèle, importer un fichier')} icone="hardware-chip" onPress={() => router.push('/ia')} />
      <Ligne titre={t('Voix de l’IA')} sous={t('Choisir une voix plus naturelle, la vitesse')} icone="volume-high" onPress={() => router.push('/reglages-voix')} />
    </Ecran>
  );
}
