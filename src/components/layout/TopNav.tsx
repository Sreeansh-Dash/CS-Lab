// src/components/layout/TopNav.tsx
import { useAppStore } from '../../store/appStore';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const MODULE_NAMES: Record<string, string> = {
    '/pathfinding': 'Pathfinding',
    '/data-structures': 'Data Structures',
    '/det': 'Signals & DET',
    '/dmgt': 'Discrete Math',
    '/networks': 'Networks',
    '/os': 'OS & Deadlock',
};

const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

export function TopNav() {
    const { theme, toggleTheme, playbackSpeed, setPlaybackSpeed } = useAppStore();
    const location = useLocation();
    const moduleName = MODULE_NAMES[location.pathname] || 'Home';

    const cycleSpeed = () => {
        const idx = SPEEDS.indexOf(playbackSpeed);
        const next = SPEEDS[(idx + 1) % SPEEDS.length];
        setPlaybackSpeed(next);
    };

    const isAboveNormal = playbackSpeed > 1;

    return (
        <header
            style={{
                height: 64,
                background: 'var(--bg-overlay)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--space-6)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-topnav)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Left - Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                    style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.02em',
                    }}
                >
                    CS Lab
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>/</span>
                <span
                    style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                    }}
                >
                    {moduleName}
                </span>
            </div>

            {/* Right - Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {/* Speed Pill */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cycleSpeed}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isAboveNormal ? 'var(--accent-amber)' : 'var(--border-default)'}`,
                        background: isAboveNormal ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-elevated)',
                        color: isAboveNormal ? 'var(--accent-amber)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast) var(--ease-smooth)',
                        boxShadow: isAboveNormal ? 'var(--glow-amber)' : 'none',
                    }}
                    aria-label={`Playback speed: ${playbackSpeed}×. Click to change.`}
                >
                    <span style={{ fontSize: 'var(--text-xs)', opacity: 0.6 }}>Speed</span>
                    <span style={{ fontWeight: 700 }}>{playbackSpeed}×</span>
                </motion.button>

                {/* Theme Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    onClick={toggleTheme}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                    }}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? '☀' : '☾'}
                </motion.button>
            </div>
        </header>
    );
}
