import { getMajorArcana } from '@/lib/tarotArcana';
import { useT } from '@/i18n';
import useLocale from '@/store/useLocale';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export function getRarityFromXP(xp: number): CardRarity {
  if (xp >= 100) return 'legendary';
  if (xp >= 60) return 'rare';
  if (xp >= 30) return 'uncommon';
  return 'common';
}

export function TarotArcanaMark({ seed, xp }: { seed: string; xp: number }) {
  const lang = useLocale((s) => s.lang);
  const t = useT();
  const arcana = getMajorArcana(seed, lang);
  const rarity = getRarityFromXP(xp);

  const palette = {
    common: {
      stroke: 'rgba(255,255,255,0.10)',
      text: 'text-white/60',
      glow: 'shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
    },
    uncommon: {
      stroke: 'rgba(255,255,255,0.12)',
      text: 'text-white/70',
      glow: 'shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_0_18px_rgba(50,205,50,0.10)]',
    },
    rare: {
      stroke: 'rgba(255,255,255,0.14)',
      text: 'text-white/80',
      glow: 'shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_26px_rgba(168,85,247,0.14)]',
    },
    legendary: {
      stroke: 'rgba(255,255,255,0.16)',
      text: 'text-white/90',
      glow: 'shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_0_34px_rgba(245,158,11,0.18)]',
    },
  } as const;

  const p = palette[rarity];

  const rarityLabel =
    rarity === 'legendary'
      ? t('rarity_legendary')
      : rarity === 'rare'
        ? t('rarity_rare')
        : rarity === 'uncommon'
          ? t('rarity_uncommon')
          : t('rarity_common');

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex items-center gap-2">
        <div
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono tracking-[0.22em] ${p.text} ${p.glow}`}
          style={{ border: `1px solid ${p.stroke}` }}
        >
          {arcana.numeral}
        </div>
        <div className={`min-w-0 truncate text-[10px] font-mono tracking-[0.18em] ${p.text}`}>
          {arcana.name}
        </div>
      </div>
      <div
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono tracking-[0.18em] ${p.text} ${p.glow}`}
        style={{ border: `1px solid ${p.stroke}` }}
      >
        {rarityLabel}
      </div>
    </div>
  );
}
