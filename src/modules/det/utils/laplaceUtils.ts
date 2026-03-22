// src/modules/det/utils/laplaceUtils.ts

export interface PoleZero {
    sigma: number;  // real part
    omega: number;  // imaginary part
    type: 'pole' | 'zero';
}

/**
 * Convert wave channels to pole positions in the s-plane
 * Each sine wave channel creates conjugate poles at s = -σ ± jω
 */
export function channelsToPoles(
    channels: { frequency: number; amplitude: number; damping: number }[]
): PoleZero[] {
    const poles: PoleZero[] = [];

    for (const ch of channels) {
        const omega = 2 * Math.PI * ch.frequency;
        const sigma = ch.damping || -0.1;

        // Conjugate pair
        poles.push({ sigma, omega, type: 'pole' });
        poles.push({ sigma, omega: -omega, type: 'pole' });
    }

    return poles;
}

/**
 * Compute the transfer function H(s) magnitude at a point in the s-plane
 */
export function transferFunctionMagnitude(
    sigma: number,
    omega: number,
    poles: PoleZero[],
    zeros: PoleZero[]
): number {
    let numMag = 1;
    let denMag = 1;

    for (const z of zeros) {
        const dSigma = sigma - z.sigma;
        const dOmega = omega - z.omega;
        numMag *= Math.sqrt(dSigma * dSigma + dOmega * dOmega);
    }

    for (const p of poles) {
        const dSigma = sigma - p.sigma;
        const dOmega = omega - p.omega;
        denMag *= Math.sqrt(dSigma * dSigma + dOmega * dOmega);
    }

    return denMag === 0 ? Infinity : numMag / denMag;
}
