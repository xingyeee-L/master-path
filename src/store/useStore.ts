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
  completedAt?: string;
  gainedXp?: number;
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
  lastIntroDate?: string;
}

export interface FocusDailyStat {
  focusedSeconds: number;
  sessions: number;
  interruptions: number;
  xp: number;
}

export interface FocusSession {
  id: string;
  taskId: string;
  title: string;
  isZen: boolean;
  presetSeconds: number;
  baseXp: number;
  focusedSeconds: number;
  interruptions: number;
  gainedXp: number;
  startedAt: string;
  endedAt: string;
}

export interface ActiveFocus {
  sessionId: string;
  taskId: string;
  title: string;
  isZen: boolean;
  presetSeconds: number;
  baseXp: number;
  startedAtMs: number;
  focusedMs: number;
  running: boolean;
  interruptions: number;
  lastTickMs: number;
}

interface StoreState {
  tasks: Task[];
  totalXP: number;
  startDate: string | null;
  hasStarted: boolean;
  stats: Stats;
  unlockedAchievements: string[];
  latestAchievement: string | null;
  markDailyIntroShown: () => void;

  addTask: (title: string, duration: number, isZen?: boolean) => void;
  toggleTask: (id: string) => void;
  completeTaskWithXp: (id: string, gainedXp: number, completedAt?: string) => void;
  startChallenge: () => void;
  clearLatestAchievement: () => void;
  incrementResistedTemptation: () => void;

  activeFocus: ActiveFocus | null;
  focusDaily: Record<string, FocusDailyStat>;
  focusHistory: FocusSession[];
  startFocus: (payload: { taskId: string; title: string; isZen?: boolean; presetSeconds: number; baseXp: number }) => void;
  updateActiveFocus: (partial: Partial<ActiveFocus>) => void;
  clearActiveFocus: () => void;
  commitFocusSession: (session: Omit<FocusSession, 'id'>) => void;
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

export function computeGainedXp(presetSeconds: number, focusedSeconds: number, baseXp: number) {
  const preset = Math.max(1, presetSeconds);
  const ratio = Math.max(0, Math.min(1.2, focusedSeconds / preset));
  if (ratio < 0.8) return 0;
  if (ratio < 1.0) return Math.round(baseXp);
  return Math.round(baseXp * 1.5);
}

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
        lastIntroDate: '',
      },
      unlockedAchievements: [],
      latestAchievement: null,
      activeFocus: null,
      focusDaily: {},
      focusHistory: [],

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

      completeTaskWithXp: (id, gainedXp, completedAt) => {
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

        const today = new Date().toLocaleDateString('sv');
        let { currentDailyXP, lastXPDate, totalZenCount, maxDailyXp } = state.stats;
        const newUnlocked: string[] = [];

        if (today !== lastXPDate) {
          currentDailyXP = 0;
          lastXPDate = today;
        }
        currentDailyXP += gainedXp;
        if (currentDailyXP > maxDailyXp) maxDailyXp = currentDailyXP;

        if (task.isZen) {
          totalZenCount += 1;
        }

        if (task.isZen && totalZenCount === 1 && !state.unlockedAchievements.includes(ACHIEVEMENTS.FIRST_GLIMPSE.id)) {
          newUnlocked.push(ACHIEVEMENTS.FIRST_GLIMPSE.id);
        }
        if (currentDailyXP >= 360 && !state.unlockedAchievements.includes(ACHIEVEMENTS.FLOW_STATE.id)) {
          newUnlocked.push(ACHIEVEMENTS.FLOW_STATE.id);
        }

        const doneAt = completedAt ?? new Date().toISOString();

        set((state) => ({
          tasks: foundTask
            ? state.tasks.map((t) => (t.id === id ? { ...t, completed: true, completedAt: doneAt, gainedXp } : t))
            : state.tasks,
          totalXP: state.totalXP + gainedXp,
          stats: { ...state.stats, currentDailyXP, lastXPDate, totalZenCount, maxDailyXp, lastZenDate: task.isZen ? today : state.stats.lastZenDate },
          unlockedAchievements: [...state.unlockedAchievements, ...newUnlocked],
          latestAchievement: newUnlocked.length > 0 ? newUnlocked[0] : state.latestAchievement,
        }));
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
        get().completeTaskWithXp(id, gainedXP);
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

      startFocus: (payload) => {
        const now = Date.now();
        set({
          activeFocus: {
            sessionId: uuidv4(),
            taskId: payload.taskId,
            title: payload.title,
            isZen: !!payload.isZen,
            presetSeconds: Math.max(1, payload.presetSeconds),
            baseXp: Math.max(0, payload.baseXp),
            startedAtMs: now,
            focusedMs: 0,
            running: true,
            interruptions: 0,
            lastTickMs: now,
          },
        });
      },

      updateActiveFocus: (partial) => {
        set((state) => {
          if (!state.activeFocus) return state;
          return { activeFocus: { ...state.activeFocus, ...partial } };
        });
      },

      clearActiveFocus: () => set({ activeFocus: null }),

      commitFocusSession: (session) => {
        const id = uuidv4();
        const today = new Date(session.endedAt).toLocaleDateString('sv');
        set((state) => {
          const prev = state.focusDaily[today] ?? { focusedSeconds: 0, sessions: 0, interruptions: 0, xp: 0 };
          const nextDaily: FocusDailyStat = {
            focusedSeconds: prev.focusedSeconds + session.focusedSeconds,
            sessions: prev.sessions + 1,
            interruptions: prev.interruptions + session.interruptions,
            xp: prev.xp + session.gainedXp,
          };
          const history = [...state.focusHistory, { ...session, id }];
          const trimmed = history.length > 200 ? history.slice(history.length - 200) : history;
          return { focusDaily: { ...state.focusDaily, [today]: nextDaily }, focusHistory: trimmed };
        });
      },

      startChallenge: () => {
        set({ 
          hasStarted: true, 
          startDate: new Date().toISOString(),
          tasks: [],
          totalXP: 0,
          activeFocus: null,
          focusDaily: {},
          focusHistory: [],
          stats: {
            totalZenCount: 0,
            maxDailyXp: 0,
            resistedTemptationCount: 0,
            currentDailyXP: 0,
            lastXPDate: new Date().toLocaleDateString('sv'),
            lastZenDate: '',
            lastIntroDate: '',
          },
          unlockedAchievements: [],
        });
      },

      clearLatestAchievement: () => set({ latestAchievement: null }),
      markDailyIntroShown: () => {
        const today = new Date().toLocaleDateString('sv');
        set((state) => ({
          stats: { ...state.stats, lastIntroDate: today }
        }));
      },
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
