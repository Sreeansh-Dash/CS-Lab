// src/modules/os/components/BankersTable.tsx
import { useOSStore } from '../store/osStore';

export function BankersTable() {
    const store = useOSStore();
    const processes = store.nodes.filter(n => n.type === 'process');
    const resources = store.nodes.filter(n => n.type === 'resource');
    
    const isMultiInstance = resources.some(r => (r.instances || 1) > 1);
    if (!isMultiInstance || processes.length === 0 || resources.length === 0) return null;

    // Compute matrices
    const available = new Map<string, number>();
    for (const r of resources) {
        let assigned = 0;
        store.edges.filter(e => e.from === r.id && e.type === 'assignment').forEach(() => assigned++);
        available.set(r.id, (r.instances || 1) - assigned);
    }

    const allocList = processes.map(p => {
        const alloc = resources.map(r => store.edges.filter(e => e.from === r.id && e.to === p.id && e.type === 'assignment').length);
        const req = resources.map(r => store.edges.filter(e => e.from === p.id && e.to === r.id && e.type === 'request').length);
        return { p, alloc, req };
    });

    return (
        <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)', maxHeight: 250, overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--color-accent-primary)', marginBottom: 'var(--space-3)' }}>
                Banker's Algorithm Table
            </div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-code)' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: 8 }}>Process</th>
                        <th style={{ padding: 8 }}>Allocation<br/><span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{resources.map(r => r.label).join(' ')}</span></th>
                        <th style={{ padding: 8 }}>Request<br/><span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{resources.map(r => r.label).join(' ')}</span></th>
                        <th style={{ padding: 8 }}>Available<br/><span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{resources.map(r => r.label).join(' ')}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {allocList.map((item, idx) => (
                        <tr key={item.p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: 8, color: 'var(--color-text-secondary)' }}>{item.p.label}</td>
                            <td style={{ padding: 8, letterSpacing: 4 }}>{item.alloc.join(' ')}</td>
                            <td style={{ padding: 8, letterSpacing: 4 }}>{item.req.join(' ')}</td>
                            {idx === 0 ? (
                                <td rowSpan={allocList.length} style={{ padding: 8, verticalAlign: 'top', letterSpacing: 4, color: '#10B981' }}>
                                    {resources.map(r => available.get(r.id)).join(' ')}
                                </td>
                            ) : null}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
