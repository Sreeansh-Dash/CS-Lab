// src/modules/det/DETModule.tsx
import { useRef, useEffect } from 'react';
import { ModuleShell } from '../../components/layout/ModuleShell';
import { useDETStore } from './store/detStore';
import { useAppStore } from '../../store/appStore';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { computeFFT, generateSignal } from './utils/fft';
import { motion } from 'framer-motion';

export default function DETModule() {
    const store = useDETStore();
    const setActiveModule = useAppStore((s) => s.setActiveModule);
    const timeDomainRef = useRef<HTMLCanvasElement>(null);
    const freqDomainRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        setActiveModule('det');
        return () => setActiveModule(null);
    }, [setActiveModule]);

    // Update FFT bins when channels change
    useEffect(() => {
        const signal = generateSignal(store.channels, 2048, 1024);
        const bins = computeFFT(signal, 1024);
        store.setFrequencyBins(bins.filter((b) => b.frequency > 0 && b.frequency < 80 && b.magnitude > 0.01));
    }, [store.channels]);

    // Time domain animation loop — verified 60fps via RAF
    useAnimationLoop((time) => {
        const canvas = timeDomainRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = 'rgba(99, 130, 255, 0.06)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y <= h; y += h / 10) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (let x = 0; x <= w; x += w / 20) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        // Center line
        ctx.strokeStyle = 'rgba(99, 130, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

        const t0 = time / 1000;
        const dt = 1 / w;

        // Draw individual channel waves (faint)
        for (const ch of store.channels) {
            ctx.strokeStyle = ch.color + '40';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let px = 0; px < w; px++) {
                const t = t0 + px * dt * 4;
                const y = ch.amplitude * Math.sin(2 * Math.PI * ch.frequency * t + (ch.phase * Math.PI) / 180);
                const py = h / 2 - y * (h / 3);
                if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // Draw composite wave (bright)
        ctx.strokeStyle = '#EDF2FF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#4D7CFE';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let px = 0; px < w; px++) {
            const t = t0 + px * dt * 4;
            let y = 0;
            for (const ch of store.channels) {
                y += ch.amplitude * Math.sin(2 * Math.PI * ch.frequency * t + (ch.phase * Math.PI) / 180);
            }
            const py = h / 2 - y * (h / 3) / Math.max(1, store.channels.reduce((s, c) => s + c.amplitude, 0));
            if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, store.domainMode === 'time');

    // Frequency domain rendering
    useEffect(() => {
        if (store.domainMode !== 'frequency') return;
        const canvas = freqDomainRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(99, 130, 255, 0.06)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y <= h; y += h / 8) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Axis
        ctx.strokeStyle = 'rgba(99, 130, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h - 30); ctx.lineTo(w, h - 30); ctx.stroke();

        // Frequency labels
        ctx.fillStyle = '#4A5578';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';

        // Draw spikes
        const maxFreq = 60;
        const maxMag = Math.max(0.1, ...store.frequencyBins.map((b) => b.magnitude));

        for (const bin of store.frequencyBins) {
            const x = (bin.frequency / maxFreq) * w;
            const spikeHeight = (bin.magnitude / maxMag) * (h - 60);
            const y = h - 30 - spikeHeight;

            const matchingChannel = store.channels.find(
                (ch) => Math.abs(ch.frequency - bin.frequency) < 1
            );
            const color = matchingChannel?.color || '#22D3EE';

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(x, h - 30);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Dot at top
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle = '#8B9CC8';
            ctx.fillText(`${bin.frequency.toFixed(0)}Hz`, x, h - 14);
        }
    }, [store.domainMode, store.frequencyBins, store.channels]);

    return (
        <ModuleShell title="Signals & Systems" subtitle="Wave Combiner & Frequency Analysis" accentColor="#39FF14" moduleClass="module-det">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Personality Header */}
                <div style={{ padding: '4px 16px', background: '#39FF1410', borderBottom: '1px solid #39FF1430', color: '#39FF14', fontFamily: 'var(--font-code)', fontSize: '11px', letterSpacing: '0.1em', textShadow: '0 0 8px #39FF1450' }}>
                    OSC-LAB [PHOSPHOR ACTIVE]
                </div>
                {/* Header Bar */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--bg-surface)' }}>
                    {/* Domain Selector */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                        {(['time', 'frequency'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => store.setDomainMode(mode)}
                                style={{
                                    padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                                    fontFamily: 'var(--font-code)', fontSize: 'var(--text-sm)', fontWeight: 600,
                                    background: store.domainMode === mode ? 'rgba(34,211,238,0.12)' : 'transparent',
                                    color: store.domainMode === mode ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                    transition: 'all var(--duration-fast)',
                                }}
                            >
                                {mode === 'time' ? '∿ Time Domain' : '📊 Frequency Domain'}
                            </button>
                        ))}
                    </div>

                    {/* Presets */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {(['square', 'sawtooth', 'am'] as const).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => store.loadPreset(preset)}
                                style={{
                                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                                    border: '1px solid var(--border-default)', background: 'transparent',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                    fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)',
                                    transition: 'all var(--duration-fast)',
                                }}
                            >
                                {preset.charAt(0).toUpperCase() + preset.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left - Channel Panel */}
                    <div style={{ width: 280, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 'var(--space-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                            Wave Channels ({store.channels.length}/8)
                        </div>

                        {store.channels.map((ch) => (
                            <motion.div
                                key={ch.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${ch.color}25`, padding: 'var(--space-3)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 'var(--radius-full)', background: ch.color, boxShadow: `0 0 8px ${ch.color}60` }} />
                                        <span style={{ fontFamily: 'var(--font-code)', fontSize: 'var(--text-xs)', color: ch.color, fontWeight: 600 }}>
                                            {ch.frequency.toFixed(0)}Hz
                                        </span>
                                    </div>
                                    <button onClick={() => store.removeChannel(ch.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: 4, borderRadius: 'var(--radius-sm)' }}
                                        aria-label={`Remove channel at ${ch.frequency}Hz`}
                                    >✕</button>
                                </div>
                                {/* Frequency */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', marginBottom: 2 }}>
                                        <span>Freq</span><span style={{ color: 'var(--text-secondary)' }}>{ch.frequency.toFixed(1)} Hz</span>
                                    </div>
                                    <input type="range" min={0.5} max={50} step={0.5} value={ch.frequency}
                                        onChange={(e) => store.updateChannel(ch.id, { frequency: Number(e.target.value) })} style={{ width: '100%' }}
                                        aria-label={`Frequency for channel ${ch.id}`} />
                                </div>
                                {/* Amplitude */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', marginBottom: 2 }}>
                                        <span>Amp</span><span style={{ color: 'var(--text-secondary)' }}>{ch.amplitude.toFixed(2)}</span>
                                    </div>
                                    <input type="range" min={0} max={2} step={0.05} value={ch.amplitude}
                                        onChange={(e) => store.updateChannel(ch.id, { amplitude: Number(e.target.value) })} style={{ width: '100%' }}
                                        aria-label={`Amplitude for channel ${ch.id}`} />
                                </div>
                                {/* Phase */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', marginBottom: 2 }}>
                                        <span>Phase</span><span style={{ color: 'var(--text-secondary)' }}>{ch.phase}°</span>
                                    </div>
                                    <input type="range" min={-180} max={180} step={1} value={ch.phase}
                                        onChange={(e) => store.updateChannel(ch.id, { phase: Number(e.target.value) })} style={{ width: '100%' }}
                                        aria-label={`Phase for channel ${ch.id}`} />
                                </div>
                            </motion.div>
                        ))}

                        <button
                            onClick={() => store.addChannel()}
                            disabled={store.channels.length >= 8}
                            style={{
                                padding: '10px', borderRadius: 'var(--radius-md)',
                                border: '1px dashed var(--border-default)', background: 'transparent',
                                color: store.channels.length >= 8 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                                cursor: store.channels.length >= 8 ? 'not-allowed' : 'pointer',
                                fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)',
                                transition: 'all var(--duration-fast)',
                            }}
                            aria-label="Add wave channel"
                        >
                            + Add Channel
                        </button>
                    </div>

                    {/* Right - Canvas Area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative', minHeight: 400 }}>
                        {store.domainMode === 'time' && (
                            <canvas
                                ref={timeDomainRef}
                                style={{ width: '100%', height: '100%', display: 'block' }}
                            />
                        )}
                        {store.domainMode === 'frequency' && (
                            <canvas
                                ref={freqDomainRef}
                                style={{ width: '100%', height: '100%', display: 'block' }}
                            />
                        )}

                        {/* Domain switch overlay button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => store.setDomainMode(store.domainMode === 'time' ? 'frequency' : 'time')}
                            style={{
                                position: 'absolute', bottom: 16, right: 16,
                                padding: '8px 20px', borderRadius: 'var(--radius-full)',
                                background: 'var(--accent-cyan)', border: 'none',
                                color: '#050810', cursor: 'pointer', fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-body)', fontWeight: 600,
                                boxShadow: 'var(--glow-cyan)',
                            }}
                        >
                            {store.domainMode === 'time' ? 'View Frequency Domain →' : 'View Time Domain →'}
                        </motion.button>
                    </div>
                </div>
            </div>
        </ModuleShell>
    );
}
