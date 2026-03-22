// src/modules/dataStructures/algorithms/heapSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function heapSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;
    const n = a.length;

    function heapify(size: number, i: number) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < size) {
            ops++;
            steps.push({ type: 'compare', indices: [left, largest], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[left]} and ${a[largest]}` });
            if (a[left] > a[largest]) largest = left;
        }
        if (right < size) {
            ops++;
            steps.push({ type: 'compare', indices: [right, largest], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[right]} and ${a[largest]}` });
            if (a[right] > a[largest]) largest = right;
        }
        if (largest !== i) {
            [a[i], a[largest]] = [a[largest], a[i]];
            swaps++;
            steps.push({ type: 'swap', indices: [i, largest], array: [...a], operationCount: ops, swapCount: swaps, description: `Swap ${a[largest]} and ${a[i]}` });
            heapify(size, largest);
        }
    }

    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(n, i);
    }

    // Extract elements
    for (let i = n - 1; i > 0; i--) {
        [a[0], a[i]] = [a[i], a[0]];
        swaps++;
        steps.push({ type: 'swap', indices: [0, i], array: [...a], operationCount: ops, swapCount: swaps, description: `Move max ${a[i]} to position ${i}` });
        steps.push({ type: 'sorted', indices: [i], array: [...a], operationCount: ops, swapCount: swaps, description: `Position ${i} finalized` });
        heapify(i, 0);
    }

    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
