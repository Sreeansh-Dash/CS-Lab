// src/modules/pathfinding/algorithms/astar.ts
import type { GridCell, GridCoord, ExplorationStep, AlgorithmFn, HeuristicType } from '../../../types/graph.types';

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

function heuristicFn(a: GridCoord, b: GridCoord, type: HeuristicType = 'manhattan'): number {
    switch (type) {
        case 'manhattan':
            return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
        case 'euclidean':
            return Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2);
        case 'chebyshev':
            return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
        default:
            return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }
}

class MinHeap {
    private heap: { coord: GridCoord; f: number }[] = [];

    push(coord: GridCoord, f: number) {
        this.heap.push({ coord, f });
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): { coord: GridCoord; f: number } | undefined {
        if (this.heap.length === 0) return undefined;
        const min = this.heap[0];
        const last = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }
        return min;
    }

    get size() { return this.heap.length; }

    private bubbleUp(i: number) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (this.heap[parent].f <= this.heap[i].f) break;
            [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
            i = parent;
        }
    }

    private bubbleDown(i: number) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.heap[left].f < this.heap[smallest].f) smallest = left;
            if (right < n && this.heap[right].f < this.heap[smallest].f) smallest = right;
            if (smallest === i) break;
            [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
            i = smallest;
        }
    }
}

export const astar: AlgorithmFn = (grid, start, end, heuristic = 'manhattan') => {
    const steps: ExplorationStep[] = [];
    const gScore = new Map<string, number>();
    const parent = new Map<string, GridCoord>();
    const visited = new Set<string>();
    const pq = new MinHeap();
    let operationCount = 0;

    const startKey = coordKey(start);
    gScore.set(startKey, 0);
    pq.push(start, heuristicFn(start, end, heuristic));

    while (pq.size > 0) {
        const { coord: current } = pq.pop()!;
        const key = coordKey(current);
        operationCount++;

        if (visited.has(key)) continue;
        visited.add(key);

        steps.push({
            type: 'explore',
            node: current,
            algorithmId: 'astar',
        });

        if (current.row === end.row && current.col === end.col) break;

        const neighbors = getNeighbors(grid, current);
        for (const neighbor of neighbors) {
            const nKey = coordKey(neighbor);
            if (!visited.has(nKey)) {
                const weight = grid[neighbor.row][neighbor.col].weight || 1;
                const tentativeG = (gScore.get(key) ?? Infinity) + weight;
                const prevG = gScore.get(nKey);
                if (prevG === undefined || tentativeG < prevG) {
                    gScore.set(nKey, tentativeG);
                    parent.set(nKey, current);
                    const f = tentativeG + heuristicFn(neighbor, end, heuristic);
                    pq.push(neighbor, f);
                    operationCount++;
                }
            }
        }
    }

    // Reconstruct path
    const path: GridCoord[] = [];
    let cur: GridCoord | undefined = end;
    while (cur) {
        path.unshift(cur);
        if (cur.row === start.row && cur.col === start.col) break;
        cur = parent.get(coordKey(cur));
    }

    const validPath = path.length > 0 && path[0].row === start.row && path[0].col === start.col;

    if (validPath) {
        for (const node of path) {
            steps.push({ type: 'path', node, algorithmId: 'astar' });
        }
    }

    return {
        steps,
        path: validPath ? path : [],
        nodesExplored: visited.size,
        pathLength: validPath ? path.length : 0,
        operationCount,
    };
};
