// src/store/appStore.ts
import { create } from 'zustand';

type Theme = 'dark' | 'light';
type ActiveModule =
    | 'pathfinding'
    | 'dataStructures'
    | 'det'
    | 'dmgt'
    | 'networks'
    | 'os'
    | null;

interface AppState {
    activeModule: ActiveModule;
    setActiveModule: (module: ActiveModule) => void;

    theme: Theme;
    toggleTheme: () => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (val: boolean) => void;

    playbackSpeed: number;
    setPlaybackSpeed: (speed: number) => void;

    hintsEnabled: boolean;
    toggleHints: () => void;
    activeHint: string | null;
    setActiveHint: (hint: string | null) => void;

    showFPS: boolean;
}

export const useAppStore = create<AppState>((set) => ({
    activeModule: null,
    setActiveModule: (module) => set({ activeModule: module }),

    theme: 'dark',
    toggleTheme: () =>
        set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            return { theme: newTheme };
        }),

    sidebarCollapsed: false,
    setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

    playbackSpeed: 1,
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    hintsEnabled: true,
    toggleHints: () => set((state) => ({ hintsEnabled: !state.hintsEnabled })),
    activeHint: null,
    setActiveHint: (hint) => set({ activeHint: hint }),

    showFPS: false,
}));

export type { Theme, ActiveModule, AppState };
