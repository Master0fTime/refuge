import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Bouton, Texte } from '@/components/ui';
import { destinataires, envoyerStatut, type Statut } from '@/lib/statut';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

/** Deux gros boutons : prévenir tout son groupe par SMS en un geste. */
export function BoutonsStatut() {
  const [enCours, setEnCours] = useState<Statut | null>(null);

  const envoyer = async (s: Statut) => {
    if (enCours) return;
    setEnCours(s);
    try {
      await envoyerStatut(s);
    } catch (e) {
      Alert.alert(t("Message non préparé"), String(e instanceof Error ? e.message : e));
    } finally {
      setEnCours(null);
    }
  };

  const n = destinataires().length;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton label={enCours === 'ok' ? '…' : t('Je vais bien')} icone="checkmark-circle" couleur={c.ok} onPress={() => envoyer('ok')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton label={enCours === 'aide' ? '…' : t('J’ai besoin d’aide')} icone="alert-circle" couleur={c.danger} onPress={() => envoyer('aide')} />
        </View>
      </View>
      <Texte muted>
        {n ? t('SMS avec ta position à {n} proche(s) (groupe et contacts ★).', { n }) : t('Ajoute tes proches dans l’onglet Groupe pour pouvoir les prévenir en un geste.')}
      </Texte>
    </View>
  );
}
