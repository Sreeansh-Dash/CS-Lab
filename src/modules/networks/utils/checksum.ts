// src/modules/networks/utils/checksum.ts
import type { Bit } from '../../../types/network.types';

/**
 * Internet checksum: split into 16-bit words, compute ones' complement sum
 */
export interface ChecksumStep {
    words: number[];
    partialSums: number[];
    checksum: number;
    onesComplement: number;
}

export function computeChecksum(data: Bit[]): ChecksumStep {
    // Pad to multiple of 16
    const padded = [...data];
    while (padded.length % 16 !== 0) padded.push(0);

    // Split into 16-bit words
    const words: number[] = [];
    for (let i = 0; i < padded.length; i += 16) {
        let word = 0;
        for (let j = 0; j < 16; j++) {
            word = (word << 1) | padded[i + j];
        }
        words.push(word);
    }

    // Sum with carry wraparound
    const partialSums: number[] = [];
    let sum = 0;
    for (const word of words) {
        sum += word;
        // Wrap carry
        while (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        partialSums.push(sum);
    }

    // Ones' complement
    const onesComplement = (~sum) & 0xFFFF;

    return { words, partialSums, checksum: sum, onesComplement };
}

export function verifyChecksum(data: Bit[], checksum: Bit[]): boolean {
    // Combine data + checksum and compute sum
    const combined = [...data, ...checksum];
    const result = computeChecksum(combined);
    return result.onesComplement === 0;
}
