// src/modules/dataStructures/algorithms/selectionSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function selectionSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    for (let i = 0; i < a.length - 1; i++) {
        let minIdx = i;
        steps.push({ type: 'active', indices: [i], array: [...a], operationCount: ++ops, swapCount: swaps, description: `Finding minimum starting from index ${i}` });

        for (let j = i + 1; j < a.length; j++) {
            ops++;
            steps.push({ type: 'compare', indices: [minIdx, j], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[minIdx]} with ${a[j]}` });
            if (a[j] < a[minIdx]) {
                minIdx = j;
            }
        }

        if (minIdx !== i) {
            [a[i], a[minIdx]] = [a[minIdx], a[i]];
            swaps++;
            steps.push({ type: 'swap', indices: [i, minIdx], array: [...a], operationCount: ops, swapCount: swaps, description: `Swapping ${a[minIdx]} and ${a[i]}` });
        }

        steps.push({ type: 'sorted', indices: [i], array: [...a], operationCount: ops, swapCount: swaps, description: `Position ${i} finalized with value ${a[i]}` });
    }

    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
