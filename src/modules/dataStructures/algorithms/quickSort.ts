// src/modules/dataStructures/algorithms/quickSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function quickSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    function partition(lo: number, hi: number): number {
        const pivotVal = a[hi];
        steps.push({ type: 'active', indices: [hi], array: [...a], operationCount: ops, swapCount: swaps, description: `Pivot: ${pivotVal} at index ${hi}` });
        let i = lo - 1;

        for (let j = lo; j < hi; j++) {
            ops++;
            steps.push({ type: 'compare', indices: [j, hi], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[j]} with pivot ${pivotVal}` });
            if (a[j] <= pivotVal) {
                i++;
                if (i !== j) {
                    [a[i], a[j]] = [a[j], a[i]];
                    swaps++;
                    steps.push({ type: 'swap', indices: [i, j], array: [...a], operationCount: ops, swapCount: swaps, description: `Swap ${a[j]} and ${a[i]}` });
                }
            }
        }
        if (i + 1 !== hi) {
            [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
            swaps++;
            steps.push({ type: 'swap', indices: [i + 1, hi], array: [...a], operationCount: ops, swapCount: swaps, description: `Place pivot ${pivotVal} at position ${i + 1}` });
        }
        steps.push({ type: 'sorted', indices: [i + 1], array: [...a], operationCount: ops, swapCount: swaps, description: `Position ${i + 1} finalized` });
        return i + 1;
    }

    function sort(lo: number, hi: number) {
        if (lo < hi) {
            const p = partition(lo, hi);
            sort(lo, p - 1);
            sort(p + 1, hi);
        }
    }

    sort(0, a.length - 1);
    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
