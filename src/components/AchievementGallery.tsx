import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import useStore, { ACHIEVEMENTS } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';

interface AchievementGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AchievementGallery({ open, onOpenChange }: AchievementGalleryProps) {
  const unlocked = useStore((state) => state.unlockedAchievements);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="text-white w-8 h-8" />
            Achievement Gallery
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Your milestones on the path to mastery.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Object.values(ACHIEVEMENTS).map((achievement) => {
            const isUnlocked = unlocked.includes(achievement.id);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative p-4 rounded-xl border ${isUnlocked
                  ? 'bg-zinc-900/50 border-white/10 shadow-lg'
                  : 'bg-zinc-900/20 border-white/5 opacity-50'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-white/10 text-white' : 'bg-white/5 text-zinc-600'}`}>
                    {isUnlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  {isUnlocked && <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Unlocked</span>}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                  {achievement.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {achievement.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
