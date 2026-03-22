// src/modules/dataStructures/algorithms/radixSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function radixSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    if (a.length === 0) return steps;

    const max = Math.max(...a);
    let exp = 1;

    while (Math.floor(max / exp) > 0) {
        const output = new Array(a.length);
        const count = new Array(10).fill(0);

        // Count digits
        for (let i = 0; i < a.length; i++) {
            const digit = Math.floor(a[i] / exp) % 10;
            count[digit]++;
            ops++;
            steps.push({ type: 'active', indices: [i], array: [...a], operationCount: ops, swapCount: swaps, description: `Digit ${digit} of ${a[i]} (place ${exp})` });
        }

        // Cumulative count
        for (let i = 1; i < 10; i++) count[i] += count[i - 1];

        // Build output
        for (let i = a.length - 1; i >= 0; i--) {
            const digit = Math.floor(a[i] / exp) % 10;
            output[count[digit] - 1] = a[i];
            count[digit]--;
        }

        for (let i = 0; i < a.length; i++) {
            a[i] = output[i];
            swaps++;
            steps.push({ type: 'swap', indices: [i], array: [...a], operationCount: ops, swapCount: swaps, description: `Place ${a[i]} at position ${i}` });
        }

        exp *= 10;
    }

    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
