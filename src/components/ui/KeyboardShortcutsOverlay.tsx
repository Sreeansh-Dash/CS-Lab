// src/components/ui/KeyboardShortcutsOverlay.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardShortcutsOverlayProps {
    open: boolean;
    onClose: () => void;
}

const groups = [
    {
        label: 'Navigation',
        shortcuts: [
            { keys: ['1'], desc: 'Go to Pathfinding' },
            { keys: ['2'], desc: 'Go to Data Structures' },
            { keys: ['3'], desc: 'Go to Signals & Systems' },
            { keys: ['4'], desc: 'Go to Discrete Math' },
            { keys: ['5'], desc: 'Go to Networks' },
            { keys: ['6'], desc: 'Go to OS & Deadlock' },
            { keys: ['H'], desc: 'Go to Home' },
        ],
    },
    {
        label: 'Playback',
        shortcuts: [
            { keys: ['Space'], desc: 'Play / Pause' },
            { keys: ['←'], desc: 'Step backward' },
            { keys: ['→'], desc: 'Step forward' },
            { keys: ['R'], desc: 'Reset' },
        ],
    },
    {
        label: 'App',
        shortcuts: [
            { keys: ['?'], desc: 'Toggle this overlay' },
            { keys: ['Ctrl', 'Shift', 'D'], desc: 'Toggle dark / light' },
        ],
    },
];

export function KeyboardShortcutsOverlay({ open, onClose }: KeyboardShortcutsOverlayProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-4)',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--border-default)',
                            padding: 'var(--space-8)',
                            maxWidth: 520,
                            width: '100%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--space-6)',
                        }}>
                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-xl)',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                            }}>
                                Keyboard Shortcuts
                            </h2>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-muted)',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                }}
                                aria-label="Close shortcuts overlay"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Groups */}
                        {groups.map(group => (
                            <div key={group.label} style={{ marginBottom: 'var(--space-5)' }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-code)',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                    marginBottom: 'var(--space-3)',
                                }}>
                                    {group.label}
                                </h3>
                                {group.shortcuts.map(sc => (
                                    <div
                                        key={sc.desc}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        <span style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--text-secondary)',
                                        }}>
                                            {sc.desc}
                                        </span>
                                        <span style={{ display: 'flex', gap: 4 }}>
                                            {sc.keys.map(k => (
                                                <kbd
                                                    key={k}
                                                    style={{
                                                        fontFamily: 'var(--font-code)',
                                                        fontSize: '12px',
                                                        background: 'var(--bg-elevated)',
                                                        border: '1px solid var(--border-default)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        padding: '2px 8px',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: 500,
                                                        lineHeight: '20px',
                                                        minWidth: 28,
                                                        textAlign: 'center' as const,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                                    }}
                                                >
                                                    {k}
                                                </kbd>
                                            ))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Footer */}
                        <p style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-code)',
                            textAlign: 'center',
                            marginTop: 'var(--space-4)',
                        }}>
                            Press <kbd style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 4,
                                padding: '1px 6px',
                                fontSize: '11px',
                            }}>?</kbd> or <kbd style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 4,
                                padding: '1px 6px',
                                fontSize: '11px',
                            }}>Esc</kbd> to close
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
