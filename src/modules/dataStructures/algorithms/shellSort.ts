// src/modules/dataStructures/algorithms/shellSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function shellSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;
    const n = a.length;

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        for (let i = gap; i < n; i++) {
            const temp = a[i];
            let j = i;
            ops++;
            steps.push({ type: 'active', indices: [i], array: [...a], operationCount: ops, swapCount: swaps, description: `Gap ${gap}: inserting ${temp} at index ${i}` });

            while (j >= gap) {
                ops++;
                steps.push({ type: 'compare', indices: [j - gap, j], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[j - gap]} and ${temp}` });
                if (a[j - gap] > temp) {
                    a[j] = a[j - gap];
                    swaps++;
                    steps.push({ type: 'swap', indices: [j, j - gap], array: [...a], operationCount: ops, swapCount: swaps, description: `Shift ${a[j - gap]} to position ${j}` });
                    j -= gap;
                } else {
                    break;
                }
            }
            a[j] = temp;
        }
    }

    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
