// src/modules/det/store/detStore.ts
import { create } from 'zustand';

export interface WaveChannel {
    id: string;
    frequency: number;
    amplitude: number;
    phase: number;
    color: string;
    damping: number; // σ for Laplace
}

type DomainMode = 'time' | 'frequency' | '3d';
type TransformMode = 'fourier' | 'laplace';

interface DETState {
    channels: WaveChannel[];
    addChannel: () => void;
    removeChannel: (id: string) => void;
    updateChannel: (id: string, params: Partial<WaveChannel>) => void;

    domainMode: DomainMode;
    setDomainMode: (mode: DomainMode) => void;
    transformMode: TransformMode;
    setTransformMode: (mode: TransformMode) => void;

    frequencyBins: { frequency: number; magnitude: number }[];
    setFrequencyBins: (bins: { frequency: number; magnitude: number }[]) => void;

    loadPreset: (preset: 'square' | 'sawtooth' | 'am') => void;
}

const CHANNEL_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

let channelIdCounter = 0;

export const useDETStore = create<DETState>((set, get) => ({
    channels: [
        { id: `ch-${++channelIdCounter}`, frequency: 5, amplitude: 1.0, phase: 0, color: CHANNEL_COLORS[0], damping: 0 },
    ],

    addChannel: () => {
        const { channels } = get();
        if (channels.length >= 8) return;
        const id = `ch-${++channelIdCounter}`;
        const color = CHANNEL_COLORS[channels.length % CHANNEL_COLORS.length];
        set({
            channels: [...channels, { id, frequency: channels.length * 3 + 2, amplitude: 0.5, phase: 0, color, damping: 0 }],
        });
    },

    removeChannel: (id) => set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),

    updateChannel: (id, params) => set((s) => ({
        channels: s.channels.map((c) => (c.id === id ? { ...c, ...params } : c)),
    })),

    domainMode: 'time',
    setDomainMode: (mode) => set({ domainMode: mode }),
    transformMode: 'fourier',
    setTransformMode: (mode) => set({ transformMode: mode }),

    frequencyBins: [],
    setFrequencyBins: (bins) => set({ frequencyBins: bins }),

    loadPreset: (preset) => {
        channelIdCounter = 0;
        switch (preset) {
            case 'square': {
                // Square wave: sum of odd harmonics
                const channels: WaveChannel[] = [];
                for (let i = 0; i < 5; i++) {
                    const n = 2 * i + 1;
                    channels.push({
                        id: `ch-${++channelIdCounter}`,
                        frequency: n * 2,
                        amplitude: 1 / n,
                        phase: 0,
                        color: CHANNEL_COLORS[i],
                        damping: 0,
                    });
                }
                set({ channels });
                break;
            }
            case 'sawtooth': {
                const channels: WaveChannel[] = [];
                for (let i = 1; i <= 6; i++) {
                    channels.push({
                        id: `ch-${++channelIdCounter}`,
                        frequency: i * 3,
                        amplitude: 1 / i,
                        phase: 0,
                        color: CHANNEL_COLORS[i - 1],
                        damping: 0,
                    });
                }
                set({ channels });
                break;
            }
            case 'am': {
                set({
                    channels: [
                        { id: `ch-${++channelIdCounter}`, frequency: 20, amplitude: 1.0, phase: 0, color: CHANNEL_COLORS[0], damping: 0 },
                        { id: `ch-${++channelIdCounter}`, frequency: 2, amplitude: 0.3, phase: 0, color: CHANNEL_COLORS[1], damping: 0 },
                    ],
                });
                break;
            }
        }
    },
}));
