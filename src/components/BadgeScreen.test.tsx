import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

vi.mock('html2canvas', () => ({
  default: async () => document.createElement('canvas'),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const motion = new Proxy(
    {},
    {
      get: () =>
        React.forwardRef((props: Record<string, unknown>, ref) =>
          React.createElement('div', { ...props, ref })
        ),
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

import { BadgeScreen } from './BadgeScreen';
import useStore from '@/store/useStore';
import useLocale from '@/store/useLocale';

function resetStores() {
  useLocale.setState({ lang: 'zh' });
  const today = new Date().toLocaleDateString('sv');
  useStore.setState({
    tasks: [],
    totalXP: 0,
    startDate: new Date().toISOString(),
    hasStarted: true,
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

describe('BadgeScreen', () => {
  beforeEach(() => {
    kv.clear();
    resetStores();
  });

  afterEach(() => {
    cleanup();
  });

  it('可切换到成就视图并展示成就卡片', async () => {
    const user = userEvent.setup();
    render(<BadgeScreen />);

    await user.click(screen.getByRole('button', { name: 'Achievements' }));
    expect(screen.getByText('初窥门径')).toBeInTheDocument();
  });
});
