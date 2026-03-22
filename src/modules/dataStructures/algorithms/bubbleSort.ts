// src/modules/dataStructures/algorithms/bubbleSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function bubbleSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    for (let i = 0; i < a.length - 1; i++) {
        let swapped = false;
        for (let j = 0; j < a.length - i - 1; j++) {
            ops++;
            steps.push({ type: 'compare', indices: [j, j + 1], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[j]} and ${a[j + 1]}` });

            if (a[j] > a[j + 1]) {
                [a[j], a[j + 1]] = [a[j + 1], a[j]];
                swaps++;
                swapped = true;
                steps.push({ type: 'swap', indices: [j, j + 1], array: [...a], operationCount: ops, swapCount: swaps, description: `Swapping ${a[j + 1]} and ${a[j]}` });
            }
        }

        steps.push({ type: 'sorted', indices: [a.length - i - 1], array: [...a], operationCount: ops, swapCount: swaps, description: `Position ${a.length - i - 1} finalized` });

        if (!swapped) break;
    }

    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
