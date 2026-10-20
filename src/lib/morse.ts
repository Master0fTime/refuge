const CODE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

export const enMorse = (txt: string) =>
  txt
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .map((mot) => [...mot].map((l) => CODE[l]).filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' / ');

/**
 * Séquence d'allumages : [allumé, durée en unités].
 * Point = 1, trait = 3, entre signes = 1, entre lettres = 3, entre mots = 7.
 */
export function sequence(txt: string): [boolean, number][] {
  const seq: [boolean, number][] = [];
  const mots = enMorse(txt).split(' / ');
  mots.forEach((mot) => {
    mot.split(' ').forEach((lettre, iL) => {
      [...lettre].forEach((sig, iS) => {
        seq.push([true, sig === '.' ? 1 : 3]);
        if (iS < lettre.length - 1) seq.push([false, 1]);
      });
      if (iL < mot.split(' ').length - 1) seq.push([false, 3]);
    });
    // Pause de mot, aussi en fin de message pour séparer les répétitions en boucle.
    seq.push([false, 7]);
  });
  return seq;
}
