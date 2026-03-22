// src/modules/det/utils/fft.ts

/**
 * Iterative Cooley-Tukey FFT on 2^N-padded signal
 * Returns magnitude spectrum bins
 */
export function computeFFT(signal: number[], sampleRate: number = 1024): { frequency: number; magnitude: number }[] {
    // Pad to next power of 2
    let N = 1;
    while (N < signal.length) N <<= 1;

    const re = new Float64Array(N);
    const im = new Float64Array(N);

    for (let i = 0; i < signal.length; i++) re[i] = signal[i];

    // Bit-reversal permutation
    for (let i = 1, j = 0; i < N; i++) {
        let bit = N >> 1;
        while (j & bit) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }

    // FFT butterfly stages
    for (let len = 2; len <= N; len <<= 1) {
        const angle = (-2 * Math.PI) / len;
        const wRe = Math.cos(angle);
        const wIm = Math.sin(angle);

        for (let i = 0; i < N; i += len) {
            let curRe = 1, curIm = 0;
            for (let j = 0; j < len / 2; j++) {
                const uRe = re[i + j];
                const uIm = im[i + j];
                const tRe = curRe * re[i + j + len / 2] - curIm * im[i + j + len / 2];
                const tIm = curRe * im[i + j + len / 2] + curIm * re[i + j + len / 2];

                re[i + j] = uRe + tRe;
                im[i + j] = uIm + tIm;
                re[i + j + len / 2] = uRe - tRe;
                im[i + j + len / 2] = uIm - tIm;

                const newRe = curRe * wRe - curIm * wIm;
                const newIm = curRe * wIm + curIm * wRe;
                curRe = newRe;
                curIm = newIm;
            }
        }
    }

    // Convert to magnitude spectrum
    const bins: { frequency: number; magnitude: number }[] = [];
    const freqResolution = sampleRate / N;

    for (let i = 0; i < N / 2; i++) {
        const magnitude = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / N * 2;
        bins.push({
            frequency: i * freqResolution,
            magnitude,
        });
    }

    return bins;
}

/**
 * Generate a composite signal from wave channels
 */
export function generateSignal(
    channels: { frequency: number; amplitude: number; phase: number }[],
    numSamples: number = 2048,
    sampleRate: number = 1024
): number[] {
    const signal = new Array(numSamples).fill(0);
    const dt = 1 / sampleRate;

    for (let i = 0; i < numSamples; i++) {
        const t = i * dt;
        for (const ch of channels) {
            signal[i] += ch.amplitude * Math.sin(2 * Math.PI * ch.frequency * t + (ch.phase * Math.PI) / 180);
        }
    }

    return signal;
}
