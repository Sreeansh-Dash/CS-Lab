// src/modules/pathfinding/PathfindingModule.tsx
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { ModuleShell } from '../../components/layout/ModuleShell';
import { StepController } from '../../components/ui/StepController';
import { usePathfindingStore } from './store/pathfindingStore';
import { useAppStore } from '../../store/appStore';
import { bfs } from './algorithms/bfs';
import { dfs } from './algorithms/dfs';
import { dijkstra } from './algorithms/dijkstra';
import { astar } from './algorithms/astar';
import { getAlgorithmColor, getAlgorithmLabel, coordKey } from './utils/gridHelpers';
import type { AlgorithmId, GridCoord, GridCell } from '../../types/graph.types';
import { motion } from 'framer-motion';

const ALGO_LIST: AlgorithmId[] = ['bfs', 'dfs', 'dijkstra', 'astar'];
const algoFns = { bfs, dfs, dijkstra, astar };

// BASE_STEP_DURATION_MS = 60 at 1× speed → ~16 steps/sec
const BASE_STEP_DURATION_MS = 60;

// ── Single Algorithm Canvas ──
function AlgoCanvas({
    algorithmId,
    grid,
    gridSize,
    startPos,
    endPos,
    steps,
    currentStep,
    cellSize,
    onCellInteract,
    isWinner,
    nodesExplored,
    pathLength,
}: {
    algorithmId: AlgorithmId;
    grid: GridCell[][];
    gridSize: number;
    startPos: GridCoord;
    endPos: GridCoord;
    steps: { type: string; node: GridCoord }[];
    currentStep: number;
    cellSize: number;
    onCellInteract?: (coord: GridCoord) => void;
    isWinner?: boolean;
    nodesExplored: number;
    pathLength: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasSize = cellSize * gridSize;
    const algoColor = getAlgorithmColor(algorithmId);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize * dpr;
        canvas.height = canvasSize * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Draw grid
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = grid[r][c];
                const x = c * cellSize;
                const y = r * cellSize;

                if (cell.type === 'wall') {
                    ctx.fillStyle = '#172035';
                    ctx.fillRect(x, y, cellSize, cellSize);
                    // Cross-hatch pattern
                    ctx.strokeStyle = 'rgba(99, 130, 255, 0.15)';
                    ctx.lineWidth = 0.5;
                    const step = Math.max(4, cellSize / 3);
                    for (let i = -cellSize; i < cellSize * 2; i += step) {
                        ctx.beginPath();
                        ctx.moveTo(x + i, y);
                        ctx.lineTo(x + i + cellSize, y + cellSize);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x + i + cellSize, y);
                        ctx.lineTo(x + i, y + cellSize);
                        ctx.stroke();
                    }
                } else if (cell.type === 'weighted') {
                    const t = (cell.weight - 1) / 9;
                    ctx.fillStyle = `rgba(77, 124, 254, ${0.08 + t * 0.35})`;
                    ctx.fillRect(x, y, cellSize, cellSize);
                    if (cellSize > 14) {
                        ctx.fillStyle = 'rgba(237,242,255,0.5)';
                        ctx.font = `${Math.max(9, cellSize / 3)}px JetBrains Mono`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(String(cell.weight), x + cellSize / 2, y + cellSize / 2);
                    }
                } else {
                    ctx.fillStyle = 'rgba(237,242,255,0.015)';
                    ctx.fillRect(x, y, cellSize, cellSize);
                }

                // Grid lines
                ctx.strokeStyle = 'rgba(99, 130, 255, 0.06)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // Draw explored cells up to currentStep
        if (steps.length > 0) {
            const exploreSteps = steps.filter((s) => s.type === 'explore');
            const stepsToShow = exploreSteps.slice(0, currentStep);

            for (let i = 0; i < stepsToShow.length; i++) {
                const step = stepsToShow[i];
                const x = step.node.col * cellSize;
                const y = step.node.row * cellSize;
                const isLast = i === stepsToShow.length - 1;

                // Fill with algorithm color
                ctx.fillStyle = algoColor + '35';
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                // Pulse effect on latest explored cell
                if (isLast) {
                    ctx.fillStyle = algoColor + '60';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }
            }

            // Draw path if all explore steps are shown
            if (currentStep >= exploreSteps.length) {
                const pathSteps = steps.filter((s) => s.type === 'path');

                // Path cells with glow
                for (const ps of pathSteps) {
                    const x = ps.node.col * cellSize;
                    const y = ps.node.row * cellSize;
                    ctx.fillStyle = algoColor + '70';
                    ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                }

                // Path line
                if (pathSteps.length > 1) {
                    ctx.strokeStyle = algoColor;
                    ctx.lineWidth = Math.max(2, cellSize / 6);
                    ctx.shadowColor = algoColor;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    for (let i = 0; i < pathSteps.length; i++) {
                        const px = pathSteps[i].node.col * cellSize + cellSize / 2;
                        const py = pathSteps[i].node.row * cellSize + cellSize / 2;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Draw start node - glowing emerald circle
        const sx = startPos.col * cellSize + cellSize / 2;
        const sy = startPos.row * cellSize + cellSize / 2;
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(sx, sy, cellSize / 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, cellSize / 2.8)}px DM Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', sx, sy + 1);

        // Draw end node - rose target circle
        const ex = endPos.col * cellSize + cellSize / 2;
        const ey = endPos.row * cellSize + cellSize / 2;
        ctx.fillStyle = '#F43F5E';
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ex, ey, cellSize / 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Inner ring for target look
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ex, ey, cellSize / 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, ey, cellSize / 10, 0, Math.PI * 2);
        ctx.fill();

    }, [grid, gridSize, startPos, endPos, steps, currentStep, cellSize, canvasSize, algoColor]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onCellInteract) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasSize / rect.width;
        const scaleY = canvasSize / rect.height;
        const col = Math.floor((e.clientX - rect.left) * scaleX / cellSize);
        const row = Math.floor((e.clientY - rect.top) * scaleY / cellSize);
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
            onCellInteract({ row, col });
        }
    }, [canvasSize, cellSize, gridSize, onCellInteract]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            background: 'var(--bg-base)',
        }}>
            {/* Algorithm Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: 'var(--radius-full)',
                        background: algoColor,
                        boxShadow: `0 0 8px ${algoColor}80`,
                    }} />
                    <span style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: algoColor,
                    }}>
                        {getAlgorithmLabel(algorithmId)}
                    </span>
                    {isWinner && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            style={{
                                fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-code)',
                                fontWeight: 700,
                                color: '#10B981',
                                background: 'rgba(16,185,129,0.1)',
                                padding: '1px 8px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid rgba(16,185,129,0.3)',
                            }}
                        >
                            WINNER
                        </motion.span>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    fontFamily: 'var(--font-code)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                }}>
                    <span>Nodes: {nodesExplored}</span>
                    <span>Path: {pathLength || '—'}</span>
                </div>
            </div>

            {/* Canvas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2)' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasSize}
                    height={canvasSize}
                    onMouseDown={handleMouseDown}
                    style={{
                        width: canvasSize,
                        height: canvasSize,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        cursor: 'crosshair',
                        borderRadius: 'var(--radius-sm)',
                    }}
                />
            </div>
        </div>
    );
}


export default function PathfindingModule() {
    const store = usePathfindingStore();
    const playbackSpeed = useAppStore((s) => s.playbackSpeed);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const singleCanvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const currentStepRef = useRef(0);

    const cellSize = useMemo(() => {
        const maxPx = store.raceMode ? 280 : 560;
        const cs = Math.floor(maxPx / store.gridSize);
        return Math.max(cs, 18); // min 18px per cell
    }, [store.gridSize, store.raceMode]);

    const canvasSize = cellSize * store.gridSize;

    // Run algorithm(s)
    const runAlgorithm = useCallback(() => {
        const { grid, startPos, endPos, selectedAlgorithm, raceMode, heuristic } = store;
        const algorithms = raceMode ? ALGO_LIST : [selectedAlgorithm];
        const results = algorithms.map((algoId) => {
            const fn = algoFns[algoId];
            const result = fn(grid, startPos, endPos, heuristic);
            return { algorithmId: algoId, ...result };
        });

        store.setResults(results);
        const maxSteps = Math.max(...results.map((r) => r.steps.length));
        store.setTotalSteps(maxSteps);
        store.setCurrentStep(0);

        const log = results.flatMap((r) =>
            r.steps
                .filter((s) => s.type === 'explore')
                .map((s, i) => ({
                    step: i,
                    description: `[${getAlgorithmLabel(r.algorithmId)}] Explored (${s.node.row},${s.node.col})`,
                    highlightedNodes: [coordKey(s.node)],
                    highlightColor: getAlgorithmColor(r.algorithmId),
                }))
        );
        store.setStepLog(log.slice(0, 200));
    }, [store]);

    // Animation loop — FIXED: 60ms base instead of 500ms
    useEffect(() => {
        if (!store.isPlaying) return;
        currentStepRef.current = store.currentStep;

        const animate = (timestamp: number) => {
            const interval = BASE_STEP_DURATION_MS / playbackSpeed;
            if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
            if (timestamp - lastTimeRef.current >= interval) {
                lastTimeRef.current = timestamp;
                const next = currentStepRef.current + 1;
                if (next < store.totalSteps) {
                    currentStepRef.current = next;
                    store.setCurrentStep(next);
                } else {
                    store.setIsPlaying(false);
                    return;
                }
            }
            rafRef.current = requestAnimationFrame(animate);
        };

        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [store.isPlaying, playbackSpeed, store.totalSteps]);

    // Cell interaction handler
    const handleCellInteraction = useCallback((coord: GridCoord) => {
        const { drawMode, weightValue, startPos, endPos } = store;
        if (coord.row === startPos.row && coord.col === startPos.col) return;
        if (coord.row === endPos.row && coord.col === endPos.col) return;

        switch (drawMode) {
            case 'wall':
                store.setCellType(coord.row, coord.col,
                    store.grid[coord.row][coord.col].type === 'wall' ? 'empty' : 'wall');
                break;
            case 'erase':
                store.setCellType(coord.row, coord.col, 'empty', 1);
                break;
            case 'weight':
                store.setCellType(coord.row, coord.col, 'weighted', weightValue);
                break;
            case 'start':
                store.setStartPos(coord);
                break;
            case 'end':
                store.setEndPos(coord);
                break;
        }
    }, [store]);

    // Single-canvas rendering (for single mode)
    useEffect(() => {
        if (store.raceMode) return;
        const canvas = singleCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize * dpr;
        canvas.height = canvasSize * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Draw grid
        for (let r = 0; r < store.gridSize; r++) {
            for (let c = 0; c < store.gridSize; c++) {
                const cell = store.grid[r][c];
                const x = c * cellSize;
                const y = r * cellSize;

                if (cell.type === 'wall') {
                    ctx.fillStyle = '#172035';
                    ctx.fillRect(x, y, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(99,130,255,0.12)';
                    ctx.lineWidth = 0.5;
                    const step = Math.max(4, cellSize / 3);
                    for (let i = -cellSize; i < cellSize * 2; i += step) {
                        ctx.beginPath();
                        ctx.moveTo(x + i, y); ctx.lineTo(x + i + cellSize, y + cellSize); ctx.stroke();
                    }
                } else if (cell.type === 'weighted') {
                    const t = (cell.weight - 1) / 9;
                    ctx.fillStyle = `rgba(77,124,254,${0.08 + t * 0.35})`;
                    ctx.fillRect(x, y, cellSize, cellSize);
                    if (cellSize > 14) {
                        ctx.fillStyle = 'rgba(237,242,255,0.5)';
                        ctx.font = `${Math.max(9, cellSize / 3)}px JetBrains Mono`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(String(cell.weight), x + cellSize / 2, y + cellSize / 2);
                    }
                } else {
                    ctx.fillStyle = 'rgba(237,242,255,0.015)';
                    ctx.fillRect(x, y, cellSize, cellSize);
                }
                ctx.strokeStyle = 'rgba(99,130,255,0.06)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // Explored + path for single algorithm
        if (store.results.length > 0) {
            for (const result of store.results) {
                const exploreSteps = result.steps.filter(s => s.type === 'explore');
                const stepsToShow = exploreSteps.slice(0, store.currentStep);
                const color = getAlgorithmColor(result.algorithmId);

                for (const step of stepsToShow) {
                    const x = step.node.col * cellSize;
                    const y = step.node.row * cellSize;
                    ctx.fillStyle = color + '35';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }

                if (store.currentStep >= exploreSteps.length) {
                    const pathSteps = result.steps.filter(s => s.type === 'path');
                    for (const ps of pathSteps) {
                        ctx.fillStyle = color + '70';
                        ctx.fillRect(ps.node.col * cellSize + 2, ps.node.row * cellSize + 2, cellSize - 4, cellSize - 4);
                    }
                    if (pathSteps.length > 1) {
                        ctx.strokeStyle = color; ctx.lineWidth = 3;
                        ctx.shadowColor = color; ctx.shadowBlur = 10;
                        ctx.beginPath();
                        pathSteps.forEach((ps, i) => {
                            const px = ps.node.col * cellSize + cellSize / 2;
                            const py = ps.node.row * cellSize + cellSize / 2;
                            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                        });
                        ctx.stroke(); ctx.shadowBlur = 0;
                    }
                }
            }
        }

        // Start node
        const sx = store.startPos.col * cellSize + cellSize / 2;
        const sy = store.startPos.row * cellSize + cellSize / 2;
        ctx.fillStyle = '#10B981'; ctx.shadowColor = '#10B981'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(sx, sy, cellSize / 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, cellSize / 2.8)}px DM Sans`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('S', sx, sy + 1);

        // End node
        const ex = store.endPos.col * cellSize + cellSize / 2;
        const ey = store.endPos.row * cellSize + cellSize / 2;
        ctx.fillStyle = '#F43F5E'; ctx.shadowColor = '#F43F5E'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(ex, ey, cellSize / 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ex, ey, cellSize / 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex, ey, cellSize / 10, 0, Math.PI * 2); ctx.fill();

    }, [store.grid, store.gridSize, store.startPos, store.endPos, store.results, store.currentStep, cellSize, canvasSize, store.raceMode]);

    // Mouse handlers for single canvas
    const getGridCoord = useCallback((e: React.MouseEvent<HTMLCanvasElement>): GridCoord | null => {
        const canvas = singleCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasSize / rect.width;
        const scaleY = canvasSize / rect.height;
        const col = Math.floor((e.clientX - rect.left) * scaleX / cellSize);
        const row = Math.floor((e.clientY - rect.top) * scaleY / cellSize);
        if (row >= 0 && row < store.gridSize && col >= 0 && col < store.gridSize) {
            return { row, col };
        }
        return null;
    }, [canvasSize, cellSize, store.gridSize]);

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsMouseDown(true);
        const coord = getGridCoord(e);
        if (coord) handleCellInteraction(coord);
    }, [getGridCoord, handleCellInteraction]);

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isMouseDown) return;
        const coord = getGridCoord(e);
        if (coord && store.drawMode !== 'start' && store.drawMode !== 'end') {
            handleCellInteraction(coord);
        }
    }, [isMouseDown, getGridCoord, handleCellInteraction, store.drawMode]);

    const onMouseUp = useCallback(() => setIsMouseDown(false), []);

    // Compute winner for race mode
    const winner = useMemo(() => {
        if (!store.raceMode || store.results.length < 2) return null;
        let minExplored = Infinity;
        let winnerId: AlgorithmId | null = null;
        for (const r of store.results) {
            const exploreCount = r.steps.filter(s => s.type === 'explore').length;
            if (r.pathLength > 0 && exploreCount < minExplored) {
                minExplored = exploreCount;
                winnerId = r.algorithmId;
            }
        }
        // Only show winner when all algorithms complete
        const allDone = store.results.every(r => {
            const exploreCount = r.steps.filter(s => s.type === 'explore').length;
            return store.currentStep >= exploreCount;
        });
        return allDone ? winnerId : null;
    }, [store.results, store.raceMode, store.currentStep]);

    const setActiveModule = useAppStore((s) => s.setActiveModule);
    useEffect(() => {
        setActiveModule('pathfinding');
        return () => setActiveModule(null);
    }, [setActiveModule]);

    return (
        <ModuleShell title="Pathfinding Playground" subtitle="Visualize graph traversal algorithms in real-time" accentColor="#00D4FF" moduleClass="module-pathfinding">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Personality Header */}
                <div style={{ padding: '4px 16px', background: '#00D4FF20', color: '#00D4FF', fontFamily: 'var(--font-code)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>PATHFINDER v2.1</span>
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.span>
                </div>
                {/* Top Control Bar */}
                <div
                    style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap',
                        background: 'var(--bg-surface)',
                    }}
                >
                    {/* Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        padding: 2,
                        gap: 2,
                    }}>
                        <button
                            onClick={() => { if (store.raceMode) store.toggleRaceMode(); }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: !store.raceMode ? 600 : 400,
                                background: !store.raceMode ? 'var(--accent-blue)' + '20' : 'transparent',
                                color: !store.raceMode ? 'var(--accent-blue)' : 'var(--text-muted)',
                                transition: 'all var(--duration-fast)',
                            }}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => { if (!store.raceMode) store.toggleRaceMode(); }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: store.raceMode ? 600 : 400,
                                background: store.raceMode ? 'var(--accent-blue)' + '20' : 'transparent',
                                color: store.raceMode ? 'var(--accent-blue)' : 'var(--text-muted)',
                                transition: 'all var(--duration-fast)',
                            }}
                        >
                            🏁 Race Mode
                        </button>
                    </div>

                    {/* Algorithm Tabs (single mode only) */}
                    {!store.raceMode && (
                        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                            {ALGO_LIST.map((algo) => (
                                <button
                                    key={algo}
                                    onClick={() => store.setSelectedAlgorithm(algo)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-code)',
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 600,
                                        background: store.selectedAlgorithm === algo ? getAlgorithmColor(algo) + '20' : 'transparent',
                                        color: store.selectedAlgorithm === algo ? getAlgorithmColor(algo) : 'var(--text-muted)',
                                        transition: 'all var(--duration-fast)',
                                    }}
                                >
                                    {getAlgorithmLabel(algo)}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Step Controller */}
                    <StepController
                        onPlay={() => { runAlgorithm(); store.play(); }}
                        onPause={() => store.pause()}
                        onStepForward={() => store.stepForward()}
                        onStepBackward={() => store.stepBackward()}
                        onReset={() => store.reset()}
                        currentStep={store.currentStep}
                        totalSteps={store.totalSteps}
                        isPlaying={store.isPlaying}
                        accentColor="#4D7CFE"
                    />
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Left Tool Panel */}
                    <div
                        style={{
                            width: 200,
                            borderRight: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            padding: 'var(--space-4)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-4)',
                            overflowY: 'auto',
                        }}
                    >
                        {/* Draw Mode */}
                        <div>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                                Draw Tool
                            </label>
                            {(['wall', 'erase', 'weight', 'start', 'end'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => store.setDrawMode(mode)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '8px 12px',
                                        marginBottom: 2,
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'var(--text-sm)',
                                        textAlign: 'left',
                                        background: store.drawMode === mode ? 'var(--accent-blue)' + '18' : 'transparent',
                                        color: store.drawMode === mode ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        fontWeight: store.drawMode === mode ? 500 : 400,
                                        transition: 'all var(--duration-fast)',
                                    }}
                                >
                                    {mode === 'wall' && '▦ Wall'}
                                    {mode === 'erase' && '◻ Erase'}
                                    {mode === 'weight' && '⊘ Weight'}
                                    {mode === 'start' && '● Start'}
                                    {mode === 'end' && '◎ End'}
                                </button>
                            ))}
                        </div>

                        {/* Weight Slider */}
                        {store.drawMode === 'weight' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 'var(--space-1)' }}>
                                    Weight: <span style={{ fontFamily: 'var(--font-code)', color: 'var(--accent-blue)' }}>{store.weightValue}</span>
                                </label>
                                <input
                                    type="range" min={1} max={10}
                                    value={store.weightValue}
                                    onInput={(e) => store.setWeightValue(Number((e.target as HTMLInputElement).value))}
                                    style={{ width: '100%' }}
                                    aria-label="Cell weight"
                                />
                            </motion.div>
                        )}

                        {/* Grid Size */}
                        <div>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 'var(--space-1)' }}>
                                Grid: <span style={{ fontFamily: 'var(--font-code)', color: 'var(--accent-blue)' }}>{store.gridSize}×{store.gridSize}</span>
                            </label>
                            <input
                                type="range" min={10} max={50} step={5}
                                value={store.gridSize}
                                onInput={(e) => store.setGridSize(Number((e.target as HTMLInputElement).value))}
                                style={{ width: '100%' }}
                                aria-label="Grid size"
                            />
                        </div>

                        {/* Heuristic */}
                        {(store.selectedAlgorithm === 'astar' || store.raceMode) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                                    A* Heuristic
                                </label>
                                {(['manhattan', 'euclidean', 'chebyshev'] as const).map((h) => (
                                    <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="radio" name="heuristic" checked={store.heuristic === h} onChange={() => store.setHeuristic(h)} />
                                        {h.charAt(0).toUpperCase() + h.slice(1)}
                                    </label>
                                ))}
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'auto' }}>
                            <button
                                onClick={() => store.initGrid()}
                                style={{
                                    padding: '10px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--accent-rose)',
                                    background: 'transparent',
                                    color: 'var(--accent-rose)',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 'var(--text-sm)',
                                }}
                            >
                                Clear Grid
                            </button>
                        </div>
                    </div>

                    {/* Center - Canvas Area */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--space-4)',
                            background: 'var(--bg-base)',
                            overflow: 'auto',
                        }}
                    >
                        {store.raceMode ? (
                            /* RACE MODE: 2×2 Grid of canvases */
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 'var(--space-3)',
                                maxWidth: '100%',
                            }}>
                                {ALGO_LIST.map((algoId) => {
                                    const result = store.results.find(r => r.algorithmId === algoId);
                                    return (
                                        <AlgoCanvas
                                            key={algoId}
                                            algorithmId={algoId}
                                            grid={store.grid}
                                            gridSize={store.gridSize}
                                            startPos={store.startPos}
                                            endPos={store.endPos}
                                            steps={result?.steps || []}
                                            currentStep={store.currentStep}
                                            cellSize={cellSize}
                                            onCellInteract={handleCellInteraction}
                                            isWinner={winner === algoId}
                                            nodesExplored={result?.nodesExplored || 0}
                                            pathLength={result?.pathLength || 0}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            /* SINGLE MODE: One large canvas */
                            <canvas
                                ref={singleCanvasRef}
                                width={canvasSize}
                                height={canvasSize}
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={onMouseUp}
                                onMouseLeave={onMouseUp}
                                style={{
                                    width: canvasSize,
                                    height: canvasSize,
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    cursor: store.drawMode === 'wall' ? 'crosshair' : 'pointer',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Bottom Stats Bar */}
                <div
                    style={{
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        padding: 'var(--space-3) var(--space-4)',
                        overflowX: 'auto',
                    }}
                >
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        {store.results.map((result) => (
                            <motion.div
                                key={result.algorithmId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: `1px solid ${getAlgorithmColor(result.algorithmId)}25`,
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-2) var(--space-3)',
                                    minWidth: 150,
                                }}
                            >
                                <div style={{
                                    fontFamily: 'var(--font-code)',
                                    fontSize: 'var(--text-sm)',
                                    color: getAlgorithmColor(result.algorithmId),
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: 'var(--radius-full)',
                                        background: getAlgorithmColor(result.algorithmId),
                                    }} />
                                    {getAlgorithmLabel(result.algorithmId)}
                                    {winner === result.algorithmId && (
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)' }}>★</span>
                                    )}
                                </div>
                                <div style={{ fontFamily: 'var(--font-code)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    <div>Explored: {result.nodesExplored}</div>
                                    <div>Path: {result.pathLength || 'N/A'}</div>
                                    <div>Ops: {result.operationCount}</div>
                                </div>
                            </motion.div>
                        ))}
                        {store.results.length === 0 && (
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                Press ▶ to run algorithms and see comparison stats
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </ModuleShell>
    );
}
