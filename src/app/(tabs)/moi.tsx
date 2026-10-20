import { router } from 'expo-router';
import { View } from 'react-native';
import { Bouton, Carte, Champ, Ecran, Sous, Texte } from '@/components/ui';
import { KEYS, useStored } from '@/lib/store';
import { c } from '@/lib/theme';
import { profilVide, type Profil } from '@/lib/types';

const GROUPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Je ne sais pas'];

export default function CarteDeVie() {
  const [profil, setProfil] = useStored<Profil>(KEYS.profil, profilVide(''));
  const maj = (k: keyof Profil) => (v: string) => setProfil({ ...profil, [k]: v });

  return (
    <Ecran>
      <Carte couleur={c.info}>
        <Texte>
          Ces informations restent UNIQUEMENT sur ton téléphone. Elles servent aux secours si tu ne peux plus parler.
        </Texte>
      </Carte>

      <Sous>Identité</Sous>
      <Champ label="Prénom" value={profil.prenom} onChangeText={maj('prenom')} />
      <Champ label="Nom" value={profil.nom} onChangeText={maj('nom')} />
      <Champ label="Date de naissance" placeholder="JJ/MM/AAAA" value={profil.naissance} onChangeText={maj('naissance')} />
      <Champ label="Mon téléphone" keyboardType="phone-pad" value={profil.telephone} onChangeText={maj('telephone')} />
      <Champ label="Langues parlées" value={profil.langues} onChangeText={maj('langues')} />

      <Sous>Santé</Sous>
      <Texte muted>Groupe sanguin</Texte>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GROUPES.map((g) => (
          <View key={g} style={{ minWidth: 70 }}>
            <Bouton label={g} discret={profil.groupeSanguin !== g} couleur={c.danger} onPress={() => maj('groupeSanguin')(g)} />
          </View>
        ))}
      </View>
      <Champ label="Allergies (médicaments, aliments, piqûres)" multiline value={profil.allergies} onChangeText={maj('allergies')} />
      <Champ label="Traitements en cours" multiline value={profil.traitements} onChangeText={maj('traitements')} />
      <Champ label="Maladies, antécédents, appareils (diabète, épilepsie, pacemaker…)" multiline value={profil.antecedents} onChangeText={maj('antecedents')} />
      <Champ label="Poids approximatif (kg)" keyboardType="numeric" value={profil.poids} onChangeText={maj('poids')} />

      <Sous>À prévenir</Sous>
      <Champ label="Personne de confiance (nom + téléphone)" multiline value={profil.personneConfiance} onChangeText={maj('personneConfiance')} />
      <Champ label="Autres informations (directives, religion, animal à récupérer…)" multiline value={profil.notes} onChangeText={maj('notes')} />
      <Texte muted>Tes contacts marqués ★ prioritaires dans l’onglet Groupe s’ajoutent automatiquement à ta carte d’urgence.</Texte>

      <Sous>Rendre la carte visible téléphone verrouillé</Sous>
      <Bouton label="Créer mon fond d’écran d’urgence" icone="image" onPress={() => router.push('/carte-urgence')} />
      <Carte>
        <Texte>Fais AUSSI ceci, c’est ce que les secours regardent en premier :</Texte>
        <Texte>• iPhone : appli Santé → ta photo → Fiche médicale → activer « Afficher si verrouillé ».</Texte>
        <Texte>• Android : Paramètres → Sécurité et urgence (ou « Informations d’urgence ») → Infos médicales et contacts d’urgence.</Texte>
        <Texte muted>Ces fiches s’ouvrent depuis le bouton « Urgence » de l’écran verrouillé, sans code.</Texte>
      </Carte>
    </Ecran>
  );
}
