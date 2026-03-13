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

import useStore, { ACHIEVEMENTS, computeGainedXp } from './useStore';

function resetStore() {
  const today = new Date().toLocaleDateString('sv');
  useStore.setState({
    tasks: [],
    totalXP: 0,
    startDate: null,
    hasStarted: false,
    activeFocus: null,
    focusDaily: {},
    focusHistory: [],
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

  it('经验值计算按专注比例分段', () => {
    const preset = 30 * 60;
    expect(computeGainedXp(preset, Math.floor(preset * 0.79), 30)).toBe(0);
    expect(computeGainedXp(preset, Math.floor(preset * 0.8), 30)).toBe(30);
    expect(computeGainedXp(preset, preset, 30)).toBe(45);
    expect(computeGainedXp(preset, Math.floor(preset * 1.2), 30)).toBe(45);
  });

  it('提交专注记录会更新当日统计与历史', () => {
    const endedAt = new Date().toISOString();
    useStore.getState().commitFocusSession({
      taskId: 't1',
      title: 'Focus',
      isZen: false,
      presetSeconds: 600,
      baseXp: 10,
      focusedSeconds: 600,
      interruptions: 2,
      gainedXp: 15,
      startedAt: new Date(Date.now() - 600000).toISOString(),
      endedAt,
    });
    const day = new Date(endedAt).toLocaleDateString('sv');
    expect(useStore.getState().focusDaily[day]).toMatchObject({ sessions: 1, interruptions: 2, xp: 15, focusedSeconds: 600 });
    expect(useStore.getState().focusHistory.length).toBe(1);
    expect(useStore.getState().focusHistory[0].taskId).toBe('t1');
  });
});
