import { useState, useEffect } from 'react';
import useStore, { useLevel } from '@/store/useStore';
import { motion } from 'framer-motion';
import { BgmPlayer } from '@/components/BgmPlayer';

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function calculateDayDifference(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();

  const startDay = getDayOfYear(start);
  const todayDay = getDayOfYear(today);

  if (today.getFullYear() > start.getFullYear()) {
    const daysInStartYear = (new Date(start.getFullYear(), 11, 31).getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(daysInStartYear) + todayDay;
  }

  return todayDay - startDay + 1;
}

export function Hud() {
  const [time, setTime] = useState(new Date());
  const startDate = useStore((state) => state.startDate);
  const { level, levelName, progress } = useLevel();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const day = startDate ? calculateDayDifference(startDate) : 1;

  return (
    <div className="fixed top-6 left-6 md:top-8 md:left-8 text-white font-sans z-50 pointer-events-none">
      <div className="text-4xl md:text-5xl font-bold font-mono">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
      <div className="text-zinc-400 font-mono text-sm md:text-base">{time.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>

      <div className="mt-4 md:mt-6 pointer-events-auto">
        <div className="text-zinc-300 text-xs md:text-sm">Day {day} / 21</div>
        <div className="text-base md:text-lg font-semibold">Lv.{level} {levelName}</div>
        <div className="w-36 md:w-48 bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
          <motion.div
            className="bg-white h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
        <div className="mt-2 scale-90 origin-top-left md:scale-100">
          <BgmPlayer />
        </div>
      </div>
    </div>
  );
}
