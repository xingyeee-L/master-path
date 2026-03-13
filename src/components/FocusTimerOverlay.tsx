import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useStore, { computeGainedXp } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';
import { audioEngine } from '@/lib/audioEngine';

function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export interface FocusCompletePayload {
  taskId: string;
  title: string;
  isZen: boolean;
  durationMinutes: number;
  presetSeconds: number;
  baseXp: number;
  focusedSeconds: number;
  interruptions: number;
  startedAt: string;
  endedAt: string;
  gainedXp: number;
}

export function FocusTimerOverlay({
  onComplete,
}: {
  onComplete: (payload: FocusCompletePayload) => void;
}) {
  const activeFocus = useStore(s => s.activeFocus);
  const updateActiveFocus = useStore(s => s.updateActiveFocus);
  const clearActiveFocus = useStore(s => s.clearActiveFocus);
  const t = useT();

  const [focusedMs, setFocusedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [interruptions, setInterruptions] = useState(0);
  const [wasInterrupted, setWasInterrupted] = useState(false);

  const activeRef = useRef(activeFocus);
  const focusedMsRef = useRef(focusedMs);
  const lastTickRef = useRef<number>(Date.now());
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeRef.current = activeFocus;
  }, [activeFocus]);

  useEffect(() => {
    focusedMsRef.current = focusedMs;
  }, [focusedMs]);

  const presetSeconds = activeFocus?.presetSeconds ?? 0;
  const presetMs = presetSeconds * 1000;
  const maxMs = Math.floor(presetMs * 1.2);

  const remainingMs = useMemo(() => {
    if (!activeFocus) return 0;
    return presetMs - focusedMs;
  }, [activeFocus, presetMs, focusedMs]);

  const overMs = useMemo(() => {
    if (!activeFocus) return 0;
    return Math.max(0, focusedMs - presetMs);
  }, [activeFocus, presetMs, focusedMs]);

  const progress = useMemo(() => {
    if (!activeFocus || presetMs <= 0) return 0;
    return Math.max(0, Math.min(1.2, focusedMs / presetMs));
  }, [activeFocus, presetMs, focusedMs]);

  const expectedXp = useMemo(() => {
    if (!activeFocus) return 0;
    const focusedSeconds = Math.floor(Math.min(maxMs, focusedMs) / 1000);
    return computeGainedXp(activeFocus.presetSeconds, focusedSeconds, activeFocus.baseXp);
  }, [activeFocus, focusedMs, maxMs]);

  const finish = useCallback((endedAt: string) => {
    const active = activeRef.current;
    if (!active) return;
    const focusedSeconds = Math.floor(Math.min(maxMs, focusedMsRef.current) / 1000);
    const gainedXp = computeGainedXp(active.presetSeconds, focusedSeconds, active.baseXp);
    const startedAt = new Date(active.startedAtMs).toISOString();
    const durationMinutes = active.isZen ? 15 : Math.max(1, Math.round(active.presetSeconds / 60));
    const payload: FocusCompletePayload = {
      taskId: active.taskId,
      title: active.title,
      isZen: active.isZen,
      durationMinutes,
      presetSeconds: active.presetSeconds,
      baseXp: active.baseXp,
      focusedSeconds,
      interruptions: active.interruptions,
      startedAt,
      endedAt,
      gainedXp,
    };
    clearActiveFocus();
    onComplete(payload);
  }, [clearActiveFocus, maxMs, onComplete]);

  const pause = useCallback((countInterrupt = true) => {
    const active = activeRef.current;
    if (!active) return;
    setRunning(false);
    const nextInterruptions = countInterrupt ? active.interruptions + 1 : active.interruptions;
    setInterruptions(nextInterruptions);
    updateActiveFocus({
      running: false,
      focusedMs: focusedMsRef.current,
      lastTickMs: Date.now(),
      interruptions: nextInterruptions,
    });
  }, [updateActiveFocus]);

  const resume = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    const now = Date.now();
    setWasInterrupted(false);
    setRunning(true);
    setInterruptions(active.interruptions);
    lastTickRef.current = now;
    updateActiveFocus({ running: true, lastTickMs: now, focusedMs: focusedMsRef.current });
  }, [updateActiveFocus]);

  useEffect(() => {
    if (!activeFocus) return;
    const now = Date.now();
    setFocusedMs(activeFocus.focusedMs);
    lastTickRef.current = now;

    const gap = now - activeFocus.lastTickMs;
    if (activeFocus.running && gap > 2500) {
      const nextInterruptions = activeFocus.interruptions + 1;
      setWasInterrupted(true);
      setRunning(false);
      setInterruptions(nextInterruptions);
      updateActiveFocus({ running: false, lastTickMs: now, interruptions: nextInterruptions, focusedMs: activeFocus.focusedMs });
    } else {
      setWasInterrupted(false);
      setRunning(activeFocus.running);
      setInterruptions(activeFocus.interruptions);
    }

    if (syncTimerRef.current) {
      window.clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    syncTimerRef.current = window.setInterval(() => {
      const active = activeRef.current;
      if (!active) return;
      if (!running) return;
      updateActiveFocus({ focusedMs: focusedMsRef.current, lastTickMs: lastTickRef.current });
    }, 5000);

    const tryEnterFullscreen = async () => {
      try {
        if (document.fullscreenElement == null) {
          await document.documentElement.requestFullscreen();
        }
      } catch { void 0 }
      try {
        const mod = await import('@tauri-apps/api/window');
        const win = mod.getCurrentWindow();
        await win.setFullscreen(true);
      } catch { void 0 }
    };
    tryEnterFullscreen();

    return () => {
      if (syncTimerRef.current) {
        window.clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [activeFocus, running, updateActiveFocus]);

  useEffect(() => {
    if (!activeFocus) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (activeRef.current?.running) {
          setWasInterrupted(true);
          pause(true);
        }
      }
    };

    const onBlur = () => {
      if (activeRef.current?.running) {
        setWasInterrupted(true);
        pause(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [activeFocus, pause]);

  useEffect(() => {
    if (!activeFocus) return;
    if (!running) return;

    const tick = window.setInterval(() => {
      const active = activeRef.current;
      if (!active || !active.running) return;
      const now = Date.now();
      const dt = now - lastTickRef.current;
      if (dt <= 0 || dt > 2500) {
        setWasInterrupted(true);
        pause(true);
        return;
      }
      lastTickRef.current = now;
      setFocusedMs((prev) => {
        const next = prev + dt;
        if (next >= maxMs) {
          const endedAt = new Date().toISOString();
          window.setTimeout(() => finish(endedAt), 0);
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(tick);
  }, [activeFocus, running, maxMs, finish, pause]);

  useEffect(() => {
    if (!activeFocus) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        pause(false);
        clearActiveFocus();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeRef.current?.running) finish(new Date().toISOString());
        else resume();
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (audioEngine.isPaused()) audioEngine.resumeBgm();
        else audioEngine.pauseBgm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeFocus, clearActiveFocus, finish, pause, resume]);

  useEffect(() => {
    if (!activeFocus) return;
    return () => {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => void 0);
        }
      } catch { void 0 }
      import('@tauri-apps/api/window')
        .then((m) => m.getCurrentWindow().setFullscreen(false))
        .catch(() => void 0);
    };
  }, [activeFocus]);

  const ring = useMemo(() => {
    const r = 120;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, progress / 1.2));
    return { r, c, pct };
  }, [progress]);

  return (
    <AnimatePresence>
      {activeFocus && (
        <motion.div
          className="fixed inset-0 z-[300] bg-zinc-950 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_50%_70%,rgba(50,205,50,0.10),transparent_62%)]" />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.28, 0.44, 0.3] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
                backgroundPosition: 'center',
              }}
            />
          </div>

          <div className="relative z-10 w-full max-w-3xl px-6">
            <div className="flex items-center justify-between text-zinc-200">
              <div className="font-mono text-xs tracking-wider opacity-80">
                {activeFocus.isZen ? 'ZEN' : 'FOCUS'} · {activeFocus.presetSeconds / 60}m
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-white"
                  onClick={() => {
                    pause(false);
                    clearActiveFocus();
                  }}
                >
                  {t('give_up')}
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-8 md:p-10">
                <div className="text-center">
                  <div className="text-white text-2xl md:text-3xl font-black tracking-wide">
                    {activeFocus.title}
                  </div>
                  <div className="mt-2 text-zinc-400 font-mono text-xs">
                    {wasInterrupted ? t('focus_interrupted') : (running ? t('focus_in_progress') : t('focus_paused'))}
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-center">
                  <div className="relative w-[280px] h-[280px]">
                    <svg className="absolute inset-0" width="280" height="280" viewBox="0 0 280 280">
                      <defs>
                        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                          <stop offset="65%" stopColor="rgba(50,205,50,0.85)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="140"
                        cy="140"
                        r={ring.r}
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="140"
                        cy="140"
                        r={ring.r}
                        stroke="url(#ring)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={ring.c}
                        initial={false}
                        animate={{ strokeDashoffset: ring.c * (1 - ring.pct) }}
                        transition={{ type: 'spring', stiffness: 140, damping: 26 }}
                        style={{ rotate: -90, transformOrigin: '140px 140px' }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div data-testid="focus-timer-display" className="text-6xl md:text-7xl font-mono font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.18)]">
                        {remainingMs >= 0 ? formatClock(remainingMs) : `+${formatClock(overMs)}`}
                      </div>
                      <div className="mt-2 text-zinc-300 font-mono text-xs">
                        {t('focus_xp_expected').replace('{XP}', String(expectedXp))} · {t('focus_interruptions').replace('{N}', String(interruptions))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3">
                    {running ? (
                      <Button
                        variant="secondary"
                        className="px-6"
                        onClick={() => {
                          setWasInterrupted(false);
                          pause(false);
                        }}
                      >
                        {t('focus_pause')}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="px-6"
                        onClick={() => resume()}
                      >
                        {t('focus_resume')}
                      </Button>
                    )}

                    <Button
                      className="px-6"
                      onClick={() => finish(new Date().toISOString())}
                    >
                      {t('focus_complete')}
                    </Button>
                  </div>

                  <div className="mt-8 w-full flex flex-col items-center gap-3">
                    <div className="text-zinc-400 text-xs font-mono">{t('focus_music_hint')}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white"
                        aria-label="bgm-toggle"
                        onClick={() => {
                          if (audioEngine.isPaused()) audioEngine.resumeBgm();
                          else audioEngine.pauseBgm();
                        }}
                      >
                        {audioEngine.isPaused() ? '▶' : '❚❚'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white"
                        aria-label="bgm-prev"
                        onClick={() => audioEngine.prevTrack()}
                      >
                        ‹
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white"
                        aria-label="bgm-next"
                        onClick={() => audioEngine.nextTrack()}
                      >
                        ›
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 text-zinc-500 font-mono text-[11px] text-center">
                    {t('focus_overtime_hint')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
