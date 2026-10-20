import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { Bouton, Ecran, Ligne, Sous, Texte } from '@/components/ui';
import { FICHES } from '@/data/fiches';
import { c } from '@/lib/theme';

export default function Urgence() {
  const vitales = FICHES.filter((f) => f.cat === 'vital');
  return (
    <Ecran>
      <Bouton label="Que se passe-t-il ?" icone="help-buoy" grand onPress={() => router.push('/guide')} />
      <Texte muted>Réponds à 2 ou 3 questions : l’appli te donne les bons réflexes selon l’endroit où tu es.</Texte>
      <Bouton label="Poser une question" icone="chatbubbles" discret onPress={() => router.push('/demander')} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label="Appeler le 112" icone="call" couleur={c.danger} onPress={() => Linking.openURL('tel:112')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label="SMS 114" icone="chatbubble" discret onPress={() => Linking.openURL('sms:114')} />
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
      <Ligne titre="IA hors ligne" sous="Installer ou changer le modèle" icone="hardware-chip" onPress={() => router.push('/ia')} />
    </Ecran>
  );
}
