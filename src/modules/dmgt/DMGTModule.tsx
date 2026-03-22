// src/modules/dmgt/DMGTModule.tsx
import { useEffect, useState } from 'react';
import { ModuleShell } from '../../components/layout/ModuleShell';
import { useDMGTStore } from './store/dmgtStore';
import { useAppStore } from '../../store/appStore';
import { motion } from 'framer-motion';
import { ProofWorkbench } from './components/ProofWorkbench';
import type { PredicateType } from './utils/predicateEvaluator';

const SHAPE_SYMBOLS: Record<string, string> = { circle: '●', square: '■', triangle: '▲', pentagon: '⬟' };
const COLOR_HEX: Record<string, string> = { blue: '#3B82F6', red: '#EF4444', green: '#10B981', yellow: '#F59E0B' };
const SIZE_SCALE: Record<string, number> = { small: 0.7, medium: 1, large: 1.4 };

const PREDICATES: PredicateType[] = [
    'isBlue', 'isRed', 'isGreen', 'isYellow',
    'isCircle', 'isSquare', 'isTriangle',
    'isSmall', 'isMedium', 'isLarge',
];

export default function DMGTModule() {
    const store = useDMGTStore();
    const setActiveModule = useAppStore((s) => s.setActiveModule);
    const [activeTab, setActiveTab] = useState<'sandbox' | 'proofs'>('sandbox');

    useEffect(() => {
        setActiveModule('dmgt');
        return () => setActiveModule(null);
    }, [setActiveModule]);

    const witnessIds = new Set(store.evaluationResult?.witnesses.map((o) => o.id) || []);
    const counterExIds = new Set(store.evaluationResult?.counterExamples.map((o) => o.id) || []);

    return (
        <ModuleShell title="Discrete Math & Logic" subtitle="Predicate Sandbox" accentColor="#F59E0B" moduleClass="module-dmgt">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Personality Header */}
                <div style={{ padding: '6px 16px', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', color: '#F59E0B', fontFamily: 'var(--font-heading)', fontSize: '12px', fontStyle: 'italic', letterSpacing: '0.05em' }}>
                    ✧ LOGIC FORGE ✧
                </div>
                {/* Header */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)', background: 'var(--color-bg-surface)', alignItems: 'center' }}>
                    {/* Main Tabs */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                        {([['sandbox', '🔍 Predicate Sandbox'], ['proofs', '📐 Proof Workbench']] as const).map(([tab, label]) => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--font-size-xs)',
                                    background: activeTab === tab ? '#F59E0B20' : 'transparent',
                                    color: activeTab === tab ? '#F59E0B' : 'var(--color-text-muted)', fontWeight: activeTab === tab ? 600 : 400
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Mode sub-tabs (only for sandbox) */}
                    {activeTab === 'sandbox' && (
                        <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                            {(['freeExplore', 'challenge'] as const).map((mode) => (
                                <button key={mode} onClick={() => store.setMode(mode)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--font-size-xs)',
                                        background: store.mode === mode ? 'var(--color-accent-secondary)20' : 'transparent',
                                        color: store.mode === mode ? 'var(--color-accent-secondary)' : 'var(--color-text-muted)', fontWeight: store.mode === mode ? 600 : 400
                                    }}>
                                    {mode === 'freeExplore' ? '🔍 Free Explore' : '🧩 Challenge'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                {activeTab === 'proofs' ? (
                    <ProofWorkbench />
                ) : (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left - Predicate Builder */}
                    <div style={{ width: 300, borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto' }}>
                        {/* Quantifier */}
                        <div>
                            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>Quantifier</label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                {(['forall', 'exists'] as const).map((q) => (
                                    <motion.button key={q} whileTap={{ scale: 0.95 }}
                                        onClick={() => store.setQuantifier(q)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 'var(--radius-md)',
                                            border: `1px solid ${store.quantifier === q ? 'var(--color-accent-secondary)' : 'var(--color-border)'}`,
                                            background: store.quantifier === q ? 'rgba(34,211,238,0.1)' : 'var(--color-bg-card)',
                                            color: store.quantifier === q ? 'var(--color-accent-secondary)' : 'var(--color-text-secondary)',
                                            cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-lg)', fontWeight: 700,
                                        }}>
                                        {q === 'forall' ? '∀' : '∃'}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Predicate */}
                        <div>
                            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>Predicate P(x)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {PREDICATES.map((p) => (
                                    <button key={p} onClick={() => store.setSelectedPredicate(p)}
                                        style={{
                                            padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                                            fontFamily: 'var(--font-code)', fontSize: '10px',
                                            background: store.selectedPredicate === p ? 'var(--color-accent-secondary)20' : 'var(--color-bg-card)',
                                            color: store.selectedPredicate === p ? 'var(--color-accent-secondary)' : 'var(--color-text-muted)',
                                            fontWeight: store.selectedPredicate === p ? 600 : 400,
                                        }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expression preview */}
                        <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-lg)', color: 'var(--color-accent-secondary)', textAlign: 'center' }}>
                                {store.quantifier === 'forall' ? '∀' : '∃'}x : {store.selectedPredicate}(x)
                            </div>
                        </div>

                        {/* Evaluate Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => store.evaluate()}
                            style={{
                                padding: '10px', borderRadius: 'var(--radius-md)',
                                background: 'var(--color-accent-primary)', border: 'none',
                                color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)',
                                fontSize: 'var(--font-size-sm)', fontWeight: 600,
                                boxShadow: 'var(--shadow-glow-indigo)',
                            }}>
                            ⚡ Evaluate
                        </motion.button>

                        {/* Result */}
                        {store.evaluationResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${store.evaluationResult.truthValue ? 'var(--color-accent-success)' : 'var(--color-accent-danger)'}`,
                                    background: store.evaluationResult.truthValue ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-lg)', color: store.evaluationResult.truthValue ? 'var(--color-accent-success)' : 'var(--color-accent-danger)', fontWeight: 700, marginBottom: 4 }}>
                                    {store.evaluationResult.truthValue ? '✓ TRUE' : '✗ FALSE'}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-code)' }}>
                                    {store.evaluationResult.witnesses.length} witnesses, {store.evaluationResult.counterExamples.length} counter-examples
                                </div>
                            </motion.div>
                        )}

                        {/* Eval Trace */}
                        {store.evaluationResult && store.evaluationResult.evaluationTrace.length > 0 && (
                            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Evaluation Trace</div>
                                {store.evaluationResult.evaluationTrace.map((step, i) => (
                                    <div key={i} style={{ fontSize: '9px', fontFamily: 'var(--font-code)', color: step.result ? 'var(--color-accent-success)' : 'var(--color-accent-danger)', marginBottom: 2 }}>
                                        {step.description}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right - Logic Sandbox */}
                    <div style={{ flex: 1, padding: 'var(--space-4)', background: 'var(--color-bg-primary)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Logic Sandbox — {store.objects.length} objects</span>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button onClick={() => store.addObject({})}
                                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '10px' }}>
                                    + Add Object
                                </button>
                                <button onClick={() => store.randomizeObjects()}
                                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '10px' }}>
                                    🎲 Randomize
                                </button>
                                <button onClick={() => store.clearObjects()}
                                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-danger)', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', fontSize: '10px' }}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Objects Grid */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center', padding: 'var(--space-4)' }}>
                            {store.objects.map((obj) => {
                                const isWitness = witnessIds.has(obj.id);
                                const isCounter = counterExIds.has(obj.id);
                                const glowColor = isWitness ? '#10B981' : isCounter ? '#EF4444' : 'transparent';
                                const scale = SIZE_SCALE[obj.size];

                                return (
                                    <motion.div
                                        key={obj.id}
                                        animate={{
                                            scale: isWitness || isCounter ? [1, 1.15, 1] : 1,
                                            boxShadow: isWitness || isCounter ? `0 0 20px ${glowColor}60` : 'none',
                                        }}
                                        transition={{ duration: 0.4 }}
                                        style={{
                                            width: 70 * scale,
                                            height: 70 * scale,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--color-bg-card)',
                                            border: `2px solid ${glowColor === 'transparent' ? 'var(--color-border)' : glowColor}`,
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                        }}
                                        onClick={() => store.removeObject(obj.id)}
                                        title={`Click to remove: ${obj.color} ${obj.size} ${obj.shape}`}
                                    >
                                        <span style={{ fontSize: `${24 * scale}px`, color: COLOR_HEX[obj.color] }}>
                                            {SHAPE_SYMBOLS[obj.shape]}
                                        </span>
                                        <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-code)', marginTop: 2 }}>
                                            {obj.size.charAt(0).toUpperCase()}
                                        </span>
                                        {/* Badge */}
                                        {(isWitness || isCounter) && (
                                            <div style={{
                                                position: 'absolute', top: -4, right: -4,
                                                width: 16, height: 16, borderRadius: '50%',
                                                background: glowColor, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '9px', color: '#fff', fontWeight: 700,
                                            }}>
                                                {isWitness ? '✓' : '✗'}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                )}
            </div>
        </ModuleShell>
    );
}
