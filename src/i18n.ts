import useLocale from '@/store/useLocale';
import { useCallback } from 'react';

const dict = {
  zh: {
    badge: '徽章',
    play: '放纵',
    cast_placeholder: '铸造一张新卡…',
    confirm_deviation: '确认要偏离路线吗？',
    friction_desc: '为了让你能心安理得地享受片刻的轻松，请手动输入以下句子，完成最后的仪式：',
    friction_sentence: '我深知此刻的放纵会拖延我成为大师的脚步，但我依然选择用时间换取短暂的快乐。',
    confirm_and_start: '确认并开始放纵',
    zen_title: '🧘 15分钟放空',
    give_up: '放弃',
    level_up: '等级提升',
    save_badge: '保存专属徽章',
    challenge_title: 'Master Path / 21-Day Challenge',
    challenge_desc: '历经 21 天的刻意练习，这是专注赋予你的印记。',
    mins: '分钟',
    plus_xp: '经验',
    rarity_common: '常见',
    rarity_uncommon: '稀有',
    rarity_rare: '史诗',
    rarity_legendary: '传说',
    en_label: 'EN',
    zh_label: '中文',
    intro_title: 'MASTER PATH',
    intro_subtitle: '21 天刻意练习 · 以卡为誓',
    intro_start: '开始这 21 天的旅程',
    intro_hint: '按 Enter 开始',
  },
  en: {
    badge: 'Badge',
    play: 'Play',
    cast_placeholder: 'Cast a new card…',
    confirm_deviation: 'Confirm to deviate?',
    friction_desc: 'To enjoy a moment of ease, type the sentence to complete the ritual:',
    friction_sentence: 'I know this indulgence slows my path to mastery, yet I trade time for fleeting pleasure.',
    confirm_and_start: 'Confirm and indulge',
    zen_title: '🧘 15-min Zen',
    give_up: 'Give up',
    level_up: 'LEVEL UP',
    save_badge: 'Save Badge',
    challenge_title: 'Master Path / 21-Day Challenge',
    challenge_desc: 'After 21 days of deliberate practice, this is the mark granted by focus.',
    mins: 'mins',
    plus_xp: 'XP',
    rarity_common: 'COMMON',
    rarity_uncommon: 'UNCOMMON',
    rarity_rare: 'RARE',
    rarity_legendary: 'LEGENDARY',
    en_label: 'EN',
    zh_label: '中文',
    intro_title: 'MASTER PATH',
    intro_subtitle: '21 Days of Deliberate Practice · Seal the Oath',
    intro_start: 'Begin the 21-day journey',
    intro_hint: 'Press Enter to begin',
  }
};

export function useT() {
  const lang = useLocale((s) => s.lang);
  return useCallback((k: keyof typeof dict['zh']) => dict[lang][k] ?? k, [lang]);
}
