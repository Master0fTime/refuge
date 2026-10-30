import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Champ, Ecran, Ligne, s, Sous, Texte } from '@/components/ui';
import { CATEGORIES, FICHES } from '@/data/fiches';
import { chercherEncyclopedie, encyclopedieInstallee, type PassageEncyclopedie } from '@/lib/encyclopedie';
import { chercher } from '@/lib/recherche';
import { c } from '@/lib/theme';
import { t, traduireFiche } from '@/i18n';

export default function Savoir() {
  // Deux tuiles ouvrent cet écran : « Secours » (fiches) et « Wikipédia » (encyclopédie seule).
  const { mode } = useLocalSearchParams<{ mode?: 'fiches' | 'encyclo' }>();
  const wiki = mode === 'encyclo';
  const [installee, setInstallee] = useState<boolean | null>(null);
  const [q, setQ] = useState('');
  const [ouverte, setOuverte] = useState<string | null>(null);
  const resultats = chercher(q, 20);
  const [encyclo, setEncyclo] = useState<PassageEncyclopedie[]>([]);

  // L'encyclopédie complète les fiches ; on attend une petite pause dans la frappe avant de chercher.
  useEffect(() => {
    if (!q.trim()) return setEncyclo([]);
    const minuteur = setTimeout(() => chercherEncyclopedie(q, 8).then(setEncyclo), 300);
    return () => clearTimeout(minuteur);
  }, [q]);

  useEffect(() => {
    if (wiki) encyclopedieInstallee().then(setInstallee);
    setQ('');
  }, [wiki]);

  if (wiki)
    return (
      <Ecran>
        <Stack.Screen options={{ title: t('Wikipédia') }} />
        <Champ label={t('Chercher dans l’encyclopédie')} placeholder={t('ex. tétanos, entorse, fièvre…')} value={q} onChangeText={setQ} />
        {installee === false && (
          <>
            <Texte muted>{t('L’encyclopédie n’est pas encore installée.')}</Texte>
            <Ligne titre={t('Préparer mon téléphone')} icone="download" onPress={() => router.push('/preparer')} />
          </>
        )}
        {q.trim() && installee && !encyclo.length && <Texte muted>{t('Aucun article trouvé. Essaie un autre mot.')}</Texte>}
        {encyclo.map((p) => (
          <Ligne key={p.article} titre={p.titre} sous={p.extrait} icone="library" onPress={() => router.push(`/article/${p.article}`)} />
        ))}
        {!q.trim() && installee && <Texte muted>{t('Environ 15 000 articles de médecine de Wikipédia, consultables sans Internet.')}</Texte>}
      </Ecran>
    );

  return (
    <Ecran>
      <Stack.Screen options={{ title: t('Secours') }} />
      <Champ label={t('Rechercher')} placeholder={t('ex. feu sans briquet, eau, plaie…')} value={q} onChangeText={setQ} />

      {q.trim() ? (
        <>
          {resultats.length ? (
            resultats.map(({ fiche: f, extrait }) => <Ligne key={f.id} titre={f.titre} sous={extrait} icone="document-text" onPress={() => router.push(`/fiche/${f.id}`)} />)
          ) : (
            <Texte muted>{t('Aucune fiche trouvée. Essaie un autre mot.')}</Texte>
          )}
          {encyclo.length > 0 && (
            <>
              <Sous>{t('Encyclopédie (Wikipédia)')}</Sous>
              {encyclo.map((p) => (
                <Ligne key={p.article} titre={p.titre} sous={p.extrait} icone="library" onPress={() => router.push(`/article/${p.article}`)} />
              ))}
            </>
          )}
        </>
      ) : (
        CATEGORIES.map((cat) => (
          <View key={cat.id} style={{ gap: 6 }}>
            <Pressable style={s.ligne} onPress={() => setOuverte(ouverte === cat.id ? null : cat.id)}>
              <Ionicons name={cat.icone} size={26} color={cat.couleur} />
              <Text style={[s.ligneTitre, { flex: 1 }]}>{t(cat.nom)}</Text>
              <Ionicons name={ouverte === cat.id ? 'chevron-up' : 'chevron-down'} size={20} color={c.muted} />
            </Pressable>
            {ouverte === cat.id &&
              FICHES.filter((f) => f.cat === cat.id).map((f) => (
                <View key={f.id} style={{ marginLeft: 16 }}>
                  <Ligne titre={traduireFiche(f).titre} onPress={() => router.push(`/fiche/${f.id}`)} />
                </View>
              ))}
          </View>
        ))
      )}
    </Ecran>
  );
}
