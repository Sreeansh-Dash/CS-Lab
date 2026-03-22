// src/modules/dmgt/store/dmgtStore.ts
import { create } from 'zustand';
import type { SandboxObject, PredicateAST, EvaluationResult, PredicateType } from '../utils/predicateEvaluator';
import { evaluatePredicate } from '../utils/predicateEvaluator';

interface DMGTState {
    mode: 'freeExplore' | 'challenge';
    setMode: (mode: 'freeExplore' | 'challenge') => void;

    objects: SandboxObject[];
    addObject: (obj: Partial<SandboxObject>) => void;
    removeObject: (id: string) => void;
    randomizeObjects: () => void;
    clearObjects: () => void;

    // Expression / Block arrangement
    expression: PredicateAST | null;
    setExpression: (expr: PredicateAST | null) => void;
    quantifier: 'forall' | 'exists';
    setQuantifier: (q: 'forall' | 'exists') => void;
    selectedPredicate: PredicateType;
    setSelectedPredicate: (p: PredicateType) => void;

    // Evaluation
    evaluationResult: EvaluationResult | null;
    evaluate: () => void;

    // Challenge
    activePuzzleIndex: number;
    setActivePuzzle: (idx: number) => void;
}

let objIdCounter = 0;
const shapes: SandboxObject['shape'][] = ['circle', 'square', 'triangle', 'pentagon'];
const colors: SandboxObject['color'][] = ['blue', 'red', 'green', 'yellow'];
const sizes: SandboxObject['size'][] = ['small', 'medium', 'large'];

function randomObject(): SandboxObject {
    return {
        id: `obj-${++objIdCounter}`,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: sizes[Math.floor(Math.random() * sizes.length)],
    };
}

const initialObjects: SandboxObject[] = Array.from({ length: 6 }, () => randomObject());

export const useDMGTStore = create<DMGTState>((set, get) => ({
    mode: 'freeExplore',
    setMode: (mode) => set({ mode }),

    objects: initialObjects,
    addObject: (partial) => {
        const obj: SandboxObject = {
            id: `obj-${++objIdCounter}`,
            shape: partial.shape || 'circle',
            color: partial.color || 'blue',
            size: partial.size || 'medium',
        };
        set((s) => ({ objects: [...s.objects, obj] }));
    },
    removeObject: (id) => set((s) => ({ objects: s.objects.filter((o) => o.id !== id) })),
    randomizeObjects: () => {
        objIdCounter = 0;
        set({ objects: Array.from({ length: 6 + Math.floor(Math.random() * 4) }, () => randomObject()), evaluationResult: null });
    },
    clearObjects: () => set({ objects: [], evaluationResult: null }),

    expression: null,
    setExpression: (expr) => set({ expression: expr }),
    quantifier: 'forall',
    setQuantifier: (q) => set({ quantifier: q }),
    selectedPredicate: 'isBlue',
    setSelectedPredicate: (p) => set({ selectedPredicate: p }),

    evaluationResult: null,
    evaluate: () => {
        const { quantifier, selectedPredicate, objects } = get();
        const expression: PredicateAST = {
            type: quantifier,
            variable: 'x',
            children: [{ type: 'predicate', predicateName: selectedPredicate }],
        };
        const result = evaluatePredicate(expression, objects);
        set({ expression, evaluationResult: result });
    },

    activePuzzleIndex: 0,
    setActivePuzzle: (idx) => set({ activePuzzleIndex: idx }),
}));
