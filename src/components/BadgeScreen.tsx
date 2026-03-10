import { useRef, useState } from 'react';
import useStore, { useLevel, ACHIEVEMENTS } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Hexagon, Trophy, Lock } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useT } from '@/i18n';
import { motion } from 'framer-motion';

// A simplified version for the dialog
export function BadgeScreen() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const { totalXP, startDate, unlockedAchievements } = useStore();
  const { levelName } = useLevel();
  const t = useT();
  const [view, setView] = useState<'badge' | 'achievements'>('badge');

  const handleSave = () => {
    if (badgeRef.current) {
      html2canvas(badgeRef.current, { backgroundColor: '#09090b' }).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'MasterPath_Badge.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('sv') : 'N/A';
  const today = new Date().toLocaleDateString('sv');

  return (
    <div className="flex flex-col items-center justify-center bg-transparent text-white p-4 min-h-[500px]">
      <div className="flex space-x-4 mb-6">
        <Button
          variant={view === 'badge' ? 'secondary' : 'ghost'}
          onClick={() => setView('badge')}
        >
          {t('badge')}
        </Button>
        <Button
          variant={view === 'achievements' ? 'secondary' : 'ghost'}
          onClick={() => setView('achievements')}
        >
          Achievements
        </Button>
      </div>

      {view === 'badge' ? (
        <>
          <div ref={badgeRef} className="bg-zinc-900/50 p-8 rounded-2xl shadow-xl border border-zinc-700 w-full max-w-md flex flex-col items-center text-center">
            <Hexagon className="w-12 h-12 text-zinc-400" />
            <h2 className="mt-4 text-zinc-400">{t('challenge_title')}</h2>
            <h1 className="text-5xl font-bold my-6 text-white">{levelName}</h1>
            <p className="text-zinc-400 text-md">{t('challenge_desc')}</p>
            <div className="mt-10 flex justify-between w-full text-zinc-500 text-sm">
              <span>Total XP: {totalXP}</span>
              <span>{formattedStartDate} - {today}</span>
            </div>
          </div>
          <Button onClick={handleSave} className="mt-6 bg-white text-black hover:bg-zinc-200">
            {t('save_badge')}
          </Button>
        </>
      ) : (
        <div className="w-full max-w-2xl h-[400px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(ACHIEVEMENTS).map((achievement) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative p-4 rounded-xl border ${isUnlocked
                    ? 'bg-zinc-900/50 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                    : 'bg-zinc-900/20 border-zinc-800 grayscale opacity-50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-yellow-500/20' : 'bg-zinc-800'}`}>
                      {isUnlocked ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Lock className="w-5 h-5 text-zinc-500" />}
                    </div>
                    {isUnlocked && <span className="text-[10px] font-mono text-yellow-500/80 uppercase tracking-wider">Unlocked</span>}
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {achievement.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
