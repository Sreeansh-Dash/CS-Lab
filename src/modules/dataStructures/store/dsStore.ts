// src/modules/dataStructures/store/dsStore.ts
import { create } from 'zustand';
import type { StepLogEntry, SortAlgorithmId } from '../../../types/algorithm.types';

export interface LinkedListNode {
    id: string;
    address: string;
    data: number;
    nextId: string | null;
}

interface LLAnimationStep {
    type: 'traverse' | 'insert' | 'delete' | 'relink' | 'done';
    description: string;
    targetNodeId?: string;
    newNodeId?: string;
}


interface DSState {
    // Sub-module mode
    activeSubModule: 'linkedList' | 'sorting';
    setActiveSubModule: (mode: 'linkedList' | 'sorting') => void;

    // Linked List
    nodes: LinkedListNode[];
    headId: string | null;
    heapPositions: Record<string, { x: number; y: number }>;
    llAnimationSteps: LLAnimationStep[];
    llCurrentStep: number;
    insertNode: (value: number, index: number) => void;
    deleteNode: (index: number) => void;
    reverseList: () => void;
    resetList: () => void;

    // Sorting
    sortArray: number[];
    sortArraySize: number;
    setSortArraySize: (size: number) => void;
    randomizeArray: () => void;
    activeAlgorithms: SortAlgorithmId[];
    toggleAlgorithm: (algo: SortAlgorithmId) => void;

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
    stepLog: StepLogEntry[];
}

let nodeIdCounter = 0;
function genId(): string { return `node-${++nodeIdCounter}`; }
function genAddr(): string {
    return '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
function genHeapPos(): { x: number; y: number } {
    return { x: 80 + Math.random() * 500, y: 60 + Math.random() * 250 };
}

function generateRandomArray(size: number): number[] {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 5);
}

export const useDSStore = create<DSState>((set, get) => ({
    activeSubModule: 'linkedList',
    setActiveSubModule: (mode) => set({ activeSubModule: mode }),

    // Linked List init with 3 nodes
    nodes: (() => {
        const n1 = { id: genId(), address: genAddr(), data: 42, nextId: '' };
        const n2 = { id: genId(), address: genAddr(), data: 17, nextId: '' };
        const n3 = { id: genId(), address: genAddr(), data: 99, nextId: null };
        n1.nextId = n2.id;
        n2.nextId = n3.id;
        return [n1, n2, n3] as LinkedListNode[];
    })(),
    headId: 'node-1',
    heapPositions: {
        'node-1': genHeapPos(),
        'node-2': genHeapPos(),
        'node-3': genHeapPos(),
    },
    llAnimationSteps: [],
    llCurrentStep: 0,

    insertNode: (value, index) => {
        const { nodes, headId, heapPositions } = get();
        const newNode: LinkedListNode = {
            id: genId(),
            address: genAddr(),
            data: value,
            nextId: null,
        };

        const newNodes = [...nodes];
        const newPositions = { ...heapPositions, [newNode.id]: genHeapPos() };

        if (index === 0) {
            newNode.nextId = headId;
            set({ nodes: [...newNodes, newNode], headId: newNode.id, heapPositions: newPositions });
        } else {
            // traverse to index-1
            let curr = headId;
            for (let i = 0; i < index - 1 && curr; i++) {
                const node = newNodes.find((n) => n.id === curr);
                curr = node?.nextId || null;
            }
            if (curr) {
                const prevNode = newNodes.find((n) => n.id === curr)!;
                newNode.nextId = prevNode.nextId;
                prevNode.nextId = newNode.id;
            }
            set({ nodes: [...newNodes, newNode], heapPositions: newPositions });
        }
    },

    deleteNode: (index) => {
        const { nodes, headId } = get();
        if (nodes.length === 0) return;

        const newNodes = nodes.map((n) => ({ ...n }));
        if (index === 0) {
            const head = newNodes.find((n) => n.id === headId);
            if (head) {
                set({
                    nodes: newNodes.filter((n) => n.id !== headId),
                    headId: head.nextId,
                });
            }
        } else {
            let curr = headId;
            for (let i = 0; i < index - 1 && curr; i++) {
                const node = newNodes.find((n) => n.id === curr);
                curr = node?.nextId || null;
            }
            if (curr) {
                const prevNode = newNodes.find((n) => n.id === curr);
                const target = prevNode ? newNodes.find((n) => n.id === prevNode.nextId) : null;
                if (prevNode && target) {
                    prevNode.nextId = target.nextId;
                    set({ nodes: newNodes.filter((n) => n.id !== target.id) });
                }
            }
        }
    },

    reverseList: () => {
        const { nodes, headId } = get();
        const newNodes = nodes.map((n) => ({ ...n }));
        let prev: string | null = null;
        let curr = headId;
        let newHead = headId;

        while (curr) {
            const node = newNodes.find((n) => n.id === curr)!;
            const next = node.nextId;
            node.nextId = prev;
            prev = curr;
            newHead = curr;
            curr = next;
        }

        set({ nodes: newNodes, headId: newHead });
    },

    resetList: () => {
        nodeIdCounter = 0;
        const n1 = { id: genId(), address: genAddr(), data: 42, nextId: '' };
        const n2 = { id: genId(), address: genAddr(), data: 17, nextId: '' };
        const n3 = { id: genId(), address: genAddr(), data: 99, nextId: null };
        n1.nextId = n2.id;
        n2.nextId = n3.id;
        set({
            nodes: [n1, n2, n3],
            headId: n1.id,
            heapPositions: { [n1.id]: genHeapPos(), [n2.id]: genHeapPos(), [n3.id]: genHeapPos() },
        });
    },

    // Sorting
    sortArray: generateRandomArray(20),
    sortArraySize: 20,
    setSortArraySize: (size) => set({ sortArraySize: size, sortArray: generateRandomArray(size) }),
    randomizeArray: () => set((s) => ({ sortArray: generateRandomArray(s.sortArraySize) })),
    activeAlgorithms: ['insertion', 'selection'],
    toggleAlgorithm: (algo) => set((s) => ({
        activeAlgorithms: s.activeAlgorithms.includes(algo)
            ? s.activeAlgorithms.filter((a) => a !== algo)
            : [...s.activeAlgorithms, algo],
    })),

    // Playback
    isPlaying: false,
    currentStep: 0,
    totalSteps: 0,
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stepForward: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps - 1) })),
    stepBackward: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
    reset: () => set({ currentStep: 0, isPlaying: false }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setTotalSteps: (total) => set({ totalSteps: total }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    stepLog: [],
}));
