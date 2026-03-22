// src/hooks/useAnimationLoop.ts
import { useRef, useEffect, useCallback } from 'react';

type AnimationCallback = (time: number, deltaTime: number) => void;

export function useAnimationLoop(callback: AnimationCallback, active: boolean = true) {
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const callbackRef = useRef<AnimationCallback>(callback);

    callbackRef.current = callback;

    const loop = useCallback((timestamp: number) => {
        const delta = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
        lastTimeRef.current = timestamp;
        callbackRef.current(timestamp, delta);
        rafRef.current = requestAnimationFrame(loop);
    }, []);

    useEffect(() => {
        if (active) {
            lastTimeRef.current = 0;
            rafRef.current = requestAnimationFrame(loop);
        }
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [active, loop]);
}
