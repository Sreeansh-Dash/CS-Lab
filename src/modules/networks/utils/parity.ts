// src/modules/networks/utils/parity.ts
import type { Bit } from '../../../types/network.types';

export function computeParityBit(data: Bit[], type: 'even' | 'odd'): Bit {
    const ones = data.filter((b) => b === 1).length;
    if (type === 'even') return (ones % 2 === 0 ? 0 : 1) as Bit;
    return (ones % 2 === 1 ? 0 : 1) as Bit;
}

export function checkParity(data: Bit[], parityBit: Bit, type: 'even' | 'odd'): boolean {
    const expected = computeParityBit(data, type);
    return expected === parityBit;
}

export function countFlippedBits(original: Bit[], received: Bit[]): number {
    let count = 0;
    for (let i = 0; i < original.length; i++) {
        if (original[i] !== received[i]) count++;
    }
    return count;
}
