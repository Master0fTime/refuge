import { router, useFocusEffect } from 'expo-router';
import { useUpdates } from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { Bouton, Carte, Ecran, Ligne, Sous, Texte } from '@/components/ui';
import { FICHES } from '@/data/fiches';
import { redemarrer } from '@/lib/maj';
import { telephonePret } from '@/lib/packs';
import { usePays } from '@/lib/pays';
import { useStored } from '@/lib/store';
import { c } from '@/lib/theme';

export default function Urgence() {
  const vitales = FICHES.filter((f) => f.cat === 'vital');
  const [pret, setPret] = useState<boolean | null>(null);
  const [accueilVu, setAccueilVu] = useStored<boolean>('accueilVu', false);
  const { isUpdatePending } = useUpdates();
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
          <Texte>Ton téléphone n’est pas encore prêt pour fonctionner sans Internet.</Texte>
          <Bouton label="Préparer mon téléphone" icone="download" couleur={c.ok} grand onPress={() => router.push('/preparer')} />
        </Carte>
      )}
      {isUpdatePending && (
        <Carte couleur={c.info}>
          <Texte>Une mise à jour de Refuge est prête.</Texte>
          <Bouton label="Redémarrer pour l’installer" icone="refresh" couleur={c.info} onPress={redemarrer} />
        </Carte>
      )}

      <Bouton label="Que se passe-t-il ?" icone="help-buoy" grand onPress={() => router.push('/guide')} />
      <Texte muted>Réponds à 2 ou 3 questions : l’appli te donne les bons réflexes selon l’endroit où tu es.</Texte>
      <Bouton label="J’ai peur, je panique" icone="heart-circle" couleur="#2dd4bf" onPress={() => router.push('/panique')} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 3 }}>
          <Bouton label="Parler à l’IA" icone="mic" couleur={c.info} grand onPress={() => router.push({ pathname: '/demander', params: { voix: '1' } })} />
        </View>
        <View style={{ flex: 2 }}>
          <Bouton label="Écrire" icone="create" discret grand onPress={() => router.push('/demander')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label="Appeler le 112" icone="call" couleur={c.danger} onPress={() => Linking.openURL('tel:112')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label={`Numéros ${pays.drapeau}`} icone="list" discret onPress={() => router.push('/pays')} />
        </View>
      </View>

      <Sous>Urgences vitales</Sous>
      {vitales.map((f) => (
        <Ligne key={f.id} titre={f.titre} icone="heart" couleur={c.danger} onPress={() => router.push(`/fiche/${f.id}`)} />
      ))}

      <Sous>Accès rapide</Sous>
      <Ligne titre="Mon groupe et nos points de ralliement" icone="people" onPress={() => router.push('/groupe')} />
      <Ligne titre="Ma carte de vie" sous="Groupe sanguin, allergies, contacts" icone="id-card" onPress={() => router.push('/moi')} />
      <Ligne titre="Lampe, SOS, boussole, GPS" icone="flashlight" onPress={() => router.push('/outils')} />
      <Ligne titre="Partager Refuge sans Internet" sous="Wi-Fi local + QR code, sans tes données privées" icone="share-social" onPress={() => router.push('/partager')} />
      <Ligne
        titre="Téléchargements et mises à jour"
        sous={pret ? 'Téléphone prêt ✓' : 'IA, voix, contenus hors ligne'}
        icone="cloud-download"
        onPress={() => router.push('/preparer')}
      />
      <Ligne titre="Réglages de l’IA" sous="Changer de modèle, importer un fichier" icone="hardware-chip" onPress={() => router.push('/ia')} />
    </Ecran>
  );
}
