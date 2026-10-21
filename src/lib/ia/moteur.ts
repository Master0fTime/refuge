import { initLlama, type LlamaContext } from 'llama.rn';
import type { Resultat } from '@/lib/recherche';
import { resumePays } from '@/lib/pays';
import { texteFiche } from '@/lib/recherche';
import { chemin, type Modele } from './modeles';

// Un seul modèle chargé à la fois : la mémoire du téléphone est précieuse.
let contexte: LlamaContext | null = null;
let charge: string | null = null;

export const modeleCharge = () => charge;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function charger(m: Modele, onProgres?: (p: number) => void) {
  if (charge === m.id && contexte) return;
  await liberer();
  // Processeur uniquement : l'accélération GPU (OpenCL) plante ou met plusieurs minutes à démarrer
  // sur une partie des téléphones Android. Si la mémoire manque, on réessaie avec un contexte plus court.
  const essais = [4096, 2048];
  let derniere: unknown;
  for (const n_ctx of essais) {
    try {
      contexte = await initLlama(
        { model: chemin(m), n_ctx, n_gpu_layers: 0, no_gpu_devices: true, use_mmap: true, use_mlock: false },
        onProgres,
      );
      charge = m.id;
      return;
    } catch (e) {
      derniere = e;
      await liberer();
    }
  }
  throw new Error(`Chargement du modèle impossible : ${message(derniere)}`);
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

Si la personne dit qu'elle panique ou qu'elle a peur :
- Paniquer ne veut pas dire être incapable d'agir. Commence par UNE phrase courte qui reconnaît ce qu'elle vit (« C'est normal d'avoir peur, je suis là »). Ne dis jamais « calme-toi ».
- Puis cherche à comprendre, avec une ou deux questions simples : y a-t-il un danger immédiat autour d'elle ? Quelqu'un est-il blessé ? Est-ce plutôt une crise d'angoisse (cœur qui s'emballe, souffle court) ?
- S'il y a un danger, donne d'abord deux ou trois gestes de mise à l'abri, très courts. S'il s'agit d'une crise d'angoisse, propose une respiration lente (inspirer 4 secondes, souffler 6 secondes).
- Une seule action à la fois, des phrases très courtes, et laisse-lui le choix (« Tu peux… »).

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
  const systeme = `${SYSTEME}\n\n${resumePays()}\n\nSOURCES :\n${contexteFiches(sources) || '(aucune source trouvée)'}${
    situation ? `\n\nCE QUE LA PERSONNE A DÉJÀ DIT :\n${situation}` : ''
  }`;
  // Qwen3 peut « réfléchir à voix haute » entre balises <think> : on ne montre que la réponse.
  const nettoyer = (t: string) => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trimStart();

  const generer = async (jinja: boolean) => {
    let cumul = '';
    const res = await contexte!.completion(
      {
        messages: [
          { role: 'system', content: systeme },
          ...recents,
          // Sans modèle de dialogue Jinja, « /no_think » coupe la réflexion de Qwen3.
          { role: 'user', content: jinja ? question : `${question} /no_think` },
        ],
        n_predict: 600,
        temperature: 0.3,
        top_p: 0.9,
        jinja,
        ...(jinja ? { enable_thinking: false } : {}),
      },
      (d) => {
        // `content` = texte cumulé, nettoyé de la réflexion ; repli sur l'accumulation des tokens.
        cumul = jinja && d.content !== undefined ? d.content : cumul + d.token;
        onTexte(nettoyer(cumul));
      },
    );
    return nettoyer(res.content || res.text || cumul);
  };

  try {
    return await generer(true);
  } catch (e) {
    // Certains modèles ou versions plantent avec le modèle de dialogue Jinja : on retente sans.
    try {
      return await generer(false);
    } catch (e2) {
      throw new Error(`Génération impossible : ${message(e2)} (premier essai : ${message(e)})`);
    }
  }
}

export async function arreter() {
  await contexte?.stopCompletion();
}
