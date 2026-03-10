type TarotOrnamentKind = 'verdant' | 'lunar' | 'solar' | 'arcane' | 'circuit';
type OrnamentRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function resolveKind(seed?: string, kind?: TarotOrnamentKind): TarotOrnamentKind {
  if (kind) return kind;
  const kinds: TarotOrnamentKind[] = ['verdant', 'lunar', 'solar', 'arcane', 'circuit'];
  if (!seed) return kinds[0];
  return kinds[hashSeed(seed) % kinds.length];
}

function resolveRarityFromXP(xp?: number): OrnamentRarity {
  if (!xp) return 'common';
  if (xp >= 100) return 'legendary';
  if (xp >= 60) return 'rare';
  if (xp >= 30) return 'uncommon';
  return 'common';
}

export function TarotCardOrnament({
  seed,
  kind,
  xp,
}: {
  seed?: string;
  kind?: TarotOrnamentKind;
  xp?: number;
}) {
  const resolved = resolveKind(seed, kind);
  const rarity = resolveRarityFromXP(xp);
  const presets = {
    verdant: {
      a1: 'rgba(50,205,50,0.16)',
      a2: 'rgba(50,205,50,0.12)',
      g1: 'rgba(50,205,50,0.06)',
      g2: 'rgba(255,255,255,0.07)',
    },
    lunar: {
      a1: 'rgba(180,200,255,0.16)',
      a2: 'rgba(180,200,255,0.11)',
      g1: 'rgba(180,200,255,0.06)',
      g2: 'rgba(255,255,255,0.06)',
    },
    solar: {
      a1: 'rgba(245,158,11,0.18)',
      a2: 'rgba(245,158,11,0.12)',
      g1: 'rgba(245,158,11,0.06)',
      g2: 'rgba(255,255,255,0.06)',
    },
    arcane: {
      a1: 'rgba(168,85,247,0.18)',
      a2: 'rgba(168,85,247,0.12)',
      g1: 'rgba(168,85,247,0.06)',
      g2: 'rgba(255,255,255,0.06)',
    },
    circuit: {
      a1: 'rgba(34,211,238,0.18)',
      a2: 'rgba(34,211,238,0.12)',
      g1: 'rgba(34,211,238,0.06)',
      g2: 'rgba(255,255,255,0.06)',
    },
  } as const;

  const p = presets[resolved];
  const intensity = rarity === 'legendary' ? 1.35 : rarity === 'rare' ? 1.18 : rarity === 'uncommon' ? 1.06 : 1;
  const svgOpacity = (rarity === 'legendary' ? 0.9 : rarity === 'rare' ? 0.82 : rarity === 'uncommon' ? 0.76 : 0.7);

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        viewBox="0 0 100 150"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        style={{ opacity: svgOpacity }}
      >
        <rect x="6" y="6" width="88" height="138" rx="10" ry="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" />
        <rect
          x="10"
          y="10"
          width="80"
          height="130"
          rx="9"
          ry="9"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.6"
          strokeDasharray={resolved === 'circuit' ? '5 2' : resolved === 'arcane' ? '1 2' : resolved === 'solar' ? '3 2' : '2 2'}
        />

        {resolved === 'verdant' && (
          <path d="M50 18 C58 26, 58 38, 50 46 C42 38, 42 26, 50 18 Z" fill="none" stroke={p.a1} strokeWidth={0.8 * intensity} />
        )}
        {resolved === 'lunar' && (
          <>
            <path d="M50 18 C43 22, 40 32, 46 40 C52 48, 62 48, 66 40 C58 43, 50 38, 50 30 C50 24, 52 20, 56 18 Z" fill="none" stroke={p.a1} strokeWidth={0.8 * intensity} />
            <circle cx="64" cy="26" r="1.6" fill={p.a2} />
            <circle cx="60" cy="22" r="0.9" fill={p.a2} />
          </>
        )}
        {resolved === 'solar' && (
          <>
            <circle cx="50" cy="32" r="5.2" fill="none" stroke={p.a1} strokeWidth={0.8 * intensity} />
            <path d="M50 20 L50 24" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M50 40 L50 44" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M38 32 L42 32" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M58 32 L62 32" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M42 24 L45 27" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M55 37 L58 40" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M58 24 L55 27" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
            <path d="M45 37 L42 40" stroke={p.a2} strokeWidth="1" strokeLinecap="round" />
          </>
        )}
        {resolved === 'arcane' && (
          <>
            <path d="M50 18 L63 42 L37 42 Z" fill="none" stroke={p.a1} strokeWidth={0.8 * intensity} />
            <circle cx="50" cy="33" r="2.2" fill="none" stroke={p.a2} strokeWidth={0.8 * intensity} />
            <path d="M50 18 L50 42" stroke={p.a2} strokeWidth="0.6" />
          </>
        )}
        {resolved === 'circuit' && (
          <>
            <path d="M18 26 H34 V34 H46" fill="none" stroke={p.a1} strokeWidth={0.8 * intensity} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M82 26 H66 V34 H54" fill="none" stroke={p.a1} strokeWidth={0.8 * intensity} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="26" r="1.6" fill={p.a2} />
            <circle cx="82" cy="26" r="1.6" fill={p.a2} />
            <circle cx="34" cy="34" r="1.4" fill={p.a2} />
            <circle cx="66" cy="34" r="1.4" fill={p.a2} />
          </>
        )}
        <circle cx="50" cy="32" r="2.2" fill="rgba(255,255,255,0.16)" />

        {resolved === 'verdant' && (
          <>
            <path d="M50 104 C62 116, 62 132, 50 144 C38 132, 38 116, 50 104 Z" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
            <circle cx="50" cy="128" r="2.2" fill={p.a2} />
          </>
        )}
        {resolved === 'lunar' && (
          <>
            <path d="M38 128 C42 116, 58 116, 62 128 C58 140, 42 140, 38 128 Z" fill="none" stroke={p.a1} strokeWidth="0.8" />
            <path d="M50 118 L50 138" stroke={p.a2} strokeWidth="0.6" />
          </>
        )}
        {resolved === 'solar' && (
          <>
            <path d="M50 110 L56 122 L70 124 L60 134 L62 148 L50 141 L38 148 L40 134 L30 124 L44 122 Z" fill="none" stroke={p.a1} strokeWidth="0.8" />
          </>
        )}
        {resolved === 'arcane' && (
          <>
            <path d="M37 112 H63" stroke={p.a2} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M40 118 H60" stroke={p.a1} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M43 124 H57" stroke={p.a2} strokeWidth="0.8" strokeLinecap="round" />
            <circle cx="50" cy="132" r="4.2" fill="none" stroke={p.a1} strokeWidth="0.8" />
          </>
        )}
        {resolved === 'circuit' && (
          <>
            <path d="M18 124 H34 V116 H46" fill="none" stroke={p.a1} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M82 124 H66 V116 H54" fill="none" stroke={p.a1} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="124" r="1.6" fill={p.a2} />
            <circle cx="82" cy="124" r="1.6" fill={p.a2} />
            <circle cx="34" cy="116" r="1.4" fill={p.a2} />
            <circle cx="66" cy="116" r="1.4" fill={p.a2} />
          </>
        )}

        <path d="M18 22 L32 22" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeLinecap="round" />
        <path d="M68 22 L82 22" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeLinecap="round" />
        <path d="M18 128 L32 128" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeLinecap="round" />
        <path d="M68 128 L82 128" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeLinecap="round" />

        <path d="M22 34 C30 30, 38 30, 46 34" fill="none" stroke={p.a2} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M54 34 C62 30, 70 30, 78 34" fill="none" stroke={p.a2} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M22 116 C30 120, 38 120, 46 116" fill="none" stroke={p.a2} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M54 116 C62 120, 70 120, 78 116" fill="none" stroke={p.a2} strokeWidth="0.8" strokeLinecap="round" />

        <circle cx="18" cy="18" r="1.6" fill="rgba(255,255,255,0.18)" />
        <circle cx="82" cy="18" r="1.6" fill="rgba(255,255,255,0.18)" />
        <circle cx="18" cy="132" r="1.6" fill="rgba(255,255,255,0.18)" />
        <circle cx="82" cy="132" r="1.6" fill="rgba(255,255,255,0.18)" />
      </svg>

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle_at_50%_35%,${p.g2},transparent_55%),radial-gradient(circle_at_50%_75%,${p.g1},transparent_60%)`,
          opacity: rarity === 'legendary' ? 0.85 : rarity === 'rare' ? 0.75 : rarity === 'uncommon' ? 0.65 : 0.55,
        }}
      />
    </div>
  );
}
