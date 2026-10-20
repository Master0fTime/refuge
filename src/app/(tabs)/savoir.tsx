import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Champ, Ecran, Ligne, s, Texte } from '@/components/ui';
import { CATEGORIES, FICHES } from '@/data/fiches';
import { chercher } from '@/lib/recherche';
import { c } from '@/lib/theme';

export default function Savoir() {
  const [q, setQ] = useState('');
  const [ouverte, setOuverte] = useState<string | null>(null);
  const resultats = chercher(q, 20);

  return (
    <Ecran>
      <Champ label="Rechercher" placeholder="ex. feu sans briquet, eau, plaie…" value={q} onChangeText={setQ} />

      {q.trim() ? (
        resultats.length ? (
          resultats.map(({ fiche: f, extrait }) => <Ligne key={f.id} titre={f.titre} sous={extrait} icone="document-text" onPress={() => router.push(`/fiche/${f.id}`)} />)
        ) : (
          <Texte muted>Aucune fiche trouvée. Essaie un autre mot.</Texte>
        )
      ) : (
        CATEGORIES.map((cat) => (
          <View key={cat.id} style={{ gap: 6 }}>
            <Pressable style={s.ligne} onPress={() => setOuverte(ouverte === cat.id ? null : cat.id)}>
              <Ionicons name={cat.icone} size={26} color={cat.couleur} />
              <Text style={[s.ligneTitre, { flex: 1 }]}>{cat.nom}</Text>
              <Ionicons name={ouverte === cat.id ? 'chevron-up' : 'chevron-down'} size={20} color={c.muted} />
            </Pressable>
            {ouverte === cat.id &&
              FICHES.filter((f) => f.cat === cat.id).map((f) => (
                <View key={f.id} style={{ marginLeft: 16 }}>
                  <Ligne titre={f.titre} onPress={() => router.push(`/fiche/${f.id}`)} />
                </View>
              ))}
          </View>
        ))
      )}
    </Ecran>
  );
}
