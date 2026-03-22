// src/modules/pathfinding/store/pathfindingStore.ts
import { create } from 'zustand';
import type { StepLogEntry } from '../../../types/algorithm.types';
import type { GridCell, GridCoord, AlgorithmId, HeuristicType, ExplorationStep } from '../../../types/graph.types';

export type DrawMode = 'wall' | 'erase' | 'weight' | 'start' | 'end';

interface AlgorithmResult {
    algorithmId: AlgorithmId;
    steps: ExplorationStep[];
    path: GridCoord[];
    nodesExplored: number;
    pathLength: number;
    operationCount: number;
}

interface PathfindingState {
    // Grid
    gridSize: number;
    grid: GridCell[][];
    startPos: GridCoord;
    endPos: GridCoord;
    setGridSize: (size: number) => void;
    initGrid: (size?: number) => void;
    setCellType: (row: number, col: number, type: GridCell['type'], weight?: number) => void;
    setStartPos: (pos: GridCoord) => void;
    setEndPos: (pos: GridCoord) => void;

    // Drawing
    drawMode: DrawMode;
    setDrawMode: (mode: DrawMode) => void;
    weightValue: number;
    setWeightValue: (val: number) => void;

    // Algorithm
    selectedAlgorithm: AlgorithmId;
    setSelectedAlgorithm: (algo: AlgorithmId) => void;
    heuristic: HeuristicType;
    setHeuristic: (h: HeuristicType) => void;
    raceMode: boolean;
    toggleRaceMode: () => void;

    // Results
    results: AlgorithmResult[];
    setResults: (results: AlgorithmResult[]) => void;

    // Playback
    isPlaying: boolean;
    currentStep: number;
    totalSteps: number;
    play: () => void;
    pause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    reset: () => void;
    setCurrentStep: (step: number) => void;
    setTotalSteps: (total: number) => void;
    setIsPlaying: (playing: boolean) => void;

    // Step log
    stepLog: StepLogEntry[];
    setStepLog: (log: StepLogEntry[]) => void;
}

function createEmptyGrid(size: number): GridCell[][] {
    return Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => ({
            row,
            col,
            type: 'empty' as const,
            weight: 1,
        }))
    );
}

export const usePathfindingStore = create<PathfindingState>((set, get) => ({
    gridSize: 20,
    grid: createEmptyGrid(20),
    startPos: { row: 2, col: 2 },
    endPos: { row: 17, col: 17 },

    setGridSize: (size) => {
        const grid = createEmptyGrid(size);
        set({
            gridSize: size,
            grid,
            startPos: { row: 1, col: 1 },
            endPos: { row: size - 2, col: size - 2 },
            results: [],
            currentStep: 0,
            totalSteps: 0,
            isPlaying: false,
            stepLog: [],
        });
    },

    initGrid: (size) => {
        const s = size || get().gridSize;
        set({
            grid: createEmptyGrid(s),
            gridSize: s,
            startPos: { row: 1, col: 1 },
            endPos: { row: s - 2, col: s - 2 },
            results: [],
            currentStep: 0,
            totalSteps: 0,
            isPlaying: false,
            stepLog: [],
        });
    },

    setCellType: (row, col, type, weight) => {
        const grid = get().grid.map((r) => r.map((c) => ({ ...c })));
        if (grid[row] && grid[row][col]) {
            grid[row][col].type = type;
            if (weight !== undefined) grid[row][col].weight = weight;
        }
        set({ grid });
    },

    setStartPos: (pos) => set({ startPos: pos }),
    setEndPos: (pos) => set({ endPos: pos }),

    drawMode: 'wall',
    setDrawMode: (mode) => set({ drawMode: mode }),
    weightValue: 5,
    setWeightValue: (val) => set({ weightValue: val }),

    selectedAlgorithm: 'bfs',
    setSelectedAlgorithm: (algo) => set({ selectedAlgorithm: algo }),
    heuristic: 'manhattan',
    setHeuristic: (h) => set({ heuristic: h }),
    raceMode: false,
    toggleRaceMode: () => set((s) => ({ raceMode: !s.raceMode })),

    results: [],
    setResults: (results) => set({ results }),

    isPlaying: false,
    currentStep: 0,
    totalSteps: 0,
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stepForward: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps - 1) })),
    stepBackward: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
    reset: () => set({ currentStep: 0, isPlaying: false, results: [], stepLog: [] }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setTotalSteps: (total) => set({ totalSteps: total }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    stepLog: [],
    setStepLog: (log) => set({ stepLog: log }),
}));
