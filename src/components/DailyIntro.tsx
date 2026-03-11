import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore, { Task } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';

function dayDiff(start?: string | null) {
  if (!start) return 1;
  const s = new Date(start);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((now.getTime() - s.getTime()) / msPerDay) + 1;
  return Math.max(1, diff);
}


export function DailyIntro({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { startDate } = useStore();
  const tasks = useStore((s) => s.tasks);
  const t = useT();
  const day = useMemo(() => dayDiff(startDate), [startDate]);
  const isFirst = day === 1;
  const tt = t as unknown as (k: string) => string;
  const phrase = useMemo(() => tt(`daily_phrase_${((day - 1) % 7) + 1}`), [day, tt]);
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[220] bg-zinc-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseMove={(e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMx(x);
            setMy(y);
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: hover ? 0.4 : 0.25 }}
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(circle at 50% 70%, rgba(50,205,50,0.07), transparent 65%)',
            }}
          />
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: hover ? 0.35 : 0.2 }}
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative z-10 w-full max-w-3xl mx-auto text-white border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl shadow-[0_30px_120px_rgba(255,255,255,0.08)] p-10"
              style={{ transformStyle: 'preserve-3d' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, rotateX: my * -4, rotateY: mx * 6 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-sm text-zinc-400 font-mono">{t('daily_intro_subtitle')}</div>
                <motion.div
                  className="text-xs text-zinc-500 font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('daily_enter_hint')}
                </motion.div>
              </div>
              <motion.h1
                className="mt-2 text-4xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 140, damping: 20 }}
              >
                第 {day} 天的开场
              </motion.h1>
              <motion.p
                className="mt-3 text-zinc-300 text-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 140, damping: 20 }}
              >
                {phrase}
              </motion.p>

              {isFirst ? (
                <div className="mt-6 space-y-3 text-zinc-300 leading-relaxed">
                  <p>{t('daily_first_1')}</p>
                  <p>{t('daily_first_2')}</p>
                  <p>{t('daily_first_3')}</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3 text-zinc-300 leading-relaxed">
                  <p>{t('daily_nonfirst_1').replace('{DAY}', String(day))}</p>
                  <p>{t('daily_nonfirst_2')}</p>
                </div>
              )}

              <MilestoneBlock day={day} t={t} />
              <MetricsBlock tasks={tasks} t={t} />

              <div className="mt-8 flex justify-end">
                <Button variant="secondary" onClick={onClose} className="px-4">进入今天</Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MilestoneBlock({ day, t }: { day: number; t: ReturnType<typeof useT> }) {
  const msg =
    day === 7 ? t('milestone_7') :
      day === 14 ? t('milestone_14') :
        day === 21 ? t('milestone_21') :
          null;
  if (!msg) return null;
  return (
    <div className="mt-5 p-3 rounded-xl border border-white/10 bg-white/5 text-zinc-200">
      {msg}
    </div>
  );
}

function MetricsBlock({ tasks, t }: { tasks: Task[]; t: ReturnType<typeof useT> }) {
  const today = new Date().toLocaleDateString('sv');
  const dayKey = (d: Date) => d.toLocaleDateString('sv');
  const y1 = new Date(); y1.setDate(y1.getDate() - 1);
  const y2 = new Date(); y2.setDate(y2.getDate() - 2);
  const k0 = today, k1 = dayKey(y1), k2 = dayKey(y2);
  const map: Record<string, { xp: number; zen: number }> = {};
  for (const tsk of tasks) {
    if (!tsk.completed) continue;
    const k = new Date(tsk.date).toLocaleDateString('sv');
    const xp = tsk.isZen ? 100 : tsk.duration;
    const zen = tsk.isZen ? 1 : 0;
    if (!map[k]) map[k] = { xp: 0, zen: 0 };
    map[k].xp += xp;
    map[k].zen += zen;
  }
  const xp0 = map[k0]?.xp ?? 0;
  const xp1 = map[k1]?.xp ?? 0;
  const xp2 = map[k2]?.xp ?? 0;
  const sum3 = xp0 + xp1 + xp2;
  const zen3 = (map[k0]?.zen ?? 0) + (map[k1]?.zen ?? 0) + (map[k2]?.zen ?? 0);
  const delta = xp0 - xp1;
  return (
    <div className="mt-5 p-3 rounded-xl border border-white/10 bg-white/5 text-zinc-200">
      <div className="text-xs font-mono text-zinc-400">{t('metrics_title')}</div>
      <div className="mt-2 text-sm">
        <div>{t('metrics_line_xp').replace('{SUM}', String(sum3)).replace('{DELTA}', (delta >= 0 ? '+' : '') + String(delta))}</div>
        <div className="mt-1">{t('metrics_line_zen').replace('{ZEN}', String(zen3))}</div>
      </div>
    </div>
  );
}
