// src/types/os.types.ts

export type NodeType = 'process' | 'resource';
export type EdgeType = 'request' | 'assignment';
export type DeadlockStatus = 'safe' | 'potential' | 'deadlock';

export interface RAGNode {
    id: string;
    type: NodeType;
    label: string;
    x: number;
    y: number;
    instances?: number;        // For resources: total instances
    assignedInstances?: number; // For resources: assigned instances
}

export interface RAGEdge {
    id: string;
    from: string;
    to: string;
    type: EdgeType;
}

export interface RAGGraph {
    nodes: RAGNode[];
    edges: RAGEdge[];
}

export interface CoffmanConditions {
    mutualExclusion: boolean;
    holdAndWait: boolean;
    noPreemption: boolean;
    circularWait: boolean;
}

export interface DeadlockResult {
    hasDeadlock: boolean;
    cycles: string[][];
    coffmanConditions: CoffmanConditions;
    safeSequence?: string[];
}
