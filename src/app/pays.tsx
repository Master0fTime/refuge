import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';
import { Carte, Ecran, s, Sous, Texte, Titre } from '@/components/ui';
import { PAYS } from '@/data/pays';
import { usePays } from '@/lib/pays';
import { c, space } from '@/lib/theme';

function LigneNumero({ nom, numero }: { nom: string; numero: string }) {
  return (
    <Pressable style={s.ligne} onPress={() => Linking.openURL(`tel:${numero.replace(/\s/g, '')}`)}>
      <Ionicons name="call" size={22} color={c.ok} />
      <Text style={[s.ligneTitre, { flex: 1 }]}>{nom}</Text>
      <Text style={{ color: c.accent, fontSize: 20, fontWeight: '800' }}>{numero}</Text>
    </Pressable>
  );
}

export default function PaysEcran() {
  const [pays, setPays] = usePays();

  return (
    <Ecran>
      <Titre>
        {pays.drapeau} {pays.nom}
      </Titre>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {PAYS.map((p) => (
          <Pressable
            key={p.code}
            onPress={() => setPays(p.code)}
            style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: p.code === pays.code ? c.accent : c.cardAlt }}>
            <Text style={{ color: p.code === pays.code ? '#000' : c.text, fontSize: 16, fontWeight: '700' }}>
              {p.drapeau} {p.nom}
            </Text>
          </Pressable>
        ))}
      </View>
      <Texte muted>Le pays choisi adapte les numéros dans toutes les fiches et dans les réponses de l’IA.</Texte>

      <Sous>Numéros d’urgence</Sous>
      <LigneNumero nom="Urgence (toute l’Europe)" numero="112" />
      {pays.ambulance !== '112' && <LigneNumero nom="Ambulance, urgence médicale" numero={pays.ambulance} />}
      <LigneNumero nom="Police" numero={pays.police} />
      {pays.pompiers !== '112' && <LigneNumero nom="Pompiers" numero={pays.pompiers} />}
      <LigneNumero nom={`Intoxication : ${pays.antipoisonNom}`} numero={pays.antipoison} />
      <LigneNumero nom={`Écoute, détresse : ${pays.aidePsyNom}`} numero={pays.aidePsy} />
      {pays.autres.map((a) => (
        <LigneNumero key={a.numero + a.nom} nom={a.nom} numero={a.numero} />
      ))}
      {pays.sms && (
        <Pressable style={s.ligne} onPress={() => Linking.openURL(`sms:${pays.sms}`)}>
          <Ionicons name="chatbubble" size={22} color={c.info} />
          <Text style={[s.ligneTitre, { flex: 1 }]}>SMS d’urgence (si tu ne peux pas parler)</Text>
          <Text style={{ color: c.accent, fontSize: 20, fontWeight: '800' }}>{pays.sms}</Text>
        </Pressable>
      )}

      <Sous>Alertes et sirènes</Sous>
      <Carte couleur={c.danger}>
        <Texte>Application et alertes officielles : {pays.alerteApp}.</Texte>
        {pays.sirenes.map((t, i) => (
          <Texte key={i}>• {t}</Texte>
        ))}
      </Carte>

      <Sous>Radios à écouter</Sous>
      <Carte>
        <Texte>{pays.radios}</Texte>
        <Texte muted>Garde une radio à piles ou à dynamo : elle marche même quand tout le reste est coupé.</Texte>
      </Carte>

      {pays.abris && (
        <>
          <Sous>Abris</Sous>
          <Carte>
            <Texte>{pays.abris}</Texte>
          </Carte>
        </>
      )}
      {pays.provisions && (
        <>
          <Sous>Réserves conseillées</Sous>
          <Carte>
            <Texte>{pays.provisions}</Texte>
          </Carte>
        </>
      )}

      <Sous>Aide alimentaire et sociale</Sous>
      <Carte>
        <Texte>{pays.orgsAide}</Texte>
      </Carte>

      {!pays.verifie && (
        <Texte muted>Ces informations sont en cours de vérification par des personnes du pays. En cas de doute, le 112 fonctionne partout en Europe.</Texte>
      )}
    </Ecran>
  );
}
