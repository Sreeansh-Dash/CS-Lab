// src/types/graph.types.ts

export interface GridCoord {
    row: number;
    col: number;
}

export type CellType = 'empty' | 'wall' | 'start' | 'end' | 'weighted';

export interface GridCell {
    row: number;
    col: number;
    type: CellType;
    weight: number;
}

export type AlgorithmId = 'bfs' | 'dfs' | 'dijkstra' | 'astar';
export type HeuristicType = 'manhattan' | 'euclidean' | 'chebyshev';

export interface ExplorationStep {
    type: 'explore' | 'path' | 'queue_update';
    node: GridCoord;
    algorithmId: AlgorithmId;
    queueSnapshot?: GridCoord[];
    distanceSnapshot?: Record<string, number>;
}

export type AlgorithmFn = (
    grid: GridCell[][],
    start: GridCoord,
    end: GridCoord,
    heuristic?: HeuristicType
) => {
    steps: ExplorationStep[];
    path: GridCoord[];
    nodesExplored: number;
    pathLength: number;
    operationCount: number;
};
