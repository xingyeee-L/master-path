function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const roman = [
  '0',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
  'XXI',
];

const names = [
  { zh: '愚者', en: 'The Fool' },
  { zh: '魔术师', en: 'The Magician' },
  { zh: '女祭司', en: 'The High Priestess' },
  { zh: '皇后', en: 'The Empress' },
  { zh: '皇帝', en: 'The Emperor' },
  { zh: '教皇', en: 'The Hierophant' },
  { zh: '恋人', en: 'The Lovers' },
  { zh: '战车', en: 'The Chariot' },
  { zh: '力量', en: 'Strength' },
  { zh: '隐者', en: 'The Hermit' },
  { zh: '命运之轮', en: 'Wheel of Fortune' },
  { zh: '正义', en: 'Justice' },
  { zh: '倒吊人', en: 'The Hanged Man' },
  { zh: '死神', en: 'Death' },
  { zh: '节制', en: 'Temperance' },
  { zh: '恶魔', en: 'The Devil' },
  { zh: '高塔', en: 'The Tower' },
  { zh: '星星', en: 'The Star' },
  { zh: '月亮', en: 'The Moon' },
  { zh: '太阳', en: 'The Sun' },
  { zh: '审判', en: 'Judgement' },
  { zh: '世界', en: 'The World' },
];

export type LanguageCode = 'zh' | 'en';

export function getMajorArcana(seed: string, lang: LanguageCode) {
  const index = hashSeed(seed) % names.length;
  const name = names[index][lang];
  const numeral = roman[index];
  return { index, numeral, name };
}

