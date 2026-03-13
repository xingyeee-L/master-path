import React, { useState, useEffect } from 'react';
import useStore, { Task, useLevel } from '@/store/useStore';
import { DigitalGridBackground } from '@/components/DigitalGridBackground';
import { Hud } from '@/components/Hud';
import { TarotDeck } from '@/components/TarotDeck';
import { TaskInput } from '@/components/TaskInput';
import { Button } from '@/components/ui/button';
import { Award, Sliders } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BadgeScreen } from '@/components/BadgeScreen';
import { XPFeedback } from '@/components/XPFeedback';
import { LevelUpScreen } from '@/components/LevelUpScreen';
import { AchievementToast } from '@/components/AchievementToast';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useT } from '@/i18n';
import useLocale from '@/store/useLocale';
import { IntroRitual } from '@/components/IntroRitual';
import { DailyIntro } from '@/components/DailyIntro';
import { FocusTimerOverlay, type FocusCompletePayload } from '@/components/FocusTimerOverlay';

interface FloatingXP {
  id: string;
  xp: number;
}

function App() {
  const [showBadge, setShowBadge] = useState(false);
  const [showFriction, setShowFriction] = useState(false);
  const [frictionInput, setFrictionInput] = useState("");
  const [floatingXPs, setFloatingXPs] = useState<FloatingXP[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [showDailyIntro, setShowDailyIntro] = useState(false);

  const completeTaskWithXp = useStore((state) => state.completeTaskWithXp);
  const startFocus = useStore((state) => state.startFocus);
  const commitFocusSession = useStore((state) => state.commitFocusSession);
  const activeFocus = useStore((state) => state.activeFocus);
  const hasStarted = useStore((state) => state.hasStarted);
  const startChallenge = useStore((state) => state.startChallenge);
  const { level, levelName } = useLevel();
  const prevLevel = usePrevious(level);
  const t = useT();
  const lang = useLocale(s => s.lang);
  const setLang = useLocale(s => s.setLang);

  useEffect(() => {
    if (prevLevel === undefined || level <= prevLevel) return;
    setShowLevelUp(true);
    const timeoutId = window.setTimeout(() => setShowLevelUp(false), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [level, prevLevel]);

  useEffect(() => {
    if (!hasStarted) return;
    const today = new Date().toLocaleDateString('sv');
    const shown = useStore.getState().stats.lastIntroDate;
    if (shown !== today) {
      setShowDailyIntro(true);
    }
  }, [hasStarted]);

  const handleCloseDailyIntro = () => {
    setShowDailyIntro(false);
    useStore.getState().markDailyIntroShown();
  };

  const handleTaskComplete = (task: Task) => {
    const gainedXP = task.isZen ? 100 : task.duration;
    // 1. Mark as pending (so TarotDeck hides it)
    setPendingTaskIds(prev => {
      const next = new Set(prev);
      next.add(task.id);
      return next;
    });

    // 2. Trigger Flying XP
    const newXP: FloatingXP = { id: uuidv4(), xp: gainedXP };
    setFloatingXPs(prev => [...prev, newXP]);

    // 3. Wait and then commit to store
    setTimeout(() => {
      completeTaskWithXp(task.id, gainedXP);
      setPendingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      // Remove flying XP
      setFloatingXPs(prev => prev.filter(xp => xp.id !== newXP.id));
    }, 800);
  };

  const handleStartFocus = (task: Task) => {
    const presetSeconds = Math.max(1, task.duration * 60);
    const baseXp = task.isZen ? 100 : task.duration;
    startFocus({ taskId: task.id, title: task.title, isZen: task.isZen, presetSeconds, baseXp });
  };

  const handleFocusComplete = (payload: FocusCompletePayload) => {
    setPendingTaskIds(prev => {
      const next = new Set(prev);
      next.add(payload.taskId);
      return next;
    });

    const newXP: FloatingXP = { id: uuidv4(), xp: payload.gainedXp };
    setFloatingXPs(prev => [...prev, newXP]);

    setTimeout(() => {
      completeTaskWithXp(payload.taskId, payload.gainedXp, payload.endedAt);
      commitFocusSession({
        taskId: payload.taskId,
        title: payload.title,
        isZen: payload.isZen,
        presetSeconds: payload.presetSeconds,
        baseXp: payload.baseXp,
        focusedSeconds: payload.focusedSeconds,
        interruptions: payload.interruptions,
        gainedXp: payload.gainedXp,
        startedAt: payload.startedAt,
        endedAt: payload.endedAt,
      });

      setPendingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(payload.taskId);
        return next;
      });
      setFloatingXPs(prev => prev.filter(xp => xp.id !== newXP.id));
    }, 800);
  };

  const handlePlayClick = () => {
    if (frictionInput === t('friction_sentence')) {
      setShowFriction(false);
      setFrictionInput("");
      // Logic for "Reined in at the Precipice" achievement
      // If user closes it without confirming... wait, the achievement says "Close temptation dialog BEFORE timer ends" or "Resisted".
      // The store has `incrementResistedTemptation`.
      // But here user CONFIRMED deviation. So NO achievement.
    } else {
      alert(t('confirm_and_start'));
    }
  };

  const handleFrictionClose = (open: boolean) => {
    if (!open) {
      // User closed the dialog (resisted temptation)
      // Call store to increment count
      useStore.getState().incrementResistedTemptation();
    }
    setShowFriction(open);
  }

  return (
    <div className="relative h-screen bg-transparent overflow-hidden font-sans">
      <DigitalGridBackground />
      {hasStarted && <Hud />}
      <IntroRitual open={!hasStarted} onStart={startChallenge} />
      {hasStarted && <DailyIntro open={showDailyIntro} onClose={handleCloseDailyIntro} />}
      <div className="fixed top-6 right-6 z-50 flex gap-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full p-1">
        <Button
          variant={lang === 'en' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-9 px-4 font-mono font-semibold tracking-wider text-white"
          onClick={() => setLang('en')}
        >
          {t('en_label')}
        </Button>
        <Button
          variant={lang === 'zh' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-9 px-4 font-mono font-semibold tracking-wider text-white"
          onClick={() => setLang('zh')}
        >
          {t('zh_label')}
        </Button>
      </div>

      <div className="relative w-full h-full">
        {hasStarted && (
          <TarotDeck
            onTaskComplete={handleTaskComplete}
            onStartFocus={handleStartFocus}
            pendingTaskIds={pendingTaskIds}
            immersive={!!activeFocus}
          />
        )}
      </div>
      {hasStarted && <TaskInput />}

      {hasStarted && <FocusTimerOverlay onComplete={handleFocusComplete} />}

      <div className="fixed bottom-8 left-8 z-50 flex gap-4">
        <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={() => setShowBadge(true)}>
          <Award className="w-5 h-5 mr-2" />
          {t('badge')}
        </Button>
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={() => setShowFriction(true)}>
          <Sliders className="w-5 h-5 mr-2" />
          {t('play')}
        </Button>
      </div>

      <Dialog open={showBadge} onOpenChange={setShowBadge}>
        <DialogContent className="bg-zinc-950/90 backdrop-blur-xl border-zinc-800 p-0 max-w-3xl">
          <BadgeScreen />
        </DialogContent>
      </Dialog>

      <Dialog open={showFriction} onOpenChange={handleFrictionClose}>
        <DialogContent className="bg-zinc-950/90 backdrop-blur-xl border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{t('confirm_deviation')}</DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2">
              {t('friction_desc')}
            </DialogDescription>
            <p className="text-sm text-zinc-500 pt-4">{t('friction_sentence')}</p>
          </DialogHeader>
          <Input
            type="text"
            value={frictionInput}
            onChange={(e) => setFrictionInput(e.target.value)}
            className="mt-4 bg-zinc-900 border-zinc-700 text-white focus-visible:ring-zinc-600"
            placeholder={t('confirm_and_start')}
          />
          <Button onClick={handlePlayClick} className="mt-4 bg-white text-black hover:bg-zinc-200">
            {t('confirm_and_start')}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {floatingXPs.map(xp => (
            <XPFeedback key={xp.id} xp={xp.xp} id={xp.id} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showLevelUp && <LevelUpScreen level={level} levelName={levelName} />}
      </AnimatePresence>

      <AchievementToast />
    </div>
  );
}

function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default App;
