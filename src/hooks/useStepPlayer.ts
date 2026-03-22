// src/hooks/useStepPlayer.ts
import { useRef, useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

interface UseStepPlayerOptions {
    totalSteps: number;
    onStepChange?: (step: number) => void;
}

interface UseStepPlayerReturn {
    currentStep: number;
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    reset: () => void;
    setStep: (step: number) => void;
}

export function useStepPlayer(options: UseStepPlayerOptions): UseStepPlayerReturn {
    const { totalSteps, onStepChange } = options;
    const playbackSpeed = useAppStore((s) => s.playbackSpeed);

    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const currentStepRef = useRef(0);
    const isPlayingRef = useRef(false);

    const updateStep = useCallback((step: number) => {
        currentStepRef.current = step;
        setCurrentStep(step);
        onStepChange?.(step);
    }, [onStepChange]);

    const stopAnimation = useCallback(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const animate = useCallback((timestamp: number) => {
        if (!isPlayingRef.current) return;

        const interval = 500 / playbackSpeed;
        if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;

        if (timestamp - lastTimeRef.current >= interval) {
            lastTimeRef.current = timestamp;
            if (currentStepRef.current < totalSteps - 1) {
                updateStep(currentStepRef.current + 1);
            } else {
                stopAnimation();
                return;
            }
        }
        rafRef.current = requestAnimationFrame(animate);
    }, [playbackSpeed, totalSteps, updateStep, stopAnimation]);

    const play = useCallback(() => {
        if (currentStepRef.current >= totalSteps - 1) {
            updateStep(0);
        }
        isPlayingRef.current = true;
        setIsPlaying(true);
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(animate);
    }, [animate, totalSteps, updateStep]);

    const pause = useCallback(() => {
        stopAnimation();
    }, [stopAnimation]);

    const stepForward = useCallback(() => {
        if (currentStepRef.current < totalSteps - 1) {
            updateStep(currentStepRef.current + 1);
        }
    }, [totalSteps, updateStep]);

    const stepBackward = useCallback(() => {
        if (currentStepRef.current > 0) {
            updateStep(currentStepRef.current - 1);
        }
    }, [updateStep]);

    const reset = useCallback(() => {
        stopAnimation();
        updateStep(0);
    }, [stopAnimation, updateStep]);

    const setStep = useCallback((step: number) => {
        updateStep(Math.max(0, Math.min(step, totalSteps - 1)));
    }, [totalSteps, updateStep]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return {
        currentStep,
        isPlaying,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        setStep,
    };
}
