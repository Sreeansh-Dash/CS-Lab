// src/modules/networks/components/FlowControl.tsx
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useARQStore } from '../store/arqStore';

export function FlowControl() {
    const store = useARQStore();
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(performance.now());
    const tickRateMs = 1000 / store.playbackSpeed; // 1 tick per second if 1x

    useEffect(() => {
        const animate = (time: number) => {
            if (store.isPlaying && time - lastTimeRef.current >= tickRateMs) {
                store.tick();
                lastTimeRef.current = time;
            }
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [store, tickRateMs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-4)', gap: 'var(--space-4)' }}>
            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                alignItems: 'center',
                flexWrap: 'wrap',
                border: '1px solid var(--border-subtle)',
            }}>
                {/* Protocol Select */}
                <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                    {(['stop-and-wait', 'go-back-n', 'selective-repeat'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => store.setProtocol(p)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-xs)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-code)',
                                fontSize: '12px',
                                background: store.protocol === p ? 'rgba(6,182,212,0.2)' : 'transparent',
                                color: store.protocol === p ? '#06B6D4' : 'var(--text-muted)',
                            }}
                        >
                            {p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                {/* Inject Error */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>ERROR PROB:</span>
                    <input
                        type="range"
                        min="0" max="0.5" step="0.05"
                        value={store.errorRate}
                        onChange={e => store.setErrorRate(parseFloat(e.target.value))}
                        style={{ width: 80 }}
                        title={`${Math.round(store.errorRate * 100)}% drop rate`}
                        aria-label="Error Probability"
                    />
                </div>

                <div style={{ flex: 1 }} />

                {/* Playback */}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                        onClick={store.isPlaying ? store.pause : store.play}
                        style={{
                            padding: '6px 16px',
                            background: '#06B6D4',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            width: 80,
                        }}
                    >
                        {store.isPlaying ? 'Pause' : 'Start'}
                    </button>
                    <button
                        onClick={store.reset}
                        style={{
                            padding: '6px 16px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Visualization */}
            <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', overflow: 'hidden' }}>
                {/* Sender Buffer */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, padding: 'var(--space-3)',
                    borderBottom: '1px dashed var(--border-default)', background: 'rgba(6,182,212,0.05)',
                }}>
                    <div style={{ fontSize: '11px', color: '#06B6D4', fontFamily: 'var(--font-code)', marginBottom: 8, letterSpacing: '0.1em' }}>SENDER BUFFER (Window: {store.windowSize})</div>
                    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                        {store.frames.map((f, i) => (
                            <div key={i} style={{
                                width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-code)', fontSize: '10px',
                                background: f.status === 'acked' ? '#10B98120' : f.status === 'lost' ? '#EF444420' : f.status === 'sending' || f.status === 'sent' ? '#06B6D420' : 'var(--bg-elevated)',
                                border: `1px solid ${f.status === 'acked' ? '#10B981' : f.status === 'lost' ? '#EF4444' : f.status === 'sending' || f.status === 'sent' ? '#06B6D4' : 'var(--border-default)'}`,
                                color: f.status === 'acked' ? '#10B981' : 'var(--text-primary)',
                                opacity: f.status === 'pending' ? 0.5 : 1,
                            }}>
                                {f.seqNum}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline / Packets in flight */}
                <div style={{ position: 'absolute', top: 80, bottom: 80, left: 0, right: 0, overflow: 'hidden' }}>
                    <AnimatePresence>
                        {store.frames.filter(f => f.status === 'sending' || f.status === 'sent' || f.status === 'lost').map(f => (
                            <motion.div
                                key={`${f.id}-${f.isRetransmission ? 'rt' : 'tx'}`}
                                initial={{ top: 0, opacity: 1 }}
                                animate={{
                                    top: f.status === 'lost' ? '50%' : '100%',
                                    opacity: f.status === 'lost' ? 0 : 1
                                }}
                                transition={{ duration: 1, ease: 'linear' }}
                                style={{
                                    position: 'absolute',
                                    left: `calc(10% + ${f.seqNum * 30}px)`,
                                    width: 30, height: 20,
                                    background: f.isRetransmission ? '#F59E0B' : '#06B6D4',
                                    color: '#fff',
                                    borderRadius: 4,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-code)', fontSize: '10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                F{f.seqNum}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Receiver Buffer */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--space-3)',
                    borderTop: '1px dashed var(--border-default)', background: 'rgba(16,185,129,0.05)',
                }}>
                    <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'var(--font-code)', marginBottom: 8, letterSpacing: '0.1em' }}>RECEIVER BUFFER</div>
                    <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
                        {store.frames.map((f, i) => (
                            <div key={`rx-${i}`} style={{
                                width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-code)', fontSize: '10px',
                                background: store.receiverBuffer.includes(f.seqNum) ? '#10B98120' : 'var(--bg-elevated)',
                                border: `1px solid ${store.receiverBuffer.includes(f.seqNum) ? '#10B981' : 'var(--border-default)'}`,
                                color: store.receiverBuffer.includes(f.seqNum) ? '#10B981' : 'var(--text-muted)',
                            }}>
                                {f.seqNum}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Stats */}
            <div style={{ display: 'flex', gap: 'var(--space-6)', padding: 'var(--space-2)' }}>
                <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>SUCCESS</div>
                    <div style={{ fontSize: '18px', color: '#10B981', fontFamily: 'var(--font-code)' }}>{store.successfulFrames}</div>
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>RETRANSMISSIONS</div>
                    <div style={{ fontSize: '18px', color: '#EF4444', fontFamily: 'var(--font-code)' }}>{store.retransmissions}</div>
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>EFFICIENCY</div>
                    <div style={{ fontSize: '18px', color: '#06B6D4', fontFamily: 'var(--font-code)' }}>{store.efficiency}%</div>
                </div>
            </div>
        </div>
    );
}
