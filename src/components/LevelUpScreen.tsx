import { motion } from 'framer-motion';
import { useT } from '@/i18n';

interface LevelUpScreenProps {
  level: number;
  levelName: string;
}

export function LevelUpScreen({ level, levelName }: LevelUpScreenProps) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 1, delay: 2 } }}
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center z-[200] pointer-events-none"
    >
      <motion.h1 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { delay: 0.5, type: 'spring', stiffness: 200, damping: 15 } }}
        className="text-8xl font-black text-white tracking-tighter"
      >
        {t('level_up')}
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
        className="mt-4 text-3xl font-bold text-zinc-300"
      >
        Lv.{level} {levelName}
      </motion.p>
    </motion.div>
  );
}
