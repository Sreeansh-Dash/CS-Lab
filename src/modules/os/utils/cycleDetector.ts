// src/modules/os/utils/cycleDetector.ts
import type { RAGGraph, DeadlockResult, CoffmanConditions } from '../../../types/os.types';

/**
 * Detect deadlock in a Resource Allocation Graph
 * - For single-instance resources: DFS-based cycle detection on wait-for graph
 * - For multi-instance resources: simplified Banker's algorithm safety check
 */
export function detectDeadlock(graph: RAGGraph): DeadlockResult {
    const { nodes, edges } = graph;
    const processes = nodes.filter((n) => n.type === 'process');
    const resources = nodes.filter((n) => n.type === 'resource');
    
    // Check if any resource has > 1 instances
    const isMultiInstance = resources.some(r => (r.instances || 1) > 1);

    const cycles: string[][] = [];
    let hasDeadlock = false;
    let safeSequence: string[] | undefined;

    if (!isMultiInstance) {
        // --- Single Instance: DFS Cycle Detection ---
        const waitFor = new Map<string, Set<string>>();
        for (const p of processes) {
            waitFor.set(p.id, new Set());
        }

        for (const process of processes) {
            const requestedResources = edges
                .filter((e) => e.from === process.id && e.type === 'request')
                .map((e) => e.to);
            for (const resId of requestedResources) {
                const holders = edges
                    .filter((e) => e.from === resId && e.type === 'assignment')
                    .map((e) => e.to);
                for (const holderId of holders) {
                    if (holderId !== process.id) waitFor.get(process.id)?.add(holderId);
                }
            }
        }

        const visited = new Set<string>();
        const recStack = new Set<string>();

        function dfs(nodeId: string, path: string[]): boolean {
            visited.add(nodeId);
            recStack.add(nodeId);
            path.push(nodeId);

            const neighbors = waitFor.get(nodeId) || new Set();
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor, path)) return true;
                } else if (recStack.has(neighbor)) {
                    const cycleStart = path.indexOf(neighbor);
                    const cycle = path.slice(cycleStart);
                    cycle.push(neighbor);

                    const fullCycle: string[] = [];
                    for (let i = 0; i < cycle.length - 1; i++) {
                        fullCycle.push(cycle[i]);
                        const requestEdges = edges.filter((e) => e.from === cycle[i] && e.type === 'request');
                        for (const re of requestEdges) {
                            const assignEdges = edges.filter((e) => e.from === re.to && e.type === 'assignment' && e.to === cycle[i + 1]);
                            if (assignEdges.length > 0) {
                                fullCycle.push(re.to);
                                break;
                            }
                        }
                    }
                    fullCycle.push(cycle[0]);
                    cycles.push(fullCycle);
                    return true;
                }
            }
            recStack.delete(nodeId);
            path.pop();
            return false;
        }

        for (const process of processes) {
            if (!visited.has(process.id)) dfs(process.id, []);
        }

        hasDeadlock = cycles.length > 0;
        if (!hasDeadlock && processes.length > 0) safeSequence = processes.map((p) => p.id);
        
    } else {
        // --- Multi-Instance: Banker's Deadlock Detection Algorithm ---
        const allocation = new Map<string, Map<string, number>>();
        const request = new Map<string, Map<string, number>>();
        const available = new Map<string, number>();

        // Init resources
        for (const r of resources) {
            let totalAssigned = 0;
            edges.filter(e => e.from === r.id && e.type === 'assignment').forEach(() => totalAssigned++);
            available.set(r.id, (r.instances || 1) - totalAssigned);
        }

        // Init processes
        for (const p of processes) {
            const pAlloc = new Map<string, number>();
            const pReq = new Map<string, number>();
            for (const r of resources) {
                pAlloc.set(r.id, 0);
                pReq.set(r.id, 0);
            }
            allocation.set(p.id, pAlloc);
            request.set(p.id, pReq);
        }

        // Fill alloc/request from edges
        for (const e of edges) {
            if (e.type === 'assignment') {
                const rId = e.from;
                const pId = e.to;
                const pMap = allocation.get(pId);
                if (pMap) pMap.set(rId, (pMap.get(rId) || 0) + 1);
            } else if (e.type === 'request') {
                const pId = e.from;
                const rId = e.to;
                const pReq = request.get(pId);
                if (pReq) pReq.set(rId, (pReq.get(rId) || 0) + 1);
            }
        }

        // Execute Detection
        const work = new Map(available);
        const finish = new Map<string, boolean>();
        processes.forEach(p => {
            const allocs = Array.from(allocation.get(p.id)?.values() || []);
            const hasAlloc = allocs.some(v => v > 0);
            finish.set(p.id, !hasAlloc);
        });

        const seq: string[] = [];
        let madeProgress = true;
        while (madeProgress) {
            madeProgress = false;
            for (const p of processes) {
                if (!finish.get(p.id)) {
                    // Check if request <= work
                    const pReq = request.get(p.id)!;
                    let canSatisfy = true;
                    for (const r of resources) {
                        if ((pReq.get(r.id) || 0) > (work.get(r.id) || 0)) {
                            canSatisfy = false;
                            break;
                        }
                    }
                    if (canSatisfy) {
                        // Work = Work + Allocation
                        const pAlloc = allocation.get(p.id)!;
                        for (const r of resources) {
                            work.set(r.id, (work.get(r.id) || 0) + (pAlloc.get(r.id) || 0));
                        }
                        finish.set(p.id, true);
                        seq.push(p.id);
                        madeProgress = true;
                    }
                }
            }
        }

        const deadlockedProcs = processes.filter(p => !finish.get(p.id)).map(p => p.id);
        hasDeadlock = deadlockedProcs.length > 0;
        if (hasDeadlock) {
            cycles.push(deadlockedProcs); // Represent deadlock group as a single array for visualization/warning
        } else {
            // Append processes that had 0 allocation to safe sequence (they trivially finish)
            processes.forEach(p => {
                if (!seq.includes(p.id)) seq.push(p.id);
            });
            safeSequence = seq;
        }
    }

    const coffmanConditions: CoffmanConditions = {
        mutualExclusion: resources.some((r) => (r.instances || 1) === 1),
        holdAndWait: processes.some((p) => {
            const holds = edges.filter((e) => e.to === p.id && e.type === 'assignment');
            const requests = edges.filter((e) => e.from === p.id && e.type === 'request');
            return holds.length > 0 && requests.length > 0;
        }),
        noPreemption: true,
        circularWait: hasDeadlock,
    };

    return { hasDeadlock, cycles, coffmanConditions, safeSequence };
}
