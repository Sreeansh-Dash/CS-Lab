// src/modules/networks/NetworksModule.tsx
import { useEffect, useState } from 'react';
import { ModuleShell } from '../../components/layout/ModuleShell';
import { useNetworksStore } from './store/networksStore';
import { useAppStore } from '../../store/appStore';
import { CRC_GENERATORS } from './utils/crc';
import { motion } from 'framer-motion';
import { FlowControl } from './components/FlowControl';
import type { Bit, ErrorDetectionMode } from '../../types/network.types';

function BitCell({ bit, index, editable, onFlip, highlight, isFlipped }: {
    bit: Bit; index: number; editable: boolean; onFlip?: () => void; highlight?: boolean; isFlipped?: boolean;
}) {
    return (
        <motion.button
            whileTap={editable ? { scale: 1.3 } : {}}
            animate={isFlipped ? { scale: [1, 1.4, 1], backgroundColor: '#F97316' } : {}}
            onClick={editable ? onFlip : undefined}
            style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isFlipped ? '#F9731630' : highlight ? 'rgba(99,102,241,0.15)' : 'var(--color-bg-card)',
                border: `1px solid ${isFlipped ? '#F97316' : highlight ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)', cursor: editable ? 'pointer' : 'default',
                fontFamily: 'var(--font-code)', fontSize: 'var(--font-size-sm)',
                color: bit === 1 ? 'var(--color-accent-secondary)' : 'var(--color-text-muted)',
                fontWeight: 600, padding: 0,
            }}
            aria-label={`Bit ${index}: ${bit}${editable ? ', click to flip' : ''}`}
        >
            {bit}
        </motion.button>
    );
}

function BitRow({ bits, label, editable, onBitFlip, originalBits }: {
    bits: Bit[]; label: string; editable: boolean; onBitFlip?: (i: number) => void; originalBits?: Bit[];
}) {
    return (
        <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{label}</div>
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {bits.map((bit, i) => (
                    <BitCell
                        key={i} bit={bit} index={i} editable={editable}
                        onFlip={() => onBitFlip?.(i)}
                        isFlipped={originalBits ? originalBits[i] !== bit : false}
                    />
                ))}
            </div>
        </div>
    );
}

export default function NetworksModule() {
    const store = useNetworksStore();
    const setActiveModule = useAppStore((s) => s.setActiveModule);
    const [activeTab, setActiveTab] = useState<'error-detection' | 'flow-control'>('error-detection');

    useEffect(() => {
        setActiveModule('networks');
        store.computeSender();
        return () => setActiveModule(null);
    }, [setActiveModule]);

    const fullOriginal = store.mode === 'parity'
        ? [...store.originalBits, store.parityBit]
        : store.mode === 'crc'
            ? [...store.originalBits, ...store.senderFCS]
            : [...store.originalBits];

    return (
        <ModuleShell title="Networks — Error Detection" subtitle="Data Link Layer" accentColor="#06B6D4" moduleClass="module-networks">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Personality Header */}
                <div style={{ padding: '4px 16px', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', color: '#06B6D4', fontFamily: 'var(--font-code)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>NETWORK MONITOR</span>
                    <motion.div animate={{ opacity: [1, 0.4] }} transition={{ repeat: Infinity, duration: 0.2, repeatType: 'reverse' }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                    <motion.div animate={{ opacity: [0.4, 1] }} transition={{ repeat: Infinity, duration: 0.5, repeatType: 'reverse' }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                </div>
                {/* Header */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', background: 'var(--color-bg-surface)' }}>
                    {/* Main Tabs */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                        {([['error-detection', '🛡️ Error Detection'], ['flow-control', '🌊 Flow Control']] as const).map(([tab, label]) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)}
                                style={{
                                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--font-size-xs)',
                                    background: activeTab === tab ? '#06B6D420' : 'transparent',
                                    color: activeTab === tab ? '#06B6D4' : 'var(--color-text-muted)', fontWeight: activeTab === tab ? 600 : 400
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'error-detection' && (
                        <>
                            <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                                {(['parity', 'checksum', 'crc'] as ErrorDetectionMode[]).map((mode) => (
                                    <button key={mode} onClick={() => store.setMode(mode)}
                                        style={{
                                            padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                                            fontFamily: 'var(--font-code)', fontSize: 'var(--font-size-xs)', fontWeight: 600,
                                            background: store.mode === mode ? 'var(--color-accent-warning)20' : 'transparent',
                                            color: store.mode === mode ? 'var(--color-accent-warning)' : 'var(--color-text-muted)',
                                        }}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>

                    {store.mode === 'crc' && (
                        <select value={store.selectedGenerator} onChange={(e) => store.setSelectedGenerator(Number(e.target.value))}
                            style={{ padding: '4px 8px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-code)', fontSize: 'var(--font-size-xs)' }}>
                            {CRC_GENERATORS.map((gen, i) => (
                                <option key={i} value={i}>{gen.name}: {gen.polynomial}</option>
                            ))}
                        </select>
                    )}

                    {store.mode === 'parity' && (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            {(['even', 'odd'] as const).map((type) => (
                                <button key={type} onClick={() => store.setParityType(type)}
                                    style={{
                                        padding: '4px 12px', borderRadius: 'var(--radius-full)', border: `1px solid ${store.parityType === type ? 'var(--color-accent-warning)' : 'var(--color-border)'}`,
                                        background: store.parityType === type ? 'rgba(245,158,11,0.1)' : 'transparent',
                                        color: store.parityType === type ? 'var(--color-accent-warning)' : 'var(--color-text-muted)',
                                        cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)',
                                    }}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)} Parity
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Bits: {store.frameSize}</span>
                        <input type="range" min={4} max={16} value={store.frameSize} onChange={(e) => store.setFrameSize(Number(e.target.value))} style={{ width: 80 }} />
                    </div>

                    <button onClick={() => store.randomizeData()}
                        style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                        🎲 Random
                    </button>
                    <button onClick={() => store.resetChannel()}
                        style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-danger)', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                        Reset
                    </button>
                        </>
                    )}
                </div>

                {/* Pipeline Visualization */}
                {activeTab === 'flow-control' ? (
                    <FlowControl />
                ) : (
                <div style={{ flex: 1, padding: 'var(--space-6)', overflow: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-6)', alignItems: 'start', maxWidth: 900, margin: '0 auto' }}>
                        {/* Sender */}
                        <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--color-accent-success)30' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-success)', marginBottom: 'var(--space-3)' }}>📤 SENDER</div>
                            <BitRow bits={store.originalBits} label="Data" editable={false} />
                            {store.senderFCS.length > 0 && (
                                <div style={{ marginTop: 'var(--space-2)' }}>
                                    <BitRow bits={store.senderFCS} label={store.mode === 'parity' ? 'Parity Bit' : 'FCS (CRC)'} editable={false} />
                                </div>
                            )}
                        </div>

                        {/* Channel Arrow */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4) 0', gap: 'var(--space-2)' }}>
                            <div style={{ fontSize: '24px' }}>→</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 120 }}>
                                Click bits below to simulate errors
                            </div>
                        </div>

                        {/* Receiver */}
                        <div style={{
                            background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                            border: `1px solid ${store.receiverResult.accept ? 'var(--color-accent-success)30' : 'var(--color-accent-danger)30'}`,
                        }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-sm)', color: store.receiverResult.accept ? 'var(--color-accent-success)' : 'var(--color-accent-danger)', marginBottom: 'var(--space-3)' }}>
                                📥 RECEIVER
                            </div>
                            <BitRow bits={store.channelBits} label="Received" editable={false} originalBits={fullOriginal} />

                            {/* Accept/Reject Badge */}
                            <motion.div
                                animate={store.receiverResult.accept ? {} : { x: [0, -3, 3, -3, 0] }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)',
                                    borderRadius: 'var(--radius-md)', textAlign: 'center',
                                    background: store.receiverResult.accept ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    border: `1px solid ${store.receiverResult.accept ? 'var(--color-accent-success)' : 'var(--color-accent-danger)'}`,
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    color: store.receiverResult.accept ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
                                }}>
                                {store.receiverResult.accept ? '✓ ACCEPT' : '✗ REJECT'}
                            </motion.div>

                            {store.receiverResult.parityWarning && (
                                <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', background: 'rgba(245,158,11,0.1)', border: '1px solid var(--color-accent-warning)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-warning)', fontFamily: 'var(--font-body)' }}>
                                    {store.receiverResult.parityWarning}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Channel - Editable bit grid */}
                    <div style={{ maxWidth: 900, margin: 'var(--space-6) auto 0', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-warning)', marginBottom: 'var(--space-3)' }}>📡 CHANNEL — Click to flip bits</div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {store.channelBits.map((bit, i) => (
                                <BitCell key={i} bit={bit} index={i} editable={true}
                                    onFlip={() => store.flipBit(i)}
                                    isFlipped={fullOriginal[i] !== bit} />
                            ))}
                        </div>
                        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                            Flipped bits: {store.receiverResult.flippedCount}
                        </div>
                    </div>

                    {/* CRC Division Steps */}
                    {store.mode === 'crc' && store.receiverResult.steps && store.receiverResult.steps.length > 0 && (
                        <div style={{ maxWidth: 900, margin: 'var(--space-4) auto 0', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                                CRC Division (Receiver)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {store.receiverResult.steps.map((step) => (
                                    <div key={step.stepNumber} style={{
                                        padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                                        background: step.isError ? 'rgba(239,68,68,0.08)' : 'var(--color-bg-card)',
                                        border: `1px solid ${step.isError ? 'var(--color-accent-danger)30' : 'var(--color-border)'}`,
                                        fontFamily: 'var(--font-code)', fontSize: '10px',
                                    }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Step {step.stepNumber} @{step.position}: </span>
                                        <span style={{ color: step.isError ? 'var(--color-accent-danger)' : 'var(--color-text-secondary)' }}>
                                            XOR → {step.xorResult.join('')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {store.receiverResult.remainder && (
                                <div style={{ marginTop: 'var(--space-2)', fontFamily: 'var(--font-code)', fontSize: 'var(--font-size-xs)', color: store.receiverResult.accept ? 'var(--color-accent-success)' : 'var(--color-accent-danger)' }}>
                                    Remainder: {store.receiverResult.remainder.join('')} {store.receiverResult.accept ? '(zero — no error)' : '(non-zero — error detected!)'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                )}
            </div>
        </ModuleShell>
    );
}
