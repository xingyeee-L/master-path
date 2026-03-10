import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface XPFeedbackProps {
  xp: number;
  id: string;
}

export function XPFeedback({ xp, id }: XPFeedbackProps) {
  const [target, setTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // HUD is fixed at top-8 left-8. 
    // In our centered context (flex items-center justify-center), 
    // center is at window.innerWidth/2, window.innerHeight/2.
    // Target position is x=60, y=60 (approx center of HUD)
    setTarget({
      x: 60 - window.innerWidth / 2,
      y: 60 - window.innerHeight / 2
    });
  }, []);

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.5, 1, 0.5],
        x: [0, 0, target.x],
        y: [0, -50, target.y]
      }}
      transition={{
        duration: 0.8,
        times: [0, 0.2, 0.8, 1],
        ease: "easeInOut"
      }}
      data-testid="xp-feedback"
      className="absolute font-black text-4xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] z-[100] pointer-events-none"
    >
      +{xp} XP
    </motion.div>
  );
}
