import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Lang = 'zh' | 'en';

interface LocaleState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      lang: 'zh',
      setLang: (l) => set({ lang: l }),
    }),
    { name: 'master-path-locale' }
  )
);

export default useLocale;

