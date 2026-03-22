// src/types/network.types.ts

export type Bit = 0 | 1;

export type ErrorDetectionMode = 'parity' | 'checksum' | 'crc';
export type ParityType = 'even' | 'odd';

export interface DivisionStep {
    stepNumber: number;
    dividend: Bit[];
    divisor: Bit[];
    xorResult: Bit[];
    position: number;
    isError: boolean;
}

export interface BitGridProps {
    bits: Bit[];
    label: string;
    editable: boolean;
    onBitFlip?: (index: number) => void;
    highlightIndices?: number[];
    highlightColor?: string;
}

export interface GeneratorPolynomial {
    name: string;
    polynomial: string;
    bits: Bit[];
}
