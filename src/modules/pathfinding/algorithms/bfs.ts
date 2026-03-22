// src/modules/pathfinding/algorithms/bfs.ts
import type { GridCell, GridCoord, ExplorationStep, AlgorithmFn } from '../../../types/graph.types';

function coordKey(coord: GridCoord): string {
    return `${coord.row},${coord.col}`;
}

function getNeighbors(grid: GridCell[][], coord: GridCoord): GridCoord[] {
    const { row, col } = coord;
    const rows = grid.length;
    const cols = grid[0].length;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const neighbors: GridCoord[] = [];

    for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== 'wall') {
            neighbors.push({ row: nr, col: nc });
        }
    }
    return neighbors;
}

export const bfs: AlgorithmFn = (grid, start, end) => {
    const steps: ExplorationStep[] = [];
    const visited = new Set<string>();
    const parent = new Map<string, GridCoord>();
    const queue: GridCoord[] = [start];
    visited.add(coordKey(start));
    let operationCount = 0;

    while (queue.length > 0) {
        const current = queue.shift()!;
        operationCount++;

        steps.push({
            type: 'explore',
            node: current,
            algorithmId: 'bfs',
            queueSnapshot: [...queue],
        });

        if (current.row === end.row && current.col === end.col) {
            break;
        }

        const neighbors = getNeighbors(grid, current);
        for (const neighbor of neighbors) {
            const key = coordKey(neighbor);
            if (!visited.has(key)) {
                visited.add(key);
                parent.set(key, current);
                queue.push(neighbor);
                operationCount++;
            }
        }
    }

    // Reconstruct path
    const path: GridCoord[] = [];
    let cur: GridCoord | undefined = end;
    while (cur) {
        path.unshift(cur);
        const key = coordKey(cur);
        if (cur.row === start.row && cur.col === start.col) break;
        cur = parent.get(key);
    }

    // Add path steps
    if (path.length > 0 && path[0].row === start.row && path[0].col === start.col) {
        for (const node of path) {
            steps.push({ type: 'path', node, algorithmId: 'bfs' });
        }
    }

    return {
        steps,
        path: path[0]?.row === start.row && path[0]?.col === start.col ? path : [],
        nodesExplored: visited.size,
        pathLength: path.length,
        operationCount,
    };
};
