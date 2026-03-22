// src/modules/pathfinding/algorithms/dijkstra.ts
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

// Simple priority queue
class MinHeap {
    private heap: { coord: GridCoord; dist: number }[] = [];

    push(coord: GridCoord, dist: number) {
        this.heap.push({ coord, dist });
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): { coord: GridCoord; dist: number } | undefined {
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
            if (this.heap[parent].dist <= this.heap[i].dist) break;
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
            if (left < n && this.heap[left].dist < this.heap[smallest].dist) smallest = left;
            if (right < n && this.heap[right].dist < this.heap[smallest].dist) smallest = right;
            if (smallest === i) break;
            [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
            i = smallest;
        }
    }
}

export const dijkstra: AlgorithmFn = (grid, start, end) => {
    const steps: ExplorationStep[] = [];
    const dist = new Map<string, number>();
    const parent = new Map<string, GridCoord>();
    const visited = new Set<string>();
    const pq = new MinHeap();
    let operationCount = 0;

    dist.set(coordKey(start), 0);
    pq.push(start, 0);

    while (pq.size > 0) {
        const { coord: current, dist: currentDist } = pq.pop()!;
        const key = coordKey(current);
        operationCount++;

        if (visited.has(key)) continue;
        visited.add(key);

        // Build distance snapshot
        const distSnapshot: Record<string, number> = {};
        dist.forEach((v, k) => { distSnapshot[k] = v; });

        steps.push({
            type: 'explore',
            node: current,
            algorithmId: 'dijkstra',
            distanceSnapshot: distSnapshot,
        });

        if (current.row === end.row && current.col === end.col) break;

        const neighbors = getNeighbors(grid, current);
        for (const neighbor of neighbors) {
            const nKey = coordKey(neighbor);
            if (!visited.has(nKey)) {
                const weight = grid[neighbor.row][neighbor.col].weight || 1;
                const newDist = currentDist + weight;
                const prevDist = dist.get(nKey);
                if (prevDist === undefined || newDist < prevDist) {
                    dist.set(nKey, newDist);
                    parent.set(nKey, current);
                    pq.push(neighbor, newDist);
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
            steps.push({ type: 'path', node, algorithmId: 'dijkstra' });
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
