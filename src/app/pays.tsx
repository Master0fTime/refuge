import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';
import { Carte, Ecran, s, Sous, Texte, Titre } from '@/components/ui';
import { PAYS } from '@/data/pays';
import { LANGUES, useLangue } from '@/lib/langue';
import { usePays } from '@/lib/pays';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

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
  const [langue, setLangue] = useLangue();

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
      <Texte muted>{t('Le pays choisi adapte les numéros dans toutes les fiches et dans les réponses de l’IA.')}</Texte>

      <Sous>{t('Langue de l’IA et de la voix')}</Sous>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {LANGUES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => setLangue(l.code)}
            style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: l.code === langue.code ? c.accent : c.cardAlt }}>
            <Text style={{ color: l.code === langue.code ? '#000' : c.text, fontSize: 16, fontWeight: '700' }}>
              {l.drapeau} {l.nom}
            </Text>
          </Pressable>
        ))}
      </View>
      <Texte muted>{t('L’IA te répond et t’écoute dans cette langue.')}</Texte>

      <Sous>{t('Numéros d’urgence')}</Sous>
      <LigneNumero nom={t('Urgence (toute l’Europe)')} numero="112" />
      {pays.ambulance !== '112' && <LigneNumero nom={t('Ambulance, urgence médicale')} numero={pays.ambulance} />}
      <LigneNumero nom={t('Police')} numero={pays.police} />
      {pays.pompiers !== '112' && <LigneNumero nom={t('Pompiers')} numero={pays.pompiers} />}
      <LigneNumero nom={t('Intoxication : {nom}', { nom: pays.antipoisonNom })} numero={pays.antipoison} />
      <LigneNumero nom={t('Écoute, détresse : {nom}', { nom: pays.aidePsyNom })} numero={pays.aidePsy} />
      {pays.autres.map((a) => (
        <LigneNumero key={a.numero + a.nom} nom={a.nom} numero={a.numero} />
      ))}
      {pays.sms && (
        <Pressable style={s.ligne} onPress={() => Linking.openURL(`sms:${pays.sms}`)}>
          <Ionicons name="chatbubble" size={22} color={c.info} />
          <Text style={[s.ligneTitre, { flex: 1 }]}>{t('SMS d’urgence (si tu ne peux pas parler)')}</Text>
          <Text style={{ color: c.accent, fontSize: 20, fontWeight: '800' }}>{pays.sms}</Text>
        </Pressable>
      )}

      <Sous>{t('Alertes et sirènes')}</Sous>
      <Carte couleur={c.danger}>
        <Texte>{t('Application et alertes officielles : {app}.', { app: pays.alerteApp })}</Texte>
        {pays.sirenes.map((t, i) => (
          <Texte key={i}>• {t}</Texte>
        ))}
      </Carte>

      <Sous>{t('Radios à écouter')}</Sous>
      <Carte>
        <Texte>{pays.radios}</Texte>
        <Texte muted>{t('Garde une radio à piles ou à dynamo : elle marche même quand tout le reste est coupé.')}</Texte>
      </Carte>

      {pays.abris && (
        <>
          <Sous>{t('Abris')}</Sous>
          <Carte>
            <Texte>{pays.abris}</Texte>
          </Carte>
        </>
      )}
      {pays.provisions && (
        <>
          <Sous>{t('Réserves conseillées')}</Sous>
          <Carte>
            <Texte>{pays.provisions}</Texte>
          </Carte>
        </>
      )}

      <Sous>{t('Aide alimentaire et sociale')}</Sous>
      <Carte>
        <Texte>{pays.orgsAide}</Texte>
      </Carte>

      {!pays.verifie && (
        <Texte muted>{t('Ces informations sont en cours de vérification par des personnes du pays. En cas de doute, le 112 fonctionne partout en Europe.')}</Texte>
      )}
    </Ecran>
  );
}
