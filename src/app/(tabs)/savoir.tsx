import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Champ, Ecran, Ligne, s, Sous, Texte } from '@/components/ui';
import { CATEGORIES, FICHES } from '@/data/fiches';
import { chercherEncyclopedie, type PassageEncyclopedie } from '@/lib/encyclopedie';
import { chercher } from '@/lib/recherche';
import { c } from '@/lib/theme';
import { t, traduireFiche } from '@/i18n';

export default function Savoir() {
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

  return (
    <Ecran>
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
