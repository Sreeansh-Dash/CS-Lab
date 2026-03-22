// src/modules/networks/store/arqStore.ts
import { create } from 'zustand';

export type ARQProtocol = 'stop-and-wait' | 'go-back-n' | 'selective-repeat';

export interface Frame {
    id: number;
    seqNum: number;
    status: 'pending' | 'sending' | 'sent' | 'lost' | 'acked' | 'nak';
    sentAt?: number;
    ackAt?: number;
    isRetransmission: boolean;
}

export interface ARQState {
    protocol: ARQProtocol;
    windowSize: number;
    totalFrames: number;
    frames: Frame[];
    receiverBuffer: (number | null)[];
    timeElapsed: number;
    isPlaying: boolean;
    playbackSpeed: number;
    
    // Stats
    successfulFrames: number;
    retransmissions: number;
    efficiency: number;

    // Error injection
    errorRate: number; // 0-1
    injectErrorType: 'none' | 'data-loss' | 'ack-loss';

    // Actions
    setProtocol: (p: ARQProtocol) => void;
    setWindowSize: (size: number) => void;
    setTotalFrames: (total: number) => void;
    setErrorRate: (rate: number) => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
    tick: () => void;
}

const createInitialFrames = (total: number): Frame[] => {
    return Array.from({ length: total }, (_, i) => ({
        id: i,
        seqNum: i,
        status: 'pending',
        isRetransmission: false,
    }));
};

export const useARQStore = create<ARQState>()((set) => ({
    protocol: 'go-back-n',
    windowSize: 4,
    totalFrames: 20,
    frames: createInitialFrames(20),
    receiverBuffer: [],
    timeElapsed: 0,
    isPlaying: false,
    playbackSpeed: 1,
    successfulFrames: 0,
    retransmissions: 0,
    efficiency: 100,
    errorRate: 0.1,
    injectErrorType: 'none',

    setProtocol: (protocol) => set((state) => {
        const ws = protocol === 'stop-and-wait' ? 1 : state.windowSize;
        return {
            protocol,
            windowSize: ws,
            frames: createInitialFrames(state.totalFrames),
            receiverBuffer: [],
            timeElapsed: 0,
            isPlaying: false,
            successfulFrames: 0,
            retransmissions: 0,
            efficiency: 100,
        };
    }),

    setWindowSize: (windowSize) => set((state) => ({
        windowSize: state.protocol === 'stop-and-wait' ? 1 : Math.max(1, Math.min(8, windowSize)),
        frames: createInitialFrames(state.totalFrames),
        receiverBuffer: [],
        timeElapsed: 0,
        isPlaying: false,
        successfulFrames: 0,
        retransmissions: 0,
        efficiency: 100,
    })),

    setTotalFrames: (totalFrames) => set({
        totalFrames,
        frames: createInitialFrames(totalFrames),
        receiverBuffer: [],
        timeElapsed: 0,
        isPlaying: false,
        successfulFrames: 0,
        retransmissions: 0,
        efficiency: 100,
    }),

    setErrorRate: (errorRate) => set({ errorRate }),

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    
    reset: () => set((state) => ({
        frames: createInitialFrames(state.totalFrames),
        receiverBuffer: [],
        timeElapsed: 0,
        isPlaying: false,
        successfulFrames: 0,
        retransmissions: 0,
        efficiency: 100,
    })),

    tick: () => set((state) => {
        if (!state.isPlaying) return state;

        const time = state.timeElapsed + 1;
        let newFrames = [...state.frames];
        let newBuffer = [...state.receiverBuffer];
        let { successfulFrames, retransmissions } = state;
        const RTT = 10; // Round trip time in ticks
        const TIMEOUT = 15;

        // 1. Process existing frames in transit
        newFrames = newFrames.map(f => {
            if (f.status === 'sending') {
                if (time - (f.sentAt || 0) >= RTT / 2) {
                    // Reached receiver
                    if (Math.random() < state.errorRate) {
                        return { ...f, status: 'lost' };
                    }
                    if (!newBuffer.includes(f.seqNum)) {
                        newBuffer.push(f.seqNum);
                    }
                    return { ...f, status: 'sent', ackAt: time + RTT / 2 };
                }
            } else if (f.status === 'sent') {
                if (time >= (f.ackAt || Infinity)) {
                    // ACK received
                    if (Math.random() < state.errorRate) {
                        return { ...f, status: 'lost' }; // ACK lost
                    }
                    successfulFrames++;
                    return { ...f, status: 'acked' };
                }
            } else if (f.status === 'lost') {
                if (time - (f.sentAt || 0) >= TIMEOUT) {
                    // Timeout hit, requires retransmission handling
                    return { ...f, status: 'pending', isRetransmission: true };
                }
            }
            return f;
        });

        // 2. Protocol specific logic to send new frames
        const windowStart = newFrames.findIndex(f => f.status !== 'acked');
        if (windowStart !== -1) {
            if (state.protocol === 'stop-and-wait') {
                const head = newFrames[windowStart];
                if (head.status === 'pending') {
                    if (head.isRetransmission) retransmissions++;
                    newFrames[windowStart] = { ...head, status: 'sending', sentAt: time };
                }
            } else if (state.protocol === 'go-back-n') {
                // If the head timed out, we go back N
                const head = newFrames[windowStart];
                if (head.status === 'pending' && head.isRetransmission) {
                    for (let i = 0; i < state.windowSize; i++) {
                        const idx = windowStart + i;
                        if (idx < newFrames.length) {
                            retransmissions++;
                            newFrames[idx] = { ...newFrames[idx], status: 'sending', sentAt: time, isRetransmission: true };
                        }
                    }
                } else {
                    // Send any pending in window
                    for (let i = 0; i < state.windowSize; i++) {
                        const idx = windowStart + i;
                        if (idx < newFrames.length && newFrames[idx].status === 'pending') {
                            newFrames[idx] = { ...newFrames[idx], status: 'sending', sentAt: time };
                        }
                    }
                }
            } else if (state.protocol === 'selective-repeat') {
                // Only resend the lost frame
                for (let i = 0; i < state.windowSize; i++) {
                    const idx = windowStart + i;
                    if (idx < newFrames.length && newFrames[idx].status === 'pending') {
                        if (newFrames[idx].isRetransmission) retransmissions++;
                        newFrames[idx] = { ...newFrames[idx], status: 'sending', sentAt: time };
                    }
                }
            }
        }

        const eff = successfulFrames > 0 
            ? Math.round((successfulFrames / (successfulFrames + retransmissions)) * 100) 
            : 100;

        // Auto-pause if all acked
        const allAcked = newFrames.every(f => f.status === 'acked');

        return {
            frames: newFrames,
            receiverBuffer: newBuffer,
            timeElapsed: time,
            successfulFrames,
            retransmissions,
            efficiency: eff,
            isPlaying: allAcked ? false : state.isPlaying,
        };
    }),
}));
