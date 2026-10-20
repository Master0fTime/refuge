import { initLlama, type LlamaContext } from 'llama.rn';
import type { Resultat } from '@/lib/recherche';
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

const SYSTEME = `Tu es l'assistant de survie de l'application Refuge. Tu fonctionnes hors ligne.
Règles STRICTES :
- Réponds UNIQUEMENT à partir des FICHES fournies ci-dessous. N'invente jamais de technique, de dose ni de plante.
- Cite tes sources avec leur numéro entre crochets, par exemple [1] ou [2].
- Si les fiches ne contiennent pas la réponse, dis-le clairement, puis donne seulement des conseils de prudence générale.
- Urgence vitale (saignement important, personne qui ne respire pas, inconsciente, qui s'étouffe) : commence par « Appelle le 112 » et renvoie vers la fiche concernée.
- Réponds en français simple, avec des phrases courtes et des étapes numérotées. Au maximum 150 mots, sauf si on te demande plus de détails.
- Tutoie l'utilisateur. Sois calme et rassurant.`;

function contexteFiches(sources: Resultat[]) {
  // Environ 2 500 tokens au maximum pour les fiches, afin de laisser de la place à la question et à la réponse.
  let budget = 9000;
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
  let cumul = '';
  const res = await contexte.completion(
    {
      messages: [
        { role: 'system', content: `${SYSTEME}\n\nFICHES :\n${contexteFiches(sources) || '(aucune fiche trouvée)'}` },
        ...historique.slice(-4),
        { role: 'user', content: question },
      ],
      n_predict: 450,
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
