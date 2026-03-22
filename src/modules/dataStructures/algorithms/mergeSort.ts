// src/modules/dataStructures/algorithms/mergeSort.ts
import type { SortStep } from '../../../types/algorithm.types';

export function mergeSort(arr: number[]): SortStep[] {
    const steps: SortStep[] = [];
    const a = [...arr];
    let ops = 0;
    let swaps = 0;

    function merge(left: number, mid: number, right: number) {
        const temp: number[] = [];
        let i = left, j = mid + 1;

        while (i <= mid && j <= right) {
            ops++;
            steps.push({ type: 'compare', indices: [i, j], array: [...a], operationCount: ops, swapCount: swaps, description: `Comparing ${a[i]} and ${a[j]}` });
            if (a[i] <= a[j]) {
                temp.push(a[i++]);
            } else {
                temp.push(a[j++]);
            }
        }

        while (i <= mid) temp.push(a[i++]);
        while (j <= right) temp.push(a[j++]);

        for (let k = 0; k < temp.length; k++) {
            a[left + k] = temp[k];
            swaps++;
        }

        steps.push({ type: 'swap', indices: Array.from({ length: right - left + 1 }, (_, k) => left + k), array: [...a], operationCount: ops, swapCount: swaps, description: `Merged range [${left}..${right}]` });
    }

    function sort(left: number, right: number) {
        if (left >= right) return;
        const mid = Math.floor((left + right) / 2);
        sort(left, mid);
        sort(mid + 1, right);
        merge(left, mid, right);
    }

    sort(0, a.length - 1);
    steps.push({ type: 'sorted', indices: a.map((_, i) => i), array: [...a], operationCount: ops, swapCount: swaps, description: 'Array sorted!' });
    return steps;
}
