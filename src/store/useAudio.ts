import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { audioEngine } from '@/lib/audioEngine';

interface AudioState {
  enabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  setEnabled: (v: boolean) => void;
  setBgmEnabled: (v: boolean) => void;
  setSfxEnabled: (v: boolean) => void;
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const useAudio = create<AudioState>()(
  persist(
    (set) => ({
      enabled: true,
      bgmEnabled: true,
      sfxEnabled: true,
      bgmVolume: 0.35,
      sfxVolume: 0.6,
      setEnabled: (v) => set({ enabled: v }),
      setBgmEnabled: (v) => set({ bgmEnabled: v }),
      setSfxEnabled: (v) => set({ sfxEnabled: v }),
      setBgmVolume: (v) => set({ bgmVolume: clamp01(v) }),
      setSfxVolume: (v) => set({ sfxVolume: clamp01(v) }),
    }),
    { name: 'master-path-audio' }
  )
);

let bound = false;
function bindAudioEngine() {
  if (bound) return;
  bound = true;
  const state = useAudio.getState();
  audioEngine.configure(state);
  if (state.enabled && state.bgmEnabled) audioEngine.ensureBgm();
  audioEngine.attachUnlockListeners();
  useAudio.subscribe((next, prev) => {
    audioEngine.configure(next);
    if (next.enabled && next.bgmEnabled && (!prev.enabled || !prev.bgmEnabled)) {
      audioEngine.ensureBgm();
    }
    if ((!next.enabled && prev.enabled) || (!next.bgmEnabled && prev.bgmEnabled)) {
      audioEngine.stopBgm();
    }
  });
}

export function initAudio() {
  bindAudioEngine();
}

export default useAudio;
