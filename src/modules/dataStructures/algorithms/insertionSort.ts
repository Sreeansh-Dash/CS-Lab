// src/modules/dataStructures/algorithms/insertionSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function insertionSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    for (let i = 1; i < a.length; i++) {
        const key = a[i];
        let j = i - 1;

        steps.push({ type: 'active', indices: [i], array: [...a], operationCount: ++ops, swapCount: swaps, description: `Picking element at index ${i} (value=${key})` });

        while (j >= 0 && a[j] > key) {
            steps.push({ type: 'compare', indices: [j, j + 1], array: [...a], operationCount: ++ops, swapCount: swaps, description: `Comparing ${a[j]} > ${key}` });
            a[j + 1] = a[j];
            swaps++;
            steps.push({ type: 'swap', indices: [j, j + 1], array: [...a], operationCount: ops, swapCount: swaps, description: `Shifting ${a[j]} right` });
            j--;
        }
        a[j + 1] = key;
        steps.push({ type: 'sorted', indices: [j + 1], array: [...a], operationCount: ops, swapCount: swaps, description: `Placed ${key} at index ${j + 1}` });
    }

    // Mark all sorted
    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
