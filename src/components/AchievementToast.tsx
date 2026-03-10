import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore, { ACHIEVEMENTS } from '@/store/useStore';
import { Trophy } from 'lucide-react';

export function AchievementToast() {
  const latestAchievement = useStore((state) => state.latestAchievement);
  const clearLatestAchievement = useStore((state) => state.clearLatestAchievement);

  useEffect(() => {
    if (latestAchievement) {
      const timer = setTimeout(() => {
        clearLatestAchievement();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [latestAchievement, clearLatestAchievement]);

  const achievement = latestAchievement ? Object.values(ACHIEVEMENTS).find(a => a.id === latestAchievement) : null;

  return (
    <AnimatePresence>
      {latestAchievement && achievement && (
        <motion.div
          initial={{ y: -100, opacity: 0, x: '-50%' }}
          animate={{ y: 20, opacity: 1, x: '-50%' }}
          exit={{ y: -100, opacity: 0, x: '-50%' }}
          className="fixed top-0 left-1/2 z-[200] flex items-center gap-4 bg-zinc-900/90 border border-yellow-500/50 text-white px-6 py-4 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-md"
        >
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-500 text-sm tracking-wider uppercase">Achievement Unlocked</h3>
            <p className="font-bold text-lg">{achievement.title}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
