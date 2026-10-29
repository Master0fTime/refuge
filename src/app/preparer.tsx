import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { FenetreKit } from '@/components/FenetreKit';
import { Bouton, Ecran, Ligne, Sous, Texte, Titre } from '@/components/ui';
import { formatTaille } from '@/lib/ia/modeles';
import { packs, type Pack } from '@/lib/packs';
import { taillePack, usePreparation } from '@/lib/preparation';
import { useLangue } from '@/lib/langue';
import { usePays } from '@/lib/pays';
import { c, space } from '@/lib/theme';
import { t } from '@/i18n';

/** Détail de chaque élément du kit hors ligne (le téléchargement lui-même tourne dans lib/preparation). */
export default function Preparer() {
  const liste = packs();
  const [pays] = usePays();
  const [langue] = useLangue();
  const { prets, progres, enCours } = usePreparation();
  const [fenetre, setFenetre] = useState(false);
  const toutPret = liste.filter((p) => p.disponible).every((p) => prets[p.id]);

  return (
    <Ecran>
      <Titre>{toutPret ? t('Ton téléphone est prêt ✅') : t('Prépare ton téléphone')}</Titre>
      <Texte muted>
        {toutPret
          ? t('Tout ce qui est disponible est installé. Refuge fonctionne maintenant sans Internet.')
          : t('À faire UNE FOIS, maintenant, pendant qu’Internet fonctionne. Ensuite, tout marche hors ligne.')}
      </Texte>

      <Ligne
        titre={t('Pays : {drapeau} {nom} · Langue : {drapeau3} {nom4}', { drapeau: pays.drapeau, nom: t(pays.nom), drapeau3: langue.drapeau, nom4: langue.nom })}
        sous={t('Numéros d’urgence, alertes, langue de l’IA et de la voix. Touche pour changer.')}
        icone="flag"
        onPress={() => router.push('/pays')}
      />

      {liste.map((p) => (
        <LignePack key={p.id} p={p} pret={!!prets[p.id]} progres={progres[p.id]} actif={enCours === p.id} />
      ))}

      {!toutPret && (
        <Bouton label={enCours ? t('Installation en cours…') : t('Tout préparer')} icone="download" grand onPress={() => !enCours && setFenetre(true)} />
      )}

      <Bouton label={t('Ajouter la carte détaillée de ma zone')} icone="map" discret onPress={() => router.push('/cartes')} />

      <Sous>{t('Sans Internet')}</Sous>
      <Bouton label={t('Récupérer depuis un proche')} icone="phone-portrait" discret onPress={() => router.push('/recevoir')} />
      <Bouton label={t('Partager Refuge à mes proches')} icone="share-social" discret onPress={() => router.push('/partager')} />

      <FenetreKit visible={fenetre} onFermer={() => setFenetre(false)} />
    </Ecran>
  );
}

function LignePack({ p, pret, progres, actif }: { p: Pack; pret: boolean; progres?: number; actif: boolean }) {
  const couleur = pret ? c.ok : p.disponible ? c.accent : c.muted;
  const taille = taillePack(p);
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: space.lg, gap: 6, opacity: p.disponible ? 1 : 0.6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Ionicons name={p.icone} size={26} color={couleur} />
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', flex: 1 }}>{t(p.nom)}</Text>
        <Text style={{ color: couleur, fontWeight: '700' }}>
          {pret ? t('Installé') : !p.disponible ? t('Trop lourd pour ce téléphone') : taille ? `≈ ${formatTaille(taille)}` : t('Inclus')}
        </Text>
      </View>
      <Texte muted>{t(p.utilite)}</Texte>
      {actif && (
        <View style={{ height: 8, backgroundColor: c.cardAlt, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round((progres ?? 0) * 100)}%`, height: '100%', backgroundColor: c.accent }} />
        </View>
      )}
    </View>
  );
}
