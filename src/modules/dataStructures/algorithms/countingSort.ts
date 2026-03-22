// src/modules/dataStructures/algorithms/countingSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function countingSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    if (a.length === 0) return steps;

    const max = Math.max(...a);
    const count = new Array(max + 1).fill(0);

    // Count occurrences
    for (let i = 0; i < a.length; i++) {
        count[a[i]]++;
        ops++;
        steps.push({ type: 'active', indices: [i], array: [...a], operationCount: ops, swapCount: swaps, description: `Counting ${a[i]}` });
    }

    // Build sorted array
    let idx = 0;
    for (let i = 0; i <= max; i++) {
        while (count[i] > 0) {
            a[idx] = i;
            count[i]--;
            ops++;
            steps.push({ type: 'swap', indices: [idx], array: [...a], operationCount: ops, swapCount: swaps, description: `Placing ${i} at position ${idx}` });
            idx++;
        }
    }

    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
