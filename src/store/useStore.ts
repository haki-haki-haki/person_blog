import { create } from 'zustand';

type Language = 'zh' | 'en';

interface Store {
  language: Language;
  toggleLanguage: () => void;
  isBlackWhite: boolean;
  toggleBlackWhite: () => void;
}

export const useStore = create<Store>((set) => ({
  language: 'en',
  toggleLanguage: () => set((state) => ({ language: state.language === 'zh' ? 'en' : 'zh' })),
  isBlackWhite: false,
  toggleBlackWhite: () => set((state) => ({ isBlackWhite: !state.isBlackWhite })),
}));