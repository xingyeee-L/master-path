import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

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

import useStore, { useLevel } from './useStore';
import useLocale from './useLocale';

function LevelProbe() {
  const { levelName } = useLevel();
  return <div>{levelName}</div>;
}

describe('useLevel', () => {
  beforeEach(() => {
    kv.clear();
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
  });

  afterEach(() => {
    cleanup();
  });

  it('中文返回中文头衔', () => {
    useLocale.setState({ lang: 'zh' });
    render(<LevelProbe />);
    expect(screen.getByText('启程者')).toBeInTheDocument();
  });

  it('英文返回英文头衔', () => {
    useLocale.setState({ lang: 'en' });
    render(<LevelProbe />);
    expect(screen.getByText('Initiate')).toBeInTheDocument();
  });
});
