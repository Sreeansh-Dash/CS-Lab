// src/modules/networks/store/networksStore.ts
import { create } from 'zustand';
import type { Bit, ErrorDetectionMode, DivisionStep } from '../../../types/network.types';
import { computeParityBit, checkParity, countFlippedBits } from '../utils/parity';
import { computeCRC, verifyCRC, CRC_GENERATORS } from '../utils/crc';

interface NetworksState {
    mode: ErrorDetectionMode;
    setMode: (mode: ErrorDetectionMode) => void;

    // Data
    originalBits: Bit[];
    setOriginalBits: (bits: Bit[]) => void;
    randomizeData: () => void;
    frameSize: number;
    setFrameSize: (size: number) => void;

    // Parity
    parityType: 'even' | 'odd';
    setParityType: (type: 'even' | 'odd') => void;
    parityBit: Bit;

    // CRC
    selectedGenerator: number;
    setSelectedGenerator: (idx: number) => void;
    senderFCS: Bit[];
    senderSteps: DivisionStep[];

    // Channel
    channelBits: Bit[];
    flipBit: (index: number) => void;
    resetChannel: () => void;

    // Receiver
    receiverResult: {
        accept: boolean;
        remainder?: Bit[];
        steps?: DivisionStep[];
        flippedCount: number;
        parityWarning?: string;
    };

    // Computed
    computeSender: () => void;
    computeReceiver: () => void;
}

function randomBits(n: number): Bit[] {
    return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : 0) as Bit);
}

export const useNetworksStore = create<NetworksState>((set, get) => ({
    mode: 'crc',
    setMode: (mode) => { set({ mode }); get().computeSender(); },

    originalBits: randomBits(8),
    setOriginalBits: (bits) => set({ originalBits: bits }),
    randomizeData: () => {
        const bits = randomBits(get().frameSize);
        set({ originalBits: bits });
        setTimeout(() => get().computeSender(), 0);
    },
    frameSize: 8,
    setFrameSize: (size) => {
        set({ frameSize: size, originalBits: randomBits(size) });
        setTimeout(() => get().computeSender(), 0);
    },

    parityType: 'even',
    setParityType: (type) => { set({ parityType: type }); get().computeSender(); },
    parityBit: 0,

    selectedGenerator: 0,
    setSelectedGenerator: (idx) => { set({ selectedGenerator: idx }); get().computeSender(); },
    senderFCS: [],
    senderSteps: [],

    channelBits: [],
    flipBit: (index) => {
        const bits = [...get().channelBits];
        bits[index] = (bits[index] === 0 ? 1 : 0) as Bit;
        set({ channelBits: bits });
        get().computeReceiver();
    },
    resetChannel: () => {
        get().computeSender();
    },

    receiverResult: { accept: true, flippedCount: 0 },

    computeSender: () => {
        const { mode, originalBits, parityType, selectedGenerator } = get();

        if (mode === 'parity') {
            const pb = computeParityBit(originalBits, parityType);
            const channelBits = [...originalBits, pb] as Bit[];
            set({ parityBit: pb, channelBits, senderFCS: [pb], senderSteps: [] });
        } else if (mode === 'crc') {
            const gen = CRC_GENERATORS[selectedGenerator].bits;
            const { fcs, steps } = computeCRC(originalBits, gen);
            const channelBits = [...originalBits, ...fcs] as Bit[];
            set({ senderFCS: fcs, senderSteps: steps, channelBits });
        } else {
            // Checksum — simplified
            const channelBits = [...originalBits];
            set({ channelBits, senderFCS: [], senderSteps: [] });
        }

        set({
            receiverResult: { accept: true, flippedCount: 0 },
        });
    },

    computeReceiver: () => {
        const { mode, originalBits, channelBits, parityType, selectedGenerator, senderFCS } = get();
        const fullOriginal = mode === 'parity'
            ? [...originalBits, computeParityBit(originalBits, parityType)]
            : mode === 'crc' ? [...originalBits, ...senderFCS] : [...originalBits];

        const flippedCount = countFlippedBits(fullOriginal, channelBits);

        if (mode === 'parity') {
            const data = channelBits.slice(0, -1);
            const pb = channelBits[channelBits.length - 1];
            const isValid = checkParity(data, pb, parityType);
            let parityWarning: string | undefined;
            if (!isValid) {
                parityWarning = undefined; // Error detected
            } else if (flippedCount === 2) {
                parityWarning = '⚠️ 2-bit error: Parity cannot detect this!';
            } else if (flippedCount > 2 && flippedCount % 2 === 0) {
                parityWarning = `⚠️ ${flippedCount}-bit error (even): Parity cannot detect!`;
            }
            set({
                receiverResult: {
                    accept: isValid && flippedCount === 0 ? true : isValid,
                    flippedCount,
                    parityWarning: parityWarning || (isValid ? undefined : undefined),
                },
            });
            // If parity check passes but there were flips (even number)
            if (isValid && flippedCount > 0 && flippedCount % 2 === 0) {
                set({
                    receiverResult: {
                        accept: true, // Parity thinks it's valid (limitation!)
                        flippedCount,
                        parityWarning: `⚠️ ${flippedCount}-bit error: Parity cannot detect this!`,
                    },
                });
            } else {
                set({
                    receiverResult: {
                        accept: isValid,
                        flippedCount,
                    },
                });
            }
        } else if (mode === 'crc') {
            const gen = CRC_GENERATORS[selectedGenerator].bits;
            const { isValid, remainder, steps } = verifyCRC(channelBits, gen);

            // Mark error steps
            const errorSteps = steps.map((s, i) => ({
                ...s,
                isError: get().senderSteps[i] ? JSON.stringify(s.xorResult) !== JSON.stringify(get().senderSteps[i].xorResult) : false,
            }));

            set({
                receiverResult: {
                    accept: isValid,
                    remainder,
                    steps: errorSteps,
                    flippedCount,
                },
            });
        } else {
            set({
                receiverResult: {
                    accept: flippedCount === 0,
                    flippedCount,
                },
            });
        }
    },
}));
