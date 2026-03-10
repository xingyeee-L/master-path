import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const kv = new Map<string, string>();

vi.mock('idb-keyval', () => ({
  get: async (key: string) => kv.get(key),
  set: async (key: string, value: string) => {
    kv.set(key, value);
  },
  del: async (key: string) => {
    kv.delete(key);
  },
}));

import useStore, { ACHIEVEMENTS } from './useStore';

function resetStore() {
  const today = new Date().toLocaleDateString('sv');
  useStore.setState({
    tasks: [],
    totalXP: 0,
    startDate: null,
    hasStarted: false,
    stats: {
      totalZenCount: 0,
      maxDailyXp: 0,
      resistedTemptationCount: 0,
      currentDailyXP: 0,
      lastXPDate: today,
      lastZenDate: '',
    },
    unlockedAchievements: [],
    latestAchievement: null,
  });
}

describe('useStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T08:00:00.000Z'));
    kv.clear();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('完成普通任务按 duration 增加 XP', () => {
    const { addTask, toggleTask } = useStore.getState();
    addTask('Task', 30, false);
    const taskId = useStore.getState().tasks[0].id;
    toggleTask(taskId);
    expect(useStore.getState().totalXP).toBe(30);
  });

  it('完成放空按 100 XP 结算', () => {
    useStore.getState().toggleTask('zen-card');
    expect(useStore.getState().totalXP).toBe(100);
  });

  it('完成放空会设置 lastZenDate 为当天', () => {
    const today = new Date().toLocaleDateString('sv');
    useStore.getState().toggleTask('zen-card');
    expect(useStore.getState().stats.lastZenDate).toBe(today);
  });

  it('首次放空解锁 初窥门径', () => {
    useStore.getState().toggleTask('zen-card');
    expect(useStore.getState().unlockedAchievements).toContain(ACHIEVEMENTS.FIRST_GLIMPSE.id);
  });

  it('单日 XP 达到 360 解锁 心流状态', () => {
    const { addTask, toggleTask } = useStore.getState();
    addTask('Big', 360, false);
    const id = useStore.getState().tasks[0].id;
    toggleTask(id);
    expect(useStore.getState().unlockedAchievements).toContain(ACHIEVEMENTS.FLOW_STATE.id);
  });

  it('战胜欲望解锁 悬崖勒马', () => {
    useStore.getState().incrementResistedTemptation();
    expect(useStore.getState().unlockedAchievements).toContain(ACHIEVEMENTS.PRECIPICE_REINED.id);
  });
});
