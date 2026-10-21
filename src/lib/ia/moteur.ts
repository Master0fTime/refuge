import { initLlama, type LlamaContext } from 'llama.rn';
import type { Resultat } from '@/lib/recherche';
import { resumePays } from '@/lib/pays';
import { texteFiche } from '@/lib/recherche';
import { chemin, type Modele } from './modeles';

// Un seul modèle chargé à la fois : la mémoire du téléphone est précieuse.
let contexte: LlamaContext | null = null;
let charge: string | null = null;

export const modeleCharge = () => charge;

export async function charger(m: Modele, onProgres?: (p: number) => void) {
  if (charge === m.id && contexte) return;
  await liberer();
  contexte = await initLlama(
    {
      model: chemin(m),
      n_ctx: 4096,
      n_gpu_layers: 99, // accélération GPU (OpenCL) si disponible, sinon processeur
      use_mlock: false,
    },
    onProgres,
  );
  charge = m.id;
}

export async function liberer() {
  const c = contexte;
  contexte = null;
  charge = null;
  await c?.release();
}

const SYSTEME = `Tu es Refuge, un assistant de survie et d'entraide qui fonctionne sans Internet. Tu parles comme un ami calme et expérimenté (secouriste, ancien humanitaire) qui accompagne la personne dans la durée, pas comme une notice.

Comment tu réponds :
1. Comprends la situation : qui est là (seul, avec un enfant, un proche, un blessé…), où (ville, campagne, montagne…), ce qu'il y a sous la main, les dangers, depuis combien de temps. Tiens compte de TOUT ce qui a été dit dans la conversation.
2. Raisonne avant de conseiller : quelles sont les vraies priorités ici ? En général : sécurité immédiate, puis soins vitaux, puis abri et chaleur, puis eau, puis nourriture. Explique en une phrase POURQUOI.
3. Propose un plan concret adapté à SA situation, pas une liste générique : ce qu'il faut faire maintenant, dans les prochaines heures, puis ensuite. Donne plusieurs options quand c'est utile, avec leurs risques.
4. Termine par une ou deux questions précises pour mieux l'aider ensuite.
5. Sois humain : reconnais la difficulté en une phrase et rassure sans mentir.

Sources et prudence :
- Appuie-toi d'abord sur les SOURCES ci-dessous et cite-les avec leur numéro, par exemple [1] ou [2].
- Pour une question générale (hors survie), ou si les sources ne suffisent pas, tu peux utiliser tes connaissances, mais dis-le (« d'après mes connaissances générales, à vérifier »).
- Ne donne jamais de dose de médicament, de plante ou de champignon à manger, ni de geste médical qui ne figure pas dans les sources.
- Urgence vitale : commence par « Appelle le 112 si tu peux » et renvoie vers la fiche concernée.
- Si les secours sont injoignables ou ne viendront pas (guerre, catastrophe, plus de réseau), ne te contente pas de dire « appelle les secours » : utilise les consignes « Si personne ne peut venir » des sources et aide la personne à tenir dans la durée.
- Ne donne aucune aide pour blesser quelqu'un. Face à un danger, privilégie l'évitement, la discrétion et l'éloignement.

Forme : français simple, tutoiement, phrases courtes, entre 120 et 250 mots. Pas de titres ni de gras.`;

function contexteFiches(sources: Resultat[]) {
  // Environ 1 800 tokens pour les sources, pour laisser de la place à la conversation et à la réponse.
  let budget = 6000;
  return sources
    .map(({ fiche }, i) => {
      const t = `[${i + 1}] ${fiche.titre}\n${texteFiche(fiche)}`;
      const morceau = t.slice(0, Math.max(0, budget));
      budget -= morceau.length;
      return morceau;
    })
    .filter(Boolean)
    .join('\n\n');
}

export type Message = { role: 'user' | 'assistant'; content: string };

export async function repondre(
  question: string,
  sources: Resultat[],
  historique: Message[],
  onTexte: (texteCumule: string) => void,
) {
  if (!contexte) throw new Error('Aucun modèle chargé.');
  // La mémoire du téléphone limite le contexte : on garde tout ce que la personne a raconté
  // (c'est sa situation) et seulement le début des réponses précédentes.
  const situation = historique
    .filter((m) => m.role === 'user')
    .map((m) => `- ${m.content.slice(0, 300)}`)
    .join('\n');
  const recents = historique.slice(-4).map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
  let cumul = '';
  const res = await contexte.completion(
    {
      messages: [
        {
          role: 'system',
          content: `${SYSTEME}\n\n${resumePays()}\n\nSOURCES :\n${contexteFiches(sources) || '(aucune source trouvée)'}${
            situation ? `\n\nCE QUE LA PERSONNE A DÉJÀ DIT :\n${situation}` : ''
          }`,
        },
        ...recents,
        { role: 'user', content: question },
      ],
      n_predict: 600,
      temperature: 0.3,
      top_p: 0.9,
      enable_thinking: false, // Qwen3 : pas de « réflexion » à rallonge, on veut une réponse rapide
    },
    (d) => {
      // `content` = texte cumulé, nettoyé de la réflexion ; repli sur l'accumulation des tokens.
      cumul = d.content ?? cumul + d.token;
      onTexte(cumul);
    },
  );
  return res.content || res.text || cumul;
}

export async function arreter() {
  await contexte?.stopCompletion();
}
