import { useState, useEffect, useRef, useCallback } from 'react';
import useStore, { Task } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';
import useLocale from '@/store/useLocale';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { TarotCardOrnament } from '@/components/TarotCardOrnament';
import { TarotArcanaMark, getRarityFromXP } from '@/components/TarotArcanaMark';

function ZenTimer({ onComplete }: { onComplete: () => void }) {
  const [time, setTime] = useState(15 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onComplete]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return <div className="text-9xl font-mono font-bold text-white">{formatTime(time)}</div>;
}

export function TarotDeck({ onTaskComplete, pendingTaskIds = new Set() }: { onTaskComplete: (task: Task) => void, pendingTaskIds?: Set<string> }) {
  const tasks = useStore(state => state.tasks);
  const lastZenDate = useStore((state) => state.stats.lastZenDate);
  const [uncompletedTasks, setUncompletedTasks] = useState<Task[]>([]);
  const [isZenMode, setIsZenMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const centeredTaskIdRef = useRef<string | null>(null);
  const t = useT();
  const lang = useLocale(s => s.lang);

  useEffect(() => {
    const activeTasks = tasks.filter(t => !t.completed && !pendingTaskIds.has(t.id));
    const zenCardExists = activeTasks.some(t => t.isZen);
    const today = new Date().toLocaleDateString('sv');
    const shouldShowZen = lastZenDate !== today;

    let nextTasks: Task[];
    if (!zenCardExists && shouldShowZen) {
      const zenCard = { id: 'zen-card', title: t('zen_title'), completed: false, date: new Date().toISOString(), duration: 15, isZen: true };
      if (!pendingTaskIds.has(zenCard.id)) {
        nextTasks = [zenCard, ...activeTasks];
      } else {
        nextTasks = activeTasks;
      }
    } else {
      nextTasks = activeTasks;
    }
    setUncompletedTasks(nextTasks);
    const centeredId = centeredTaskIdRef.current;
    if (centeredId) {
      const idx = nextTasks.findIndex((t) => t.id === centeredId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        return;
      }
    }
    if (nextTasks.length > 0) {
      setCurrentIndex((i) => Math.min(i, nextTasks.length - 1));
    } else {
      setCurrentIndex(0);
    }
  }, [tasks, lang, pendingTaskIds, lastZenDate, t]);

  useEffect(() => {
    centeredTaskIdRef.current = uncompletedTasks[currentIndex]?.id ?? null;
  }, [currentIndex, uncompletedTasks]);

  useEffect(() => {
    if (uncompletedTasks.length === 0) {
      if (currentIndex !== 0) setCurrentIndex(0);
      return;
    }
    if (currentIndex > uncompletedTasks.length - 1) {
      setCurrentIndex(uncompletedTasks.length - 1);
    }
  }, [currentIndex, uncompletedTasks.length]);

  const shift = useCallback((delta: number) => {
    if (uncompletedTasks.length === 0) return;
    setCurrentIndex((i) => {
      const next = (i + delta) % uncompletedTasks.length;
      return next < 0 ? next + uncompletedTasks.length : next;
    });
  }, [uncompletedTasks.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isZenMode) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        shift(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        shift(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isZenMode, shift]);

  const handleZenComplete = () => {
    const zenTask = uncompletedTasks.find(t => t.isZen);
    if (zenTask) {
      onTaskComplete(zenTask);
    }
    setIsZenMode(false);
  };

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative w-full max-w-6xl h-[520px] mx-auto"
          style={{ perspective: 1200 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <AnimatePresence>
              {uncompletedTasks.map((task, idx) => {
                const step = 22;
                const angle = (idx - currentIndex) * step;
                const radius = 420;
                // Mild depth cues based on angle
                const rad = (angle % 360) * Math.PI / 180;
                const frontFactor = (Math.cos(rad) + 1) / 2; // 0..1
                const opacity = 0.6 + 0.4 * frontFactor;
                const gainedXP = task.isZen ? 100 : task.duration;
                const rarity = getRarityFromXP(gainedXP);
                const rarityClass =
                  rarity === 'legendary'
                    ? 'border-amber-400/25 shadow-[0_0_0_1px_rgba(245,158,11,0.12),0_0_32px_rgba(245,158,11,0.12)]'
                    : rarity === 'rare'
                      ? 'border-purple-400/20 shadow-[0_0_0_1px_rgba(168,85,247,0.10),0_0_28px_rgba(168,85,247,0.10)]'
                      : rarity === 'uncommon'
                        ? 'border-emerald-400/18 shadow-[0_0_0_1px_rgba(50,205,50,0.08),0_0_22px_rgba(50,205,50,0.08)]'
                        : 'border-white/10';
                return (
                  <div
                    key={task.id}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'translate(-50%, -50%)',
                      zIndex: Math.round(frontFactor * 1000),
                    }}
                  >
                    <motion.div
                      className={`w-64 h-96 bg-black/40 border backdrop-blur-md rounded-2xl text-white shadow-2xl relative overflow-hidden ${rarityClass}`}
                      animate={{
                        transform: `rotateY(${angle}deg) translateZ(${radius}px) rotateY(${-angle}deg)`,
                        opacity,
                      }}
                      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                      whileHover={{ rotateX: -4, rotateY: 4, y: -8, boxShadow: '0 20px 60px rgba(255,255,255,0.12)' }}
                      onClick={() => {
                        if (task.isZen) setIsZenMode(true);
                      }}
                    >
                      <TarotCardOrnament seed={task.id} kind={task.isZen ? 'lunar' : undefined} xp={gainedXP} />
                      <div className="relative z-10 w-full h-full p-6 flex flex-col">
                        <div className="space-y-3">
                          <TarotArcanaMark seed={task.id} xp={gainedXP} />
                          <div className="flex justify-between items-center text-zinc-300 font-mono text-sm">
                            <span>{task.duration} {t('mins').toUpperCase()}</span>
                            <span>+{gainedXP} {t('plus_xp').toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center py-6">
                          <h2 className="text-2xl font-bold text-center text-white px-2">{task.title}</h2>
                        </div>
                        {task.isZen ? <div /> : (
                          <div className="flex justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white"
                              aria-label={`complete:${task.id}`}
                              onClick={(e) => { e.stopPropagation(); onTaskComplete(task); }}
                            >
                              <Check className="w-5 h-5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="pointer-events-auto w-11 h-11 rounded-full bg-black/30 border border-white/10 text-white hover:bg-black/45"
              aria-label="prev-card"
              onClick={() => shift(-1)}
              disabled={uncompletedTasks.length <= 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="pointer-events-auto w-11 h-11 rounded-full bg-black/30 border border-white/10 text-white hover:bg-black/45"
              aria-label="next-card"
              onClick={() => shift(1)}
              disabled={uncompletedTasks.length <= 1}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isZenMode && (
          <motion.div
            className="fixed inset-0 bg-zinc-950/95 backdrop-blur-3xl flex flex-col items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ZenTimer onComplete={handleZenComplete} />
            <Button variant="ghost" onClick={() => setIsZenMode(false)} className="absolute bottom-8 text-zinc-500 hover:text-white transition-opacity">
              {t('give_up')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
