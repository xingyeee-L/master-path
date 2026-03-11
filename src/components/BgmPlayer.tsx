import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { audioEngine } from '@/lib/audioEngine';

export function BgmPlayer() {
  const [tracks, setTracks] = useState<{ title: string; url: string }[]>([]);
  const [current, setCurrent] = useState(0);
  const [random, setRandom] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const p = audioEngine.getPlaylist();
    setTracks(p.tracks);
    setCurrent(p.currentIndex);
    setRandom(p.random);
    setPaused(audioEngine.isPaused());
    const unsub = audioEngine.subscribeTrackChange((i) => {
      const np = audioEngine.getPlaylist();
      setTracks(np.tracks);
      setCurrent(i);
      setPaused(audioEngine.isPaused());
    });
    return () => unsub();
  }, []);

  const currentTitle = useMemo(() => tracks[current]?.title ?? '', [tracks, current]);

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const f of Array.from(files)) {
      await audioEngine.addTrackFile(f);
    }
    const p = audioEngine.getPlaylist();
    setTracks(p.tracks);
  };
  const triggerUpload = () => {
    const el = document.getElementById('bgm-upload-input') as HTMLInputElement | null;
    el?.click();
  };

  return (
    <div className="mt-3 w-56 relative">
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_50%_75%,rgba(50,205,50,0.05),transparent_60%)]" />
        </div>
        <div className="relative z-10 p-2 text-white">
          <div className="flex items-center gap-2">
            <div className="text-xs font-mono truncate max-w-[140px]">{currentTitle || '—'}</div>
            <div className="flex gap-1 ml-auto">
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10"
                onClick={() => {
                  if (audioEngine.isPaused()) {
                    audioEngine.resumeBgm();
                    setPaused(false);
                  } else {
                    audioEngine.pauseBgm();
                    setPaused(true);
                  }
                }}
                aria-label="pause-resume"
              >
                {paused ? '▶' : '❚❚'}
              </Button>
              <Button size="icon" variant="ghost" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10" onClick={() => audioEngine.prevTrack()}>
                ‹
              </Button>
              <Button size="icon" variant="ghost" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10" onClick={() => audioEngine.nextTrack()}>
                ›
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="xs"
              variant={random ? 'secondary' : 'ghost'}
              className="px-2 py-1"
              onClick={() => {
                const next = !random;
                audioEngine.setRandomMode(next);
                setRandom(next);
              }}
            >
              随机
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="ml-auto px-2 py-1"
              onClick={triggerUpload}
            >
              上传曲目
            </Button>
            <input id="bgm-upload-input" type="file" accept="audio/mpeg,audio/mp3" multiple onChange={handleAdd} className="hidden" />
          </div>
          <div className="mt-2 max-h-28 overflow-auto pr-1">
            <div className="space-y-1">
              {tracks.map((t, i) => (
                <button
                  key={t.url}
                  className={`w-full text-left px-2 py-1 rounded-xl text-[11px] font-mono ${i === current ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5 border border-transparent'}`}
                  onClick={() => audioEngine.playIndex(i)}
                  title={t.title}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
