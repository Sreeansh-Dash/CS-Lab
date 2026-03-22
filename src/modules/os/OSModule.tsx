// src/modules/os/OSModule.tsx
import { useEffect, useRef, useCallback, useState } from 'react';
import { ModuleShell } from '../../components/layout/ModuleShell';
import { useOSStore } from './store/osStore';
import { useAppStore } from '../../store/appStore';
import { motion } from 'framer-motion';
import { BankersTable } from './components/BankersTable';

const PROCESS_RADIUS = 28;
const RESOURCE_SIZE = 50;

export default function OSModule() {
    const store = useOSStore();
    const setActiveModule = useAppStore((s) => s.setActiveModule);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 700, h: 450 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [placementMode, setPlacementMode] = useState<'process' | 'resource' | null>(null);

    useEffect(() => {
        setActiveModule('os');
        return () => setActiveModule(null);
    }, [setActiveModule]);

    // Resize canvas
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const obs = new ResizeObserver(() => {
            setCanvasSize({ w: container.clientWidth, h: container.clientHeight });
        });
        obs.observe(container);
        return () => obs.disconnect();
    }, []);

    // Draw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize.w * dpr;
        canvas.height = canvasSize.h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

        // Determine cycle nodes/edges
        const cycleNodeIds = new Set<string>();
        for (const cycle of store.deadlockResult.cycles) {
            for (const id of cycle) cycleNodeIds.add(id);
        }

        // Draw edges
        for (const edge of store.edges) {
            const fromNode = store.nodes.find((n) => n.id === edge.from);
            const toNode = store.nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) continue;

            const isInCycle = cycleNodeIds.has(edge.from) && cycleNodeIds.has(edge.to);

            ctx.strokeStyle = isInCycle ? '#F43F5E' : edge.type === 'request' ? '#4D7CFE' : '#22D3EE';
            ctx.lineWidth = isInCycle ? 3 : 2;
            if (isInCycle) {
                ctx.shadowColor = '#F43F5E';
                ctx.shadowBlur = 8;
            }

            // Arrow
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / len;
            const ny = dy / len;

            const fromOffset = fromNode.type === 'process' ? PROCESS_RADIUS : RESOURCE_SIZE / 2;
            const toOffset = toNode.type === 'process' ? PROCESS_RADIUS : RESOURCE_SIZE / 2;

            const x1 = fromNode.x + nx * fromOffset;
            const y1 = fromNode.y + ny * fromOffset;
            const x2 = toNode.x - nx * toOffset;
            const y2 = toNode.y - ny * toOffset;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Arrowhead
            const arrowSize = 10;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            if (edge.type === 'assignment') ctx.fill();
            else ctx.stroke();

            ctx.shadowBlur = 0;
        }

        // Draw nodes
        for (const node of store.nodes) {
            const isInCycle = cycleNodeIds.has(node.id);
            const isSelected = store.selectedNodeId === node.id;

            if (node.type === 'process') {
                // Circle
                ctx.fillStyle = isInCycle ? 'rgba(244,63,94,0.2)' : 'rgba(77,124,254,0.15)';
                ctx.strokeStyle = isInCycle ? '#F43F5E' : isSelected ? '#4D7CFE' : '#4A5578';
                ctx.lineWidth = isSelected ? 3 : 2;
                if (isInCycle) { ctx.shadowColor = '#F43F5E'; ctx.shadowBlur = 12; }
                ctx.beginPath();
                ctx.arc(node.x, node.y, PROCESS_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Label
                ctx.fillStyle = '#EDF2FF';
                ctx.font = 'bold 14px DM Sans';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.label, node.x, node.y);
            } else {
                // Rectangle for resource
                const x = node.x - RESOURCE_SIZE / 2;
                const y = node.y - RESOURCE_SIZE / 2;
                ctx.fillStyle = isInCycle ? 'rgba(244,63,94,0.2)' : 'rgba(34,211,238,0.15)';
                ctx.strokeStyle = isInCycle ? '#F43F5E' : isSelected ? '#22D3EE' : '#4A5578';
                ctx.lineWidth = isSelected ? 3 : 2;
                if (isInCycle) { ctx.shadowColor = '#F43F5E'; ctx.shadowBlur = 12; }
                ctx.fillRect(x, y, RESOURCE_SIZE, RESOURCE_SIZE);
                ctx.strokeRect(x, y, RESOURCE_SIZE, RESOURCE_SIZE);
                ctx.shadowBlur = 0;

                // Label
                ctx.fillStyle = '#EDF2FF';
                ctx.font = 'bold 12px DM Sans';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.label, node.x, node.y - 8);

                // Instance dots
                const instances = node.instances || 1;
                const assignedCount = store.edges.filter((e) => e.from === node.id && e.type === 'assignment').length;
                const dotY = node.y + 10;
                const startX = node.x - (instances - 1) * 7;
                for (let i = 0; i < instances; i++) {
                    ctx.fillStyle = i < assignedCount ? '#22D3EE' : '#4A5578';
                    ctx.beginPath();
                    ctx.arc(startX + i * 14, dotY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Drawing preview line
        if (store.drawingFrom) {
            // We'll handle this via mouse events
        }

    }, [store.nodes, store.edges, store.selectedNodeId, store.deadlockResult, canvasSize]);

    // Canvas click handler
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked on a node
        const clickedNode = store.nodes.find((n) => {
            if (n.type === 'process') {
                return Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < PROCESS_RADIUS;
            } else {
                return Math.abs(n.x - x) < RESOURCE_SIZE / 2 && Math.abs(n.y - y) < RESOURCE_SIZE / 2;
            }
        });

        if (placementMode === 'process') {
            store.addProcess(x, y);
            setPlacementMode(null);
            return;
        }
        if (placementMode === 'resource') {
            store.addResource(x, y);
            setPlacementMode(null);
            return;
        }

        if (store.drawMode === 'draw' && clickedNode) {
            if (!store.drawingFrom) {
                store.setDrawingFrom(clickedNode.id);
                store.selectNode(clickedNode.id);
            } else {
                store.addEdge(store.drawingFrom, clickedNode.id);
                store.setDrawingFrom(null);
            }
        } else if (store.drawMode === 'select') {
            store.selectNode(clickedNode?.id || null);
        }
    }, [store, placementMode]);

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (store.drawMode === 'select') {
            const node = store.nodes.find((n) => {
                if (n.type === 'process') return Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < PROCESS_RADIUS;
                return Math.abs(n.x - x) < RESOURCE_SIZE / 2 && Math.abs(n.y - y) < RESOURCE_SIZE / 2;
            });
            if (node) {
                setDragging(node.id);
                store.selectNode(node.id);
            }
        }
    }, [store]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!dragging) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        store.moveNode(dragging, x, y);
    }, [dragging, store]);

    const handleCanvasMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    const selectedNode = store.nodes.find((n) => n.id === store.selectedNodeId);
    const deadlockColor = store.deadlockResult.hasDeadlock ? '#EF4444' : '#10B981';

    return (
        <ModuleShell title="OS — Deadlock Detection" subtitle="Resource Allocation Graph" accentColor="#EF4444" moduleClass="module-os">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Personality Header */}
                <div style={{ padding: '4px 16px', background: '#EF444420', borderBottom: '1px solid #EF444440', color: '#EF4444', fontFamily: 'var(--font-code)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>SYSTEM MONITOR</span>
                    <span>STATUS: NOMINAL</span>
                </div>
                {/* Header */}
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', background: 'var(--color-bg-surface)' }}>
                    <button onClick={() => setPlacementMode('process')}
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-primary)', background: placementMode === 'process' ? 'rgba(99,102,241,0.1)' : 'transparent', color: 'var(--color-accent-primary)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                        + Process
                    </button>
                    <button onClick={() => setPlacementMode('resource')}
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-secondary)', background: placementMode === 'resource' ? 'rgba(34,211,238,0.1)' : 'transparent', color: 'var(--color-accent-secondary)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                        + Resource
                    </button>
                    <button onClick={() => store.clearAll()}
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-danger)', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                        Clear All
                    </button>

                    {/* Demo Loader */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button onClick={() => store.loadDemo('classic')}
                            style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '10px' }}>
                            Classic Deadlock
                        </button>
                        <button onClick={() => store.loadDemo('safe')}
                            style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '10px' }}>
                            Safe State
                        </button>
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Mode */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                        {(['draw', 'select'] as const).map((mode) => (
                            <button key={mode} onClick={() => store.setDrawMode(mode)}
                                style={{
                                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)',
                                    background: store.drawMode === mode ? 'var(--color-accent-primary)20' : 'transparent',
                                    color: store.drawMode === mode ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', fontWeight: store.drawMode === mode ? 600 : 400
                                }}>
                                {mode === 'draw' ? '✏️ Draw' : '🖱️ Select'}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                        {(['request', 'assignment'] as const).map((type) => (
                            <button key={type} onClick={() => store.setEdgeType(type)}
                                style={{
                                    padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'var(--font-code)',
                                    background: store.edgeType === type ? (type === 'request' ? '#6366F120' : '#22D3EE20') : 'transparent',
                                    color: store.edgeType === type ? (type === 'request' ? '#6366F1' : '#22D3EE') : 'var(--color-text-muted)', fontWeight: store.edgeType === type ? 600 : 400
                                }}>
                                {type === 'request' ? 'P→R Request' : 'R→P Assign'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Panel */}
                    <div style={{ width: 220, borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto' }}>
                        {/* Selected Node */}
                        {selectedNode && (
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Selected: {selectedNode.label}</div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Type: {selectedNode.type}</div>
                                {selectedNode.type === 'resource' && (
                                    <div style={{ marginTop: 'var(--space-2)' }}>
                                        <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Instances: {selectedNode.instances}</label>
                                        <input type="range" min={1} max={4} value={selectedNode.instances || 1}
                                            onChange={(e) => store.updateResourceInstances(selectedNode.id, Number(e.target.value))} style={{ width: '100%' }} />
                                    </div>
                                )}
                                <button onClick={() => store.removeNode(selectedNode.id)}
                                    style={{ marginTop: 8, padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-danger)', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', fontSize: '10px', width: '100%' }}>
                                    Remove
                                </button>
                            </div>
                        )}

                        {/* Deadlock Status */}
                        <motion.div
                            animate={{ borderColor: deadlockColor }}
                            style={{
                                padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${deadlockColor}`,
                                background: `${deadlockColor}10`,
                            }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-sm)', color: deadlockColor, fontWeight: 700, marginBottom: 4 }}>
                                {store.deadlockResult.hasDeadlock ? '✗ DEADLOCK' : '● SAFE'}
                            </div>
                            {store.deadlockResult.hasDeadlock && store.deadlockResult.cycles.length > 0 && (
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-code)' }}>
                                    Cycle: {store.deadlockResult.cycles[0].join(' → ')}
                                </div>
                            )}
                            {!store.deadlockResult.hasDeadlock && store.deadlockResult.safeSequence && (
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-code)' }}>
                                    Safe: {store.deadlockResult.safeSequence.join(' → ')}
                                </div>
                            )}
                        </motion.div>

                        {/* Coffman Conditions */}
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Coffman Conditions</div>
                            {Object.entries(store.deadlockResult.coffmanConditions).map(([key, val]) => (
                                <motion.div
                                    key={key}
                                    animate={{ opacity: val ? 1 : 0.4 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2, fontSize: '10px', fontFamily: 'var(--font-code)' }}>
                                    <span style={{ color: val ? '#10B981' : '#4B5563' }}>{val ? '✓' : '○'}</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        {key === 'mutualExclusion' ? 'Mutual Exclusion' :
                                            key === 'holdAndWait' ? 'Hold & Wait' :
                                                key === 'noPreemption' ? 'No Preemption' : 'Circular Wait'}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Instructions */}
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            <strong>Draw mode:</strong> Click node A → node B to create an edge.
                            <br /><strong>Select mode:</strong> Click to select, drag to move.
                        </div>
                    </div>

                    {/* Main Area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Canvas */}
                        <div ref={containerRef} style={{ flex: 1, background: 'var(--color-bg-primary)', position: 'relative' }}>
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                style={{
                                    width: '100%', height: '100%', display: 'block',
                                    cursor: placementMode ? 'crosshair' : store.drawMode === 'draw' ? 'pointer' : dragging ? 'grabbing' : 'grab',
                                }}
                            />

                            {/* Placement hint */}
                            {placementMode && (
                                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: 'var(--color-accent-primary)', borderRadius: 'var(--radius-full)', color: '#fff', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                                    Click canvas to place {placementMode}
                                </div>
                            )}

                            {/* Drawing hint */}
                            {store.drawingFrom && (
                                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: 'var(--color-accent-warning)', borderRadius: 'var(--radius-full)', color: '#000', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-body)' }}>
                                    Click destination node to complete edge from {store.drawingFrom}
                                </div>
                            )}
                        </div>
                        {/* Banker's Table */}
                        <BankersTable />
                    </div>
                </div>
            </div>
        </ModuleShell>
    );
}
