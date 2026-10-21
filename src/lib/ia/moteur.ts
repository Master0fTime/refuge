import { initLlama, type LlamaContext } from 'llama.rn';
import { consigneLangue } from '@/lib/langue';
import { resumePaysCourt } from '@/lib/pays';
import { termes, texteFiche, type Resultat } from '@/lib/recherche';
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

// Consignes volontairement COURTES : sur un téléphone sans accélération graphique, le modèle lit
// environ 20 à 60 mots par seconde. Chaque phrase de consigne retarde donc la réponse.
const SYSTEME = `Tu es Refuge, un assistant de survie qui fonctionne sans Internet. Tu parles comme un secouriste calme qui accompagne la personne.
Règles :
- Comprends sa situation (qui, où, ce qu'elle a, les dangers) et tiens compte de toute la conversation.
- Priorités : sécurité, soins vitaux, abri et chaleur, eau, nourriture. Dis pourquoi en une phrase.
- Donne un plan concret pour SA situation : maintenant, puis dans les heures qui suivent. Termine par une question utile.
- Appuie-toi sur la fiche la plus pertinente et donne SES gestes, dans l'ordre. Cite-la : [1]. Ignore les fiches hors sujet. Hors survie, tu peux utiliser tes connaissances en le signalant.
- Jamais de dose de médicament, ni de plante ou de champignon à manger, s'ils ne sont pas dans les fiches.
- Urgence vitale : « Appelle le 112 si tu peux », puis les gestes. Si les secours ne viendront pas, utilise « Si personne ne peut venir ».
- Si elle panique : une phrase qui reconnaît sa peur (jamais « calme-toi »), puis demande : danger immédiat ? blessé ? crise d'angoisse ? Une action à la fois.
- Santé : commence par « Je ne suis pas médecin, mais voici ce qui peut aider : ». Reste factuel et calme, sans détail choquant.
- Un mot mal écrit ou mal dicté : devine le sens le plus probable (« ascendie » = incendie) sans le répéter.
- Aucune aide pour blesser quelqu'un.
Style : phrases courtes, tutoiement, 80 à 180 mots, pas de titres.`;

/** Garde, dans chaque fiche, les lignes qui parlent de la question : moins à lire, réponse plus rapide. */
function extraitFiche(texte: string, mots: string[], max: number) {
  const norm = (t: string) =>
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  const lignes = texte.split('\n');
  const pertinentes = lignes.slice(1).filter((l) => mots.some((m) => norm(l).includes(m)));
  const choisies = [lignes[0], ...(pertinentes.length ? pertinentes : lignes.slice(1, 4))];
  return choisies.join('\n').slice(0, max);
}

function contexteFiches(sources: Resultat[], question: string) {
  const mots = termes(question);
  return sources
    .slice(0, 3)
    .map(({ fiche }, i) => `[${i + 1}] ${fiche.titre}\n${extraitFiche(texteFiche(fiche), mots, 700)}`)
    .join('\n\n');
}

export type Message = { role: 'user' | 'assistant'; content: string };

/** Étapes visibles pour l'utilisateur : la lecture du contexte peut prendre plusieurs secondes. */
export type Phase = 'lecture' | 'ecriture';

export async function repondre(
  question: string,
  sources: Resultat[],
  historique: Message[],
  onTexte: (texteCumule: string) => void,
  onPhase?: (p: Phase) => void,
) {
  if (!contexte) throw new Error('Aucun modèle chargé.');
  // Le début des consignes ne change pas d'une question à l'autre : le modèle le garde en mémoire
  // (cache) et n'a à relire que la partie qui change (fiches, situation, question).
  const systeme = `${SYSTEME}\n${consigneLangue()}\n${resumePaysCourt()}`;
  const situation = historique
    .filter((m) => m.role === 'user')
    .slice(-5)
    .map((m) => `- ${m.content.slice(0, 200)}`)
    .join('\n');
  const derniereReponse = [...historique].reverse().find((m) => m.role === 'assistant')?.content.slice(0, 400);
  const demande = [
    `FICHES :\n${contexteFiches(sources, question) || '(aucune fiche trouvée)'}`,
    situation && `CE QUE J'AI DÉJÀ DIT :\n${situation}`,
    derniereReponse && `TA RÉPONSE PRÉCÉDENTE (début) : ${derniereReponse}`,
    `MA QUESTION : ${question}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  // Qwen3 peut « réfléchir à voix haute » entre balises <think> : on ne montre que la réponse.
  const nettoyer = (t: string) => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trimStart();

  const generer = async (jinja: boolean) => {
    let cumul = '';
    let ecrit = false;
    onPhase?.('lecture');
    const res = await contexte!.completion(
      {
        messages: [
          { role: 'system', content: systeme },
          // Sans modèle de dialogue Jinja, « /no_think » coupe la réflexion de Qwen3.
          { role: 'user', content: jinja ? demande : `${demande} /no_think` },
        ],
        n_predict: 400,
        temperature: 0.3,
        top_p: 0.9,
        jinja,
        ...(jinja ? { enable_thinking: false } : {}),
      },
      (d) => {
        if (!ecrit) {
          ecrit = true;
          onPhase?.('ecriture');
        }
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

/** Diagnostic : temps de chargement, délai avant le premier mot, vitesse d'écriture. */
export async function tester(m: Modele) {
  const t0 = Date.now();
  await charger(m);
  const chargementMs = Date.now() - t0;
  const t1 = Date.now();
  let premierMs: number | null = null;
  let mots = 0;
  const res = await contexte!.completion(
    {
      messages: [{ role: 'user', content: 'Dis bonjour en une phrase courte.' }],
      n_predict: 40,
      temperature: 0.3,
      enable_thinking: false,
    },
    () => {
      if (premierMs === null) premierMs = Date.now() - t1;
      mots += 1;
    },
  );
  const totalMs = Date.now() - t1;
  const ecritureMs = Math.max(1, totalMs - (premierMs ?? 0));
  return {
    chargementMs,
    premierMs: premierMs ?? totalMs,
    motsParSeconde: Math.round((mots / ecritureMs) * 10000) / 10,
    texte: (res.content || res.text || '').replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim(),
  };
}

export async function arreter() {
  await contexte?.stopCompletion();
}
