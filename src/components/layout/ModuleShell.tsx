// src/components/layout/ModuleShell.tsx
import { Suspense, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ModuleShellProps {
    title: string;
    subtitle?: string;
    accentColor?: string;
    moduleClass?: string;
    children: ReactNode;
}

function ModuleSkeleton() {
    return (
        <div
            style={{
                padding: 'var(--space-8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
            }}
        >
            {/* Title skeleton */}
            <div
                className="skeleton"
                style={{ width: 280, height: 36, borderRadius: 'var(--radius-md)' }}
            />
            {/* Subtitle skeleton */}
            <div
                className="skeleton"
                style={{ width: 400, height: 20, borderRadius: 'var(--radius-sm)' }}
            />
            {/* Content skeletons */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                <div
                    className="skeleton"
                    style={{ width: 200, height: 400, borderRadius: 'var(--radius-lg)' }}
                />
                <div
                    className="skeleton"
                    style={{ flex: 1, height: 400, borderRadius: 'var(--radius-lg)' }}
                />
            </div>
        </div>
    );
}

export function ModuleShell({ title, subtitle, accentColor = 'var(--accent-blue)', moduleClass, children }: ModuleShellProps) {
    return (
        <motion.div
            className={moduleClass}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Module Hero Header */}
            <div
                style={{
                    padding: 'var(--space-6) var(--space-8)',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-subtle)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative accent gradient blur */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-40%',
                        left: '10%',
                        width: 300,
                        height: 200,
                        borderRadius: '50%',
                        background: accentColor,
                        opacity: 0.08,
                        filter: 'blur(80px)',
                        pointerEvents: 'none',
                    }}
                />

                <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-3xl)',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {title}
                </motion.h1>
                {subtitle && (
                    <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            marginTop: 'var(--space-2)',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {subtitle}
                    </motion.p>
                )}
            </div>

            {/* Module Content */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg-base)' }}>
                <Suspense fallback={<ModuleSkeleton />}>
                    {children}
                </Suspense>
            </div>
        </motion.div>
    );
}
