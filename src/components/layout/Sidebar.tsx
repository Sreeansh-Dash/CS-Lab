// src/components/layout/Sidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const modules = [
    {
        id: 'pathfinding',
        label: 'Pathfinding',
        icon: '◉',
        path: '/pathfinding',
        color: 'var(--mod-accent)',
        rawColor: '#00D4FF',
    },
    {
        id: 'dataStructures',
        label: 'Data Structures',
        icon: '◈',
        path: '/data-structures',
        color: 'var(--mod-accent)',
        rawColor: '#A855F7',
    },
    {
        id: 'det',
        label: 'Signals & DET',
        icon: '∿',
        path: '/det',
        color: 'var(--mod-accent)',
        rawColor: '#39FF14',
    },
    {
        id: 'dmgt',
        label: 'Discrete Math',
        icon: '∀',
        path: '/dmgt',
        color: 'var(--mod-accent)',
        rawColor: '#F59E0B',
    },
    {
        id: 'networks',
        label: 'Networks',
        icon: '⊻',
        path: '/networks',
        color: 'var(--mod-accent)',
        rawColor: '#06B6D4',
    },
    {
        id: 'os',
        label: 'OS & Deadlock',
        icon: '◎',
        path: '/os',
        color: 'var(--mod-accent)',
        rawColor: '#EF4444',
    },
] as const;

export function Sidebar({ onOpenShortcuts }: { onOpenShortcuts?: () => void }) {
    const { sidebarCollapsed, setSidebarCollapsed, theme, toggleTheme } = useAppStore();
    const location = useLocation();

    return (
        <motion.aside
            className="sidebar"
            animate={{ width: sidebarCollapsed ? 72 : 260 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
                height: '100vh',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 'var(--z-sidebar)',
                backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 2px, rgba(99, 130, 255, 0.02) 2px, rgba(99, 130, 255, 0.02) 4px)',
            }}
        >
            {/* Logo / Brand */}
            <div
                style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    minHeight: 64,
                }}
            >
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '1.4rem',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        transition: 'background var(--duration-fast) var(--ease-smooth)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                        width: 16,
                        height: 16,
                    }}>
                        {[0, 1, 2, 3].map(i => (
                            <motion.span
                                key={i}
                                animate={{ opacity: [0.4, 0.9, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 1,
                                    background: 'var(--accent-blue)',
                                }}
                            />
                        ))}
                    </span>
                </button>
                <AnimatePresence>
                    {!sidebarCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-lg)',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            CS Lab
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav style={{
                flex: 1,
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                overflowY: 'auto',
            }}>
                {modules.map((mod) => {
                    const isActive = location.pathname === mod.path;
                    return (
                        <NavLink
                            key={mod.id}
                            to={mod.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: sidebarCollapsed ? 'var(--space-3)' : 'var(--space-3) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: isActive ? 500 : 400,
                                transition: 'all 200ms var(--ease-smooth)',
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                position: 'relative',
                                overflow: 'hidden',
                                minHeight: 52,
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)';
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {/* Left accent bar */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                                    background: isActive ? mod.rawColor : 'transparent',
                                    boxShadow: isActive ? `0 0 12px ${mod.rawColor}80` : 'none',
                                    transition: 'all 200ms var(--ease-smooth)',
                                }}
                            />

                            {/* Icon */}
                            <span style={{
                                fontSize: '1.25rem',
                                flexShrink: 0,
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'var(--font-code)',
                                fontWeight: 500,
                                color: isActive ? mod.rawColor : 'var(--text-muted)',
                                transition: 'color 200ms var(--ease-smooth)',
                            }}>
                                {mod.icon}
                            </span>

                            {/* Label */}
                            <AnimatePresence>
                                {!sidebarCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -4 }}
                                        transition={{ duration: 0.15 }}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {mod.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div
                style={{
                    padding: 'var(--space-3)',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: sidebarCollapsed ? 'column' : 'row',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
            >
                {/* Theme Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        flexShrink: 0,
                    }}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? '☀' : '☾'}
                </motion.button>

                {/* Keyboard Shortcuts */}
                {!sidebarCollapsed && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenShortcuts}
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-code)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                        }}
                        aria-label="Keyboard shortcuts"
                    >
                        <span>?</span>
                        {!sidebarCollapsed && <span>Shortcuts</span>}
                    </motion.button>
                )}
            </div>
        </motion.aside>
    );
}
