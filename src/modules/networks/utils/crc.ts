// src/modules/networks/utils/crc.ts
import type { Bit, DivisionStep } from '../../../types/network.types';

/**
 * CRC computation via polynomial long division (XOR-based modulo-2 division)
 * Returns the FCS (Frame Check Sequence) and step-by-step division trace
 */
export function computeCRC(
    data: Bit[],
    generator: Bit[]
): { fcs: Bit[]; steps: DivisionStep[] } {
    const steps: DivisionStep[] = [];
    const degreeG = generator.length - 1;

    // Append zeros to data (degree of generator - 1)
    const dividend = [...data, ...new Array(degreeG).fill(0)] as Bit[];
    const working = [...dividend];

    let stepNumber = 0;

    for (let i = 0; i <= data.length - 1; i++) {
        if (working[i] === 1) {
            const xorResult: Bit[] = [];
            for (let j = 0; j < generator.length; j++) {
                working[i + j] = (working[i + j] ^ generator[j]) as Bit;
                xorResult.push(working[i + j]);
            }

            steps.push({
                stepNumber: ++stepNumber,
                dividend: [...working],
                divisor: [...generator],
                xorResult,
                position: i,
                isError: false,
            });
        }
    }

    // FCS = last (degreeG) bits of working
    const fcs = working.slice(working.length - degreeG) as Bit[];

    return { fcs, steps };
}

/**
 * Verify CRC: append FCS to data, divide by generator, remainder should be zero
 */
export function verifyCRC(
    dataWithFCS: Bit[],
    generator: Bit[]
): { isValid: boolean; remainder: Bit[]; steps: DivisionStep[] } {
    const degreeG = generator.length - 1;
    const working = [...dataWithFCS];
    const steps: DivisionStep[] = [];
    let stepNumber = 0;

    for (let i = 0; i <= working.length - generator.length; i++) {
        if (working[i] === 1) {
            const xorResult: Bit[] = [];
            for (let j = 0; j < generator.length; j++) {
                working[i + j] = (working[i + j] ^ generator[j]) as Bit;
                xorResult.push(working[i + j]);
            }

            steps.push({
                stepNumber: ++stepNumber,
                dividend: [...working],
                divisor: [...generator],
                xorResult,
                position: i,
                isError: false,
            });
        }
    }

    const remainder = working.slice(working.length - degreeG) as Bit[];
    const isValid = remainder.every((b) => b === 0);

    return { isValid, remainder, steps };
}

/** Common CRC generator polynomials */
export const CRC_GENERATORS: { name: string; polynomial: string; bits: Bit[] }[] = [
    { name: 'CRC-4', polynomial: 'x⁴+x+1', bits: [1, 0, 0, 1, 1] },
    { name: 'CRC-8', polynomial: 'x⁸+x²+x+1', bits: [1, 0, 0, 0, 0, 0, 1, 1, 1] },
];
