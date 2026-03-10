import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';
import { useEffect } from 'react';

export function IntroRitual({ open, onStart }: { open: boolean; onStart: () => void }) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      onStart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onStart]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] bg-zinc-950 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(circle_at_50%_70%,rgba(50,205,50,0.07),transparent_65%)]" />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.7, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
                backgroundPosition: 'center',
              }}
            />
          </div>

          <motion.div
            className="relative w-full max-w-2xl mx-auto px-8 text-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <motion.div
              className="mx-auto mb-10 w-44 h-44 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_40px_rgba(50,205,50,0.10)]"
              initial={{ rotate: -20, scale: 0.92, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            >
              <motion.svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              >
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(50,205,50,0.12)" strokeWidth="1" strokeDasharray="2 3" />
                <path
                  d="M50 18 L62 42 L88 44 L68 60 L74 86 L50 72 L26 86 L32 60 L12 44 L38 42 Z"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="50" r="5" fill="rgba(50,205,50,0.14)" />
              </motion.svg>
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  backgroundImage:
                    'radial-gradient(circle_at_50%_50%, rgba(255,255,255,0.10), transparent 60%)',
                }}
              />
            </motion.div>

            <div className="text-white">
              <div className="text-sm font-mono tracking-[0.45em] text-white/70">{t('intro_title')}</div>
              <div className="mt-4 text-3xl font-bold tracking-tight text-white">{t('intro_subtitle')}</div>
            </div>

            <motion.div
              className="mt-10 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold tracking-wide"
                onClick={onStart}
              >
                {t('intro_start')}
              </Button>
            </motion.div>

            <motion.div
              className="mt-8 text-xs font-mono tracking-[0.28em] text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              {t('intro_hint')}
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="absolute left-0 top-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute right-0 top-1/2 h-px w-1/3 bg-gradient-to-l from-transparent via-white/10 to-transparent"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
