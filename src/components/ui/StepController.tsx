// src/components/ui/StepController.tsx
import { motion } from 'framer-motion';

interface StepControllerProps {
    onPlay: () => void;
    onPause: () => void;
    onStepForward: () => void;
    onStepBackward: () => void;
    onReset: () => void;
    currentStep: number;
    totalSteps: number;
    isPlaying: boolean;
    accentColor?: string;
}

export function StepController({
    onPlay,
    onPause,
    onStepForward,
    onStepBackward,
    onReset,
    currentStep,
    totalSteps,
    isPlaying,
    accentColor = 'var(--accent-blue)',
}: StepControllerProps) {
    const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    const btnBase: React.CSSProperties = {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        flexShrink: 0,
        transition: 'all var(--duration-fast) var(--ease-smooth)',
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-default)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
        >
            {/* Reset */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={onReset}
                style={btnBase}
                aria-label="Reset to beginning"
            >
                ⏮
            </motion.button>

            {/* Step Backward */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={onStepBackward}
                disabled={currentStep <= 0}
                style={{
                    ...btnBase,
                    opacity: currentStep <= 0 ? 0.35 : 1,
                    cursor: currentStep <= 0 ? 'not-allowed' : 'pointer',
                }}
                aria-label="Step backward"
            >
                ◀
            </motion.button>

            {/* Play / Pause */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={isPlaying ? onPause : onPlay}
                style={{
                    ...btnBase,
                    width: 52,
                    height: 52,
                    borderRadius: 'var(--radius-full)',
                    background: isPlaying ? 'var(--accent-amber)' : 'var(--accent-blue)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.1rem',
                    boxShadow: isPlaying ? 'var(--glow-amber)' : 'var(--glow-blue)',
                }}
                aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
            >
                {isPlaying ? '⏸' : '▶'}
            </motion.button>

            {/* Step Forward */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={onStepForward}
                disabled={currentStep >= totalSteps - 1}
                style={{
                    ...btnBase,
                    opacity: currentStep >= totalSteps - 1 ? 0.35 : 1,
                    cursor: currentStep >= totalSteps - 1 ? 'not-allowed' : 'pointer',
                }}
                aria-label="Step forward"
            >
                ▶▶
            </motion.button>

            {/* Progress Bar */}
            <div
                style={{
                    flex: 1,
                    minWidth: 80,
                    maxWidth: 200,
                    height: 6,
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    marginLeft: 'var(--space-2)',
                }}
            >
                <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        background: accentColor,
                        borderRadius: 'var(--radius-full)',
                        boxShadow: `0 0 8px ${accentColor}60`,
                    }}
                />
            </div>

            {/* Step Counter */}
            <div
                style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    padding: '0 var(--space-2)',
                    whiteSpace: 'nowrap',
                    minWidth: 70,
                    textAlign: 'center',
                }}
            >
                {currentStep + 1} / {totalSteps || 0}
            </div>
        </div>
    );
}
