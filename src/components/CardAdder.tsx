import { useState } from 'react';
import useStore from '@/store/useStore';
import { Input } from '@/components/ui/input';

export function CardAdder() {
  const [taskTitle, setTaskTitle] = useState("");
  const addTask = useStore((state) => state.addTask);

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && taskTitle.trim()) {
      addTask(taskTitle.trim(), 30);
      setTaskTitle("");
    }
  };

  return (
    <div className="fixed bottom-8 w-full max-w-md px-8 left-1/2 -translate-x-1/2 z-50">
      <Input
        type="text"
        placeholder="Summon a new task..."
        className="w-full text-lg bg-transparent border-0 border-b-2 border-white/20 rounded-none focus-visible:ring-0 focus-visible:border-white text-white placeholder:text-zinc-500 text-center"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        onKeyDown={handleAddTask}
      />
    </div>
  );
}
