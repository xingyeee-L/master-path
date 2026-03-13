import { useState } from 'react';
import useStore from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n';

export function TaskInput() {
    const [title, setTitle] = useState("");
    const [step, setStep] = useState('TITLE'); // TITLE | DURATION
    const addTask = useStore((state) => state.addTask);
    const t = useT();

    const handleTitleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && title.trim()) {
            setStep('DURATION');
        }
    };

    const handleDurationSelect = (duration: number) => {
        addTask(title, duration);
        setTitle("");
        setStep('TITLE');
    };

    return (
        <div className="fixed bottom-6 md:bottom-8 w-full max-w-md px-6 md:px-8 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence mode="wait">
                {step === 'TITLE' ? (
                    <motion.div key="title-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Input
                            type="text"
                            placeholder={t('cast_placeholder')}
                            className="w-full text-base md:text-lg bg-transparent border-0 border-b-2 border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-white text-white placeholder:text-zinc-500 text-center"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleTitleSubmit}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="duration-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-wrap items-center justify-center gap-2 bg-black/20 backdrop-blur-md p-2 rounded-lg">
                        <Button variant="ghost" size="sm" onClick={() => handleDurationSelect(15)} className="text-white hover:bg-white/10 flex-1 min-w-[3rem]">15m</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDurationSelect(30)} className="text-white hover:bg-white/10 flex-1 min-w-[3rem]">30m</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDurationSelect(60)} className="text-white hover:bg-white/10 flex-1 min-w-[3rem]">1h</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDurationSelect(120)} className="text-white hover:bg-white/10 flex-1 min-w-[3rem]">2h</Button>
                        {/* You can add a custom input here if needed */}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
