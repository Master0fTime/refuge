import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Carte, Ecran, Texte, Titre } from '@/components/ui';
import { LICENCE, lireArticle, type Article } from '@/lib/encyclopedie';
import { c } from '@/lib/theme';
import { t } from '@/i18n';

// Un article de l'encyclopédie hors ligne (Wikipédia, version abrégée).
export default function ArticleEncyclopedie() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    lireArticle(Number(id)).then(setArticle);
  }, [id]);

  if (article === undefined) return <Ecran>{null}</Ecran>;
  if (!article)
    return (
      <Ecran>
        <Texte muted>{t('Article introuvable. L’encyclopédie est-elle installée ?')}</Texte>
      </Ecran>
    );

  return (
    <Ecran>
      <Titre>{article.titre}</Titre>
      <Carte couleur={c.info}>
        <Texte muted>
          {t('Extrait de l’encyclopédie : pour comprendre. Pour agir, suis d’abord les fiches de Refuge. En cas d’urgence, appelle le 112.')}
        </Texte>
      </Carte>
      {article.passages.map((p, i) => (
        <Texte key={i}>{p}</Texte>
      ))}
      <Texte muted>{t('Source : {licence}. Texte abrégé, sans les images.', { licence: LICENCE })}</Texte>
    </Ecran>
  );
}
