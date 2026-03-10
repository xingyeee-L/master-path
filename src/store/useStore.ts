import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import useLocale from '@/store/useLocale';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  isZen?: boolean;
  duration: number; // in minutes
}

export interface Stats {
  totalZenCount: number;
  maxDailyXp: number;
  resistedTemptationCount: number;
  currentDailyXP: number;
  lastXPDate: string;
  lastZenDate: string;
}

interface StoreState {
  tasks: Task[];
  totalXP: number;
  startDate: string | null;
  hasStarted: boolean;
  stats: Stats;
  unlockedAchievements: string[];
  latestAchievement: string | null;

  addTask: (title: string, duration: number, isZen?: boolean) => void;
  toggleTask: (id: string) => void;
  startChallenge: () => void;
  clearLatestAchievement: () => void;
  incrementResistedTemptation: () => void;
}

// XP Thresholds for Levels 1-10
const xpLevels = [
  0,      // Lv. 1
  180,    // Lv. 2
  450,    // Lv. 3
  810,    // Lv. 4
  1260,   // Lv. 5
  1800,   // Lv. 6
  2520,   // Lv. 7
  3600,   // Lv. 8
  5040,   // Lv. 9
  7560,   // Lv. 10 (Grandmaster)
];

const levelNames = [
  "Initiate", "Apprentice", "Adept", "Journeyman", "Artisan",
  "Expert", "Master", "Grandmaster", "Sage", "Absolute Grandmaster"
];

const levelNamesZh = [
  "启程者", "学徒", "能手", "行者", "匠人",
  "专家", "大师", "宗师", "贤者", "绝对大师"
];

const ZEN_XP = 100;

export const ACHIEVEMENTS = {
  FIRST_GLIMPSE: { id: 'first_glimpse', title: '初窥门径', desc: '完成第 1 次放空' },
  FLOW_STATE: { id: 'flow_state', title: '心流状态', desc: '单日获得超过 360 XP' },
  PRECIPICE_REINED: { id: 'precipice_reined', title: '悬崖勒马', desc: '战胜了一次欲望' },
};

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      totalXP: 0,
      startDate: null,
      hasStarted: false,
      stats: {
        totalZenCount: 0,
        maxDailyXp: 0,
        resistedTemptationCount: 0,
        currentDailyXP: 0,
        lastXPDate: new Date().toLocaleDateString('sv'),
        lastZenDate: '',
      },
      unlockedAchievements: [],
      latestAchievement: null,

      addTask: (title, duration, isZen = false) => {
        const newTask: Task = {
          id: uuidv4(),
          title,
          completed: false,
          date: new Date().toISOString(),
          isZen,
          duration,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      toggleTask: (id) => {
        const state = get();
        const foundTask = state.tasks.find(t => t.id === id);
        if (foundTask?.completed) return;
        const task: Task = foundTask ?? {
          id,
          title: 'zen-card',
          completed: false,
          date: new Date().toISOString(),
          isZen: id === 'zen-card',
          duration: 15,
        };
        if (!task.isZen && !foundTask) return;

        const gainedXP = task.isZen ? ZEN_XP : task.duration;

        const today = new Date().toLocaleDateString('sv');
        let { currentDailyXP, lastXPDate, totalZenCount, maxDailyXp } = state.stats;
        const newUnlocked: string[] = [];

        // Update Daily XP
        if (today !== lastXPDate) {
          currentDailyXP = 0;
          lastXPDate = today;
        }
        currentDailyXP += gainedXP;
        if (currentDailyXP > maxDailyXp) maxDailyXp = currentDailyXP;

        // Update Zen Count
        if (task.isZen) {
          totalZenCount += 1;
        }

        // Check Achievements
        if (task.isZen && totalZenCount === 1 && !state.unlockedAchievements.includes(ACHIEVEMENTS.FIRST_GLIMPSE.id)) {
          newUnlocked.push(ACHIEVEMENTS.FIRST_GLIMPSE.id);
        }
        if (currentDailyXP >= 360 && !state.unlockedAchievements.includes(ACHIEVEMENTS.FLOW_STATE.id)) {
          newUnlocked.push(ACHIEVEMENTS.FLOW_STATE.id);
        }

        set((state) => ({
          tasks: foundTask
            ? state.tasks.map((t) => (t.id === id ? { ...t, completed: true } : t))
            : state.tasks,
          totalXP: state.totalXP + gainedXP,
          stats: { ...state.stats, currentDailyXP, lastXPDate, totalZenCount, maxDailyXp, lastZenDate: task.isZen ? today : state.stats.lastZenDate },
          unlockedAchievements: [...state.unlockedAchievements, ...newUnlocked],
          latestAchievement: newUnlocked.length > 0 ? newUnlocked[0] : state.latestAchievement,
        }));
      },

      incrementResistedTemptation: () => {
        const state = get();
        const newCount = state.stats.resistedTemptationCount + 1;
        const newUnlocked: string[] = [];

        if (newCount >= 1 && !state.unlockedAchievements.includes(ACHIEVEMENTS.PRECIPICE_REINED.id)) {
          newUnlocked.push(ACHIEVEMENTS.PRECIPICE_REINED.id);
        }

        set((state) => ({
          stats: { ...state.stats, resistedTemptationCount: newCount },
          unlockedAchievements: [...state.unlockedAchievements, ...newUnlocked],
          latestAchievement: newUnlocked.length > 0 ? newUnlocked[0] : state.latestAchievement,
        }));
      },

      startChallenge: () => {
        set({ 
          hasStarted: true, 
          startDate: new Date().toISOString(),
          tasks: [],
          totalXP: 0,
          stats: {
            totalZenCount: 0,
            maxDailyXp: 0,
            resistedTemptationCount: 0,
            currentDailyXP: 0,
            lastXPDate: new Date().toLocaleDateString('sv'),
            lastZenDate: '',
          },
          unlockedAchievements: [],
        });
      },

      clearLatestAchievement: () => set({ latestAchievement: null }),
    }),
    {
      name: 'master-path-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

export const useLevel = () => {
  const totalXP = useStore((state) => state.totalXP);
  const lang = useLocale((s) => s.lang);
  const levelIndex = xpLevels.findIndex(xp => totalXP < xp);
  const level = levelIndex === -1 ? 10 : levelIndex;
  const levelName = (lang === 'zh' ? levelNamesZh : levelNames)[level - 1];
  const nextLevelXP = xpLevels[level] ?? xpLevels[xpLevels.length - 1];
  const currentLevelXP = totalXP - (xpLevels[level - 1] ?? 0);
  const progress = nextLevelXP ? (currentLevelXP / (nextLevelXP - (xpLevels[level - 1] ?? 0))) * 100 : 100;

  return { level, levelName, progress, totalXP, nextLevelXP };
};

export default useStore;
