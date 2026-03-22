// src/modules/dataStructures/DataStructuresModule.tsx
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { ModuleShell } from '../../components/layout/ModuleShell';
import { StepController } from '../../components/ui/StepController';
import { useDSStore } from './store/dsStore';
import { useAppStore } from '../../store/appStore';
import { bubbleSort } from './algorithms/bubbleSort';
import { insertionSort } from './algorithms/insertionSort';
import { selectionSort } from './algorithms/selectionSort';
import { mergeSort } from './algorithms/mergeSort';
import { heapSort } from './algorithms/heapSort';
import { quickSort } from './algorithms/quickSort';
import { shellSort } from './algorithms/shellSort';
import { countingSort } from './algorithms/countingSort';
import { radixSort } from './algorithms/radixSort';
import type { SortAlgorithmId, SortStep } from '../../types/algorithm.types';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_STEP_DURATION_MS = 60;

const ALGO_FNS: Record<SortAlgorithmId, (arr: number[]) => SortStep[]> = {
    bubble: bubbleSort,
    insertion: insertionSort,
    selection: selectionSort,
    merge: mergeSort,
    heap: heapSort,
    quick: quickSort,
    shell: shellSort,
    counting: countingSort,
    radix: radixSort,
};

const ALGO_LABELS: Record<SortAlgorithmId, string> = {
    bubble: 'Bubble Sort',
    insertion: 'Insertion Sort',
    selection: 'Selection Sort',
    merge: 'Merge Sort',
    heap: 'Heap Sort',
    quick: 'Quick Sort',
    shell: 'Shell Sort',
    counting: 'Counting Sort',
    radix: 'Radix Sort',
};

const ALGO_COLORS: Record<SortAlgorithmId, string> = {
    bubble: '#22D3EE',
    insertion: '#10B981',
    selection: '#FB923C',
    merge: '#8B5CF6',
    heap: '#F43F5E',
    quick: '#8B5CF6',
    shell: '#22D3EE',
    counting: '#84CC16',
    radix: '#F59E0B',
};

const ALGO_COMPLEXITY: Record<SortAlgorithmId, { best: string; avg: string; worst: string }> = {
    bubble: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' },
    insertion: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' },
    selection: { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)' },
    merge: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
    heap: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
    quick: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)' },
    shell: { best: 'O(n log n)', avg: 'O(n^1.5)', worst: 'O(n²)' },
    counting: { best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n+k)' },
    radix: { best: 'O(nk)', avg: 'O(nk)', worst: 'O(nk)' },
};

const ALL_ALGOS: SortAlgorithmId[] = ['bubble', 'insertion', 'selection', 'merge', 'heap', 'quick', 'shell', 'counting', 'radix'];

// ── Sorting Lane Component ──
function SortingLane({
    algorithmId,
    steps,
    currentStep,
    maxVal,
}: {
    algorithmId: SortAlgorithmId;
    steps: SortStep[];
    currentStep: number;
    maxVal: number;
}) {
    const step = steps[Math.min(currentStep, steps.length - 1)];
    const arr = step?.array || [];
    const color = ALGO_COLORS[algorithmId];
    const complexity = ALGO_COMPLEXITY[algorithmId];
    const isDone = step?.type === 'sorted' && step.indices.length === arr.length;

    return (
        <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${isDone ? color + '40' : 'var(--border-subtle)'}`,
            overflow: 'hidden',
            transition: 'border-color 300ms',
        }}>
            {/* Header */}
            <div style={{
                padding: 'var(--space-2) var(--space-3)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-elevated)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{
                        width: 10, height: 10, borderRadius: 'var(--radius-full)',
                        background: color,
                        boxShadow: isDone ? `0 0 12px ${color}80` : 'none',
                    }} />
                    <span style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: color,
                    }}>
                        {ALGO_LABELS[algorithmId]}
                    </span>
                    {isDone && (
                        <span style={{
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-code)',
                            color: '#10B981',
                            background: 'rgba(16,185,129,0.1)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                        }}>✓</span>
                    )}
                </div>
                <div style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: 'var(--space-2)',
                }}>
                    <span>Avg: {complexity.avg}</span>
                    <span>|</span>
                    <span>Ops: {step?.operationCount || 0}</span>
                    <span>|</span>
                    <span>Swaps: {step?.swapCount || 0}</span>
                </div>
            </div>

            {/* Bar Visualization */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                height: 120,
                padding: 'var(--space-2) var(--space-2) 0',
            }}>
                {arr.map((val, i) => {
                    const heightPct = (val / maxVal) * 100;
                    const isComparing = step?.type === 'compare' && step.indices.includes(i);
                    const isSwapping = step?.type === 'swap' && step.indices.includes(i);
                    const isSorted = step?.type === 'sorted' && step.indices.includes(i);
                    const isActive = step?.type === 'active' && step.indices.includes(i);

                    let barColor = color + '50';
                    if (isComparing) barColor = '#F59E0B';
                    if (isSwapping) barColor = '#F43F5E';
                    if (isSorted) barColor = '#10B981';
                    if (isActive) barColor = color;

                    return (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: `${heightPct}%`,
                                background: barColor,
                                borderRadius: '2px 2px 0 0',
                                transition: 'height 80ms, background 80ms',
                                minWidth: 2,
                                maxWidth: 24,
                                boxShadow: (isComparing || isSwapping) ? `0 0 8px ${barColor}60` : 'none',
                            }}
                        />
                    );
                })}
            </div>

            {/* Progress bar */}
            <div style={{
                height: 3,
                background: 'var(--bg-elevated)',
                marginTop: 'var(--space-1)',
            }}>
                <div style={{
                    height: '100%',
                    width: `${steps.length > 0 ? (Math.min(currentStep + 1, steps.length) / steps.length) * 100 : 0}%`,
                    background: color,
                    transition: 'width 100ms',
                }} />
            </div>
        </div>
    );
}


// ── Linked List Visualization ──
function LinkedListPanel() {
    const store = useDSStore();
    const [insertVal, setInsertVal] = useState('');
    const [insertIdx, setInsertIdx] = useState('0');
    const [deleteIdx, setDeleteIdx] = useState('0');

    // Build ordered list from headId
    const orderedNodes = useMemo(() => {
        const result: typeof store.nodes = [];
        let currId = store.headId;
        const seen = new Set<string>();
        while (currId && !seen.has(currId)) {
            seen.add(currId);
            const node = store.nodes.find(n => n.id === currId);
            if (node) {
                result.push(node);
                currId = node.nextId;
            } else break;
        }
        return result;
    }, [store.nodes, store.headId]);

    const handleInsert = () => {
        const val = parseInt(insertVal);
        if (isNaN(val)) return;
        store.insertNode(val, parseInt(insertIdx) || 0);
        setInsertVal('');
    };

    const handleDelete = () => {
        store.deleteNode(parseInt(deleteIdx) || 0);
    };

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-code)',
        fontSize: 'var(--text-sm)',
        padding: '8px 12px',
        outline: 'none',
        width: 80,
    };

    const btnStyle: React.CSSProperties = {
        padding: '8px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        transition: 'all var(--duration-fast)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
            }}>
                {/* Insert */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Insert</span>
                    <input
                        type="number"
                        placeholder="Value"
                        value={insertVal}
                        onChange={e => setInsertVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInsert()}
                        style={inputStyle}
                        aria-label="Insert value"
                    />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>at</span>
                    <input
                        type="number"
                        value={insertIdx}
                        onChange={e => setInsertIdx(e.target.value)}
                        style={{ ...inputStyle, width: 50 }}
                        aria-label="Insert at index"
                    />
                    <button onClick={handleInsert} style={{...btnStyle, borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)'}}>
                        Add
                    </button>
                </div>

                {/* Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Delete at</span>
                    <input
                        type="number"
                        value={deleteIdx}
                        onChange={e => setDeleteIdx(e.target.value)}
                        style={{ ...inputStyle, width: 50 }}
                        aria-label="Delete at index"
                    />
                    <button onClick={handleDelete} style={{...btnStyle, borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)'}}>
                        Remove
                    </button>
                </div>

                {/* Actions */}
                <button onClick={() => store.reverseList()} style={{...btnStyle, borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)'}}>
                    ↔ Reverse
                </button>
                <button onClick={() => store.resetList()} style={{...btnStyle, borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)'}}>
                    ⟳ Reset
                </button>
            </div>

            {/* Memory Block Visualization */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
                overflowX: 'auto',
                minHeight: 180,
            }}>
                {/* HEAD pointer */}
                <div style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-emerald)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--accent-emerald)',
                    background: 'rgba(16,185,129,0.08)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}>
                    HEAD →
                </div>

                <AnimatePresence mode="popLayout">
                    {orderedNodes.map((node, i) => (
                        <motion.div
                            key={node.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.6, y: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}
                        >
                            {/* Memory Block — 140×90px */}
                            <div style={{
                                width: 140,
                                height: 90,
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-default)',
                                background: 'var(--bg-surface)',
                                display: 'flex',
                                overflow: 'hidden',
                                position: 'relative',
                            }}>
                                {/* Data section */}
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRight: '1px solid var(--border-subtle)',
                                }}>
                                    <span style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 'var(--text-xl)',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                    }}>
                                        {node.data}
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--font-code)',
                                        fontSize: '9px',
                                        color: 'var(--text-muted)',
                                        marginTop: 2,
                                    }}>
                                        data
                                    </span>
                                </div>
                                {/* Next pointer section */}
                                <div style={{
                                    width: 50,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-elevated)',
                                    fontSize: '9px',
                                    fontFamily: 'var(--font-code)',
                                    color: 'var(--accent-cyan)',
                                }}>
                                    <span>{node.nextId ? '●→' : 'null'}</span>
                                    <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>next</span>
                                </div>

                                {/* Address label */}
                                <div style={{
                                    position: 'absolute',
                                    top: -1,
                                    left: 8,
                                    fontFamily: 'var(--font-code)',
                                    fontSize: '8px',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-base)',
                                    padding: '0 4px',
                                    transform: 'translateY(-50%)',
                                    borderRadius: 2,
                                }}>
                                    {node.address}
                                </div>

                                {/* Index label */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    left: 8,
                                    fontFamily: 'var(--font-code)',
                                    fontSize: '8px',
                                    color: 'var(--accent-blue)',
                                    opacity: 0.6,
                                }}>
                                    [{i}]
                                </div>
                            </div>

                            {/* Arrow to next */}
                            {node.nextId && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'var(--accent-cyan)',
                                    fontFamily: 'var(--font-code)',
                                    fontSize: 'var(--text-lg)',
                                    opacity: 0.6,
                                }}>
                                    →
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* NULL terminator */}
                <div style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-rose)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--accent-rose)',
                    background: 'rgba(244,63,94,0.08)',
                    flexShrink: 0,
                }}>
                    NULL
                </div>
            </div>
        </div>
    );
}


// ── Main Module ──
export default function DataStructuresModule() {
    const store = useDSStore();
    const playbackSpeed = useAppStore((s) => s.playbackSpeed);
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const currentStepRef = useRef(0);
    const [sortResults, setSortResults] = useState<Map<SortAlgorithmId, SortStep[]>>(new Map());

    const maxVal = useMemo(() => Math.max(...store.sortArray, 1), [store.sortArray]);

    const setActiveModule = useAppStore((s) => s.setActiveModule);
    useEffect(() => {
        setActiveModule('dataStructures');
        return () => setActiveModule(null);
    }, [setActiveModule]);

    // Run sorting race
    const runSort = useCallback(() => {
        const results = new Map<SortAlgorithmId, SortStep[]>();
        let maxSteps = 0;
        for (const algoId of store.activeAlgorithms) {
            const fn = ALGO_FNS[algoId];
            const steps = fn([...store.sortArray]);
            results.set(algoId, steps);
            if (steps.length > maxSteps) maxSteps = steps.length;
        }
        setSortResults(results);
        store.setTotalSteps(maxSteps);
        store.setCurrentStep(0);
    }, [store.activeAlgorithms, store.sortArray]);

    // Animation loop — FIXED: 60ms base with size scaling
    useEffect(() => {
        if (!store.isPlaying || store.activeSubModule !== 'sorting') return;
        currentStepRef.current = store.currentStep;

        // Scale speed with array size to prevent sluggish large-array sorts
        const sizeMultiplier = store.sortArraySize > 30 ? Math.min(store.sortArraySize / 20, 4) : 1;
        const interval = BASE_STEP_DURATION_MS / (playbackSpeed * sizeMultiplier);

        const animate = (timestamp: number) => {
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
    }, [store.isPlaying, playbackSpeed, store.totalSteps, store.activeSubModule, store.sortArraySize]);

    return (
        <ModuleShell title="Data Structures" subtitle="Sorting visualization race and interactive linked list" accentColor="#A855F7" moduleClass="module-datastructures">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Personality Header */}
                <div style={{ padding: '4px 16px', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', color: '#A855F7', fontFamily: 'var(--font-code)', fontSize: '11px', letterSpacing: '0.1em' }}>
                    MEM://HEAP_VISUALIZER
                </div>
                {/* Sub-Module Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: 'var(--space-2) var(--space-4)',
                    gap: 2,
                }}>
                    {(['linkedList', 'sorting'] as const).map(sub => (
                        <button
                            key={sub}
                            onClick={() => store.setActiveSubModule(sub)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: store.activeSubModule === sub ? 600 : 400,
                                background: store.activeSubModule === sub ? 'var(--accent-amber)' + '15' : 'transparent',
                                color: store.activeSubModule === sub ? 'var(--accent-amber)' : 'var(--text-muted)',
                                transition: 'all var(--duration-fast)',
                            }}
                        >
                            {sub === 'linkedList' ? '🔗 Linked List' : '📊 Sorting Race'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {store.activeSubModule === 'sorting' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                            {/* Sorting Controls */}
                            <div style={{
                                padding: 'var(--space-3) var(--space-4)',
                                borderBottom: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                flexWrap: 'wrap',
                                background: 'var(--bg-surface)',
                            }}>
                                {/* Algorithm Toggles */}
                                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {ALL_ALGOS.map(algo => (
                                        <button
                                            key={algo}
                                            onClick={() => store.toggleAlgorithm(algo)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: store.activeAlgorithms.includes(algo)
                                                    ? `1px solid ${ALGO_COLORS[algo]}50`
                                                    : '1px solid var(--border-subtle)',
                                                background: store.activeAlgorithms.includes(algo) ? ALGO_COLORS[algo] + '12' : 'transparent',
                                                color: store.activeAlgorithms.includes(algo) ? ALGO_COLORS[algo] : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-code)',
                                                fontSize: 'var(--text-xs)',
                                                fontWeight: 500,
                                                transition: 'all var(--duration-fast)',
                                            }}
                                        >
                                            {ALGO_LABELS[algo]}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ flex: 1 }} />

                                {/* Size Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <span style={{ fontFamily: 'var(--font-code)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        n={store.sortArraySize}
                                    </span>
                                    <input
                                        type="range" min={10} max={100} step={5}
                                        value={store.sortArraySize}
                                        onInput={(e) => store.setSortArraySize(Number((e.target as HTMLInputElement).value))}
                                        style={{ width: 100 }}
                                        aria-label="Array size"
                                    />
                                </div>

                                <button
                                    onClick={() => store.randomizeArray()}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-default)',
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                >
                                    🎲 Shuffle
                                </button>

                                <StepController
                                    onPlay={() => { runSort(); store.play(); }}
                                    onPause={() => store.pause()}
                                    onStepForward={() => store.stepForward()}
                                    onStepBackward={() => store.stepBackward()}
                                    onReset={() => store.reset()}
                                    currentStep={store.currentStep}
                                    totalSteps={store.totalSteps}
                                    isPlaying={store.isPlaying}
                                    accentColor="#A855F7"
                                />
                            </div>

                            {/* Sorting Lanes Grid */}
                            <div style={{
                                flex: 1,
                                display: 'grid',
                                gridTemplateColumns: `repeat(auto-fill, minmax(${store.activeAlgorithms.length > 4 ? '280px' : '360px'}, 1fr))`,
                                gap: 'var(--space-3)',
                                padding: 'var(--space-4)',
                                overflowY: 'auto',
                                minHeight: 0,
                            }}>
                                {store.activeAlgorithms.map(algoId => (
                                    <SortingLane
                                        key={algoId}
                                        algorithmId={algoId}
                                        steps={sortResults.get(algoId) || []}
                                        currentStep={store.currentStep}
                                        maxVal={maxVal}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <LinkedListPanel />
                    )}
                </div>
            </div>
        </ModuleShell>
    );
}
