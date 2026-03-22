// src/modules/os/store/osStore.ts
import { create } from 'zustand';
import type { RAGNode, RAGEdge, DeadlockResult } from '../../../types/os.types';
import { detectDeadlock } from '../utils/cycleDetector';

interface OSState {
    nodes: RAGNode[];
    edges: RAGEdge[];
    selectedNodeId: string | null;

    drawMode: 'select' | 'draw';
    edgeType: 'request' | 'assignment';
    setDrawMode: (mode: 'select' | 'draw') => void;
    setEdgeType: (type: 'request' | 'assignment') => void;

    drawingFrom: string | null;
    setDrawingFrom: (id: string | null) => void;

    addProcess: (x: number, y: number) => void;
    addResource: (x: number, y: number, instances?: number) => void;
    addEdge: (from: string, to: string) => void;
    removeNode: (id: string) => void;
    removeEdge: (id: string) => void;
    selectNode: (id: string | null) => void;
    moveNode: (id: string, x: number, y: number) => void;
    updateResourceInstances: (id: string, instances: number) => void;
    clearAll: () => void;

    // Deadlock
    deadlockResult: DeadlockResult;
    runDetection: () => void;

    // Demo scenarios
    loadDemo: (scenario: string) => void;
}

let processCounter = 0;
let resourceCounter = 0;
let edgeCounter = 0;

const emptyDeadlock: DeadlockResult = {
    hasDeadlock: false,
    cycles: [],
    coffmanConditions: { mutualExclusion: false, holdAndWait: false, noPreemption: true, circularWait: false },
};

export const useOSStore = create<OSState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    drawMode: 'draw',
    edgeType: 'request',
    setDrawMode: (mode) => set({ drawMode: mode }),
    setEdgeType: (type) => set({ edgeType: type }),

    drawingFrom: null,
    setDrawingFrom: (id) => set({ drawingFrom: id }),

    addProcess: (x, y) => {
        const id = `P${++processCounter}`;
        set((s) => ({
            nodes: [...s.nodes, { id, type: 'process' as const, label: id, x, y }],
        }));
        get().runDetection();
    },

    addResource: (x, y, instances = 1) => {
        const id = `R${++resourceCounter}`;
        set((s) => ({
            nodes: [...s.nodes, { id, type: 'resource' as const, label: id, x, y, instances, assignedInstances: 0 }],
        }));
        get().runDetection();
    },

    addEdge: (from, to) => {
        const { nodes, edges, edgeType } = get();
        const fromNode = nodes.find((n) => n.id === from);
        const toNode = nodes.find((n) => n.id === to);
        if (!fromNode || !toNode) return;

        // Validate edge direction
        if (edgeType === 'request' && fromNode.type !== 'process') return;
        if (edgeType === 'request' && toNode.type !== 'resource') return;
        if (edgeType === 'assignment' && fromNode.type !== 'resource') return;
        if (edgeType === 'assignment' && toNode.type !== 'process') return;

        // No duplicates
        const exists = edges.some((e) => e.from === from && e.to === to && e.type === edgeType);
        if (exists) return;

        const id = `edge-${++edgeCounter}`;
        set((s) => ({
            edges: [...s.edges, { id, from, to, type: edgeType }],
        }));
        get().runDetection();
    },

    removeNode: (id) => {
        set((s) => ({
            nodes: s.nodes.filter((n) => n.id !== id),
            edges: s.edges.filter((e) => e.from !== id && e.to !== id),
            selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        }));
        get().runDetection();
    },

    removeEdge: (id) => {
        set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
        get().runDetection();
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    moveNode: (id, x, y) => {
        set((s) => ({
            nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
        }));
    },

    updateResourceInstances: (id, instances) => {
        set((s) => ({
            nodes: s.nodes.map((n) => (n.id === id && n.type === 'resource' ? { ...n, instances } : n)),
        }));
        get().runDetection();
    },

    clearAll: () => {
        processCounter = 0;
        resourceCounter = 0;
        edgeCounter = 0;
        set({ nodes: [], edges: [], selectedNodeId: null, drawingFrom: null, deadlockResult: emptyDeadlock });
    },

    deadlockResult: emptyDeadlock,
    runDetection: () => {
        const { nodes, edges } = get();
        const result = detectDeadlock({ nodes, edges });
        set({ deadlockResult: result });
    },

    loadDemo: (scenario) => {
        processCounter = 0;
        resourceCounter = 0;
        edgeCounter = 0;

        switch (scenario) {
            case 'classic': {
                const nodes: RAGNode[] = [
                    { id: 'P1', type: 'process', label: 'P1', x: 100, y: 100 },
                    { id: 'P2', type: 'process', label: 'P2', x: 400, y: 100 },
                    { id: 'R1', type: 'resource', label: 'R1', x: 250, y: 50, instances: 1 },
                    { id: 'R2', type: 'resource', label: 'R2', x: 250, y: 200, instances: 1 },
                ];
                const edges: RAGEdge[] = [
                    { id: 'e1', from: 'P1', to: 'R1', type: 'request' },
                    { id: 'e2', from: 'R1', to: 'P2', type: 'assignment' },
                    { id: 'e3', from: 'P2', to: 'R2', type: 'request' },
                    { id: 'e4', from: 'R2', to: 'P1', type: 'assignment' },
                ];
                processCounter = 2;
                resourceCounter = 2;
                edgeCounter = 4;
                set({ nodes, edges, selectedNodeId: null });
                break;
            }
            case 'safe': {
                const nodes: RAGNode[] = [
                    { id: 'P1', type: 'process', label: 'P1', x: 100, y: 100 },
                    { id: 'P2', type: 'process', label: 'P2', x: 300, y: 100 },
                    { id: 'P3', type: 'process', label: 'P3', x: 500, y: 100 },
                    { id: 'R1', type: 'resource', label: 'R1', x: 200, y: 250, instances: 2 },
                    { id: 'R2', type: 'resource', label: 'R2', x: 400, y: 250, instances: 1 },
                ];
                const edges: RAGEdge[] = [
                    { id: 'e1', from: 'R1', to: 'P1', type: 'assignment' },
                    { id: 'e2', from: 'P2', to: 'R1', type: 'request' },
                    { id: 'e3', from: 'R2', to: 'P3', type: 'assignment' },
                ];
                processCounter = 3;
                resourceCounter = 2;
                edgeCounter = 3;
                set({ nodes, edges, selectedNodeId: null });
                break;
            }
            default:
                break;
        }
        setTimeout(() => get().runDetection(), 0);
    },
}));
