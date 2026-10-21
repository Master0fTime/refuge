import { Text, View } from 'react-native';
import { c } from '@/lib/theme';

// Affiche le peu de mise en forme que produit l'IA (gras **…**, listes « - »), sans bibliothèque Markdown.

function Ligne({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={{ color: c.text, fontSize: 16, lineHeight: 23 }}>
      {morceaux.map((m, i) =>
        m.startsWith('**') && m.endsWith('**') ? (
          <Text key={i} style={{ fontWeight: '800' }}>
            {m.slice(2, -2)}
          </Text>
        ) : (
          m.replace(/^#+\s*/, '')
        ),
      )}
    </Text>
  );
}

export function TexteRiche({ texte }: { texte: string }) {
  const lignes = texte.split('\n');
  return (
    <View style={{ gap: 6 }}>
      {lignes.map((l, i) => {
        if (!l.trim()) return null;
        const puce = l.match(/^\s*[-*•]\s+(.*)$/);
        const numero = l.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (puce || numero)
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
              <Text style={{ color: c.accent, fontSize: 16, lineHeight: 23, fontWeight: '800' }}>{numero ? `${numero[1]}.` : '•'}</Text>
              <View style={{ flex: 1 }}>
                <Ligne texte={puce ? puce[1] : numero![2]} />
              </View>
            </View>
          );
        return <Ligne key={i} texte={l} />;
      })}
    </View>
  );
}
