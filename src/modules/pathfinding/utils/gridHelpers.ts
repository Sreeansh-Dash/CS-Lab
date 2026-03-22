// src/modules/pathfinding/utils/gridHelpers.ts
import type { GridCoord } from '../../../types/graph.types';

export function coordKey(coord: GridCoord): string {
    return `${coord.row},${coord.col}`;
}

export function getCellColor(
    type: string,
    weight: number = 1,
): string {
    switch (type) {
        case 'wall': return '#172035';
        case 'start': return '#10B981';
        case 'end': return '#F43F5E';
        case 'weighted': {
            const t = (weight - 1) / 9;
            return `rgba(77, 124, 254, ${0.12 + t * 0.45})`;
        }
        default: return 'transparent';
    }
}

export function getAlgorithmColor(algorithmId: string): string {
    switch (algorithmId) {
        case 'bfs': return '#4D7CFE';
        case 'dfs': return '#F59E0B';
        case 'dijkstra': return '#8B5CF6';
        case 'astar': return '#F43F5E';
        default: return '#4D7CFE';
    }
}

export function getAlgorithmLabel(algorithmId: string): string {
    switch (algorithmId) {
        case 'bfs': return 'BFS';
        case 'dfs': return 'DFS';
        case 'dijkstra': return 'Dijkstra';
        case 'astar': return 'A*';
        default: return algorithmId;
    }
}
