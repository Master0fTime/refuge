import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { c, space } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Ecran({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={s.ecran} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Titre({ children }: { children: ReactNode }) {
  return <Text style={s.titre}>{children}</Text>;
}

export function Sous({ children }: { children: ReactNode }) {
  return <Text style={s.sous}>{children}</Text>;
}

export function Texte({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[s.texte, muted && { color: c.muted }]}>{children}</Text>;
}

export function Carte({ children, couleur }: { children: ReactNode; couleur?: string }) {
  return <View style={[s.carte, couleur && { borderLeftColor: couleur, borderLeftWidth: 4 }]}>{children}</View>;
}

type BoutonProps = {
  label: string;
  onPress: () => void;
  icone?: IconName;
  couleur?: string;
  grand?: boolean;
  discret?: boolean;
};

export function Bouton({ label, onPress, icone, couleur = c.accent, grand, discret }: BoutonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.bouton,
        discret ? { backgroundColor: c.cardAlt } : { backgroundColor: couleur },
        grand && { paddingVertical: space.lg + 4 },
        pressed && { opacity: 0.7 },
      ]}>
      {icone && <Ionicons name={icone} size={grand ? 28 : 20} color={discret ? c.text : '#000'} />}
      <Text style={[s.boutonTxt, grand && { fontSize: 19 }, discret && { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Ligne({
  titre,
  sous,
  icone,
  couleur = c.accent,
  onPress,
}: {
  titre: string;
  sous?: string;
  icone?: IconName;
  couleur?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.ligne, pressed && { opacity: 0.7 }]}>
      {icone && <Ionicons name={icone} size={26} color={couleur} />}
      <View style={{ flex: 1 }}>
        <Text style={s.ligneTitre}>{titre}</Text>
        {sous ? <Text style={s.ligneSous}>{sous}</Text> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={c.muted} />}
    </Pressable>
  );
}

export function Champ({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={c.muted} style={[s.champ, props.multiline && { minHeight: 70 }]} {...props} />
    </View>
  );
}

export const s = StyleSheet.create({
  ecran: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  titre: { color: c.text, fontSize: 24, fontWeight: '800' },
  sous: { color: c.accent, fontSize: 15, fontWeight: '700', marginTop: space.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  texte: { color: c.text, fontSize: 16, lineHeight: 23 },
  carte: { backgroundColor: c.card, borderRadius: 12, padding: space.lg, gap: space.sm },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md + 2,
    paddingHorizontal: space.lg,
    borderRadius: 12,
  },
  boutonTxt: { color: '#000', fontSize: 16, fontWeight: '700' },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: c.card,
    borderRadius: 12,
    padding: space.lg,
  },
  ligneTitre: { color: c.text, fontSize: 17, fontWeight: '600' },
  ligneSous: { color: c.muted, fontSize: 14, marginTop: 2 },
  label: { color: c.muted, fontSize: 14 },
  champ: {
    backgroundColor: c.card,
    color: c.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
  },
});
