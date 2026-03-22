// src/types/algorithm.types.ts

export interface StepLogEntry {
    step: number;
    description: string;
    highlightedNodes?: string[];
    highlightColor?: string;
}

export interface BaseModuleStore {
    isPlaying: boolean;
    currentStep: number;
    totalSteps: number;
    play: () => void;
    pause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    reset: () => void;
    stepLog: StepLogEntry[];
}

export type SortBarState =
    | 'default'
    | 'comparing'
    | 'swapping'
    | 'sorted'
    | 'pivot'
    | 'active'
    | 'heapify';

export interface SortStep {
    type: 'compare' | 'swap' | 'sorted' | 'active';
    indices: number[];
    array: number[];
    operationCount: number;
    swapCount: number;
    description: string;
}

export type SortAlgorithmId = 'insertion' | 'selection' | 'bubble' | 'merge' | 'heap' | 'counting' | 'radix' | 'quick' | 'shell';
