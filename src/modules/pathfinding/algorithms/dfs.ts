// src/modules/pathfinding/algorithms/dfs.ts
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

export const dfs: AlgorithmFn = (grid, start, end) => {
    const steps: ExplorationStep[] = [];
    const visited = new Set<string>();
    const parent = new Map<string, GridCoord>();
    const stack: GridCoord[] = [start];
    let operationCount = 0;
    let found = false;

    while (stack.length > 0) {
        const current = stack.pop()!;
        const key = coordKey(current);
        operationCount++;

        if (visited.has(key)) continue;
        visited.add(key);

        steps.push({
            type: 'explore',
            node: current,
            algorithmId: 'dfs',
            queueSnapshot: [...stack],
        });

        if (current.row === end.row && current.col === end.col) {
            found = true;
            break;
        }

        const neighbors = getNeighbors(grid, current);
        for (const neighbor of neighbors) {
            const nKey = coordKey(neighbor);
            if (!visited.has(nKey)) {
                parent.set(nKey, current);
                stack.push(neighbor);
                operationCount++;
            }
        }
    }

    // Reconstruct path
    const path: GridCoord[] = [];
    if (found) {
        let cur: GridCoord | undefined = end;
        while (cur) {
            path.unshift(cur);
            if (cur.row === start.row && cur.col === start.col) break;
            cur = parent.get(coordKey(cur));
        }
    }

    for (const node of path) {
        steps.push({ type: 'path', node, algorithmId: 'dfs' });
    }

    return {
        steps,
        path,
        nodesExplored: visited.size,
        pathLength: path.length,
        operationCount,
    };
};
