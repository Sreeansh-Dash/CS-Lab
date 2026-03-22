// src/components/ui/ComplexityBadge.tsx
interface ComplexityBadgeProps {
    timeComplexity: string;
    spaceComplexity: string;
    bestCase?: string;
    worstCase?: string;
}

export function ComplexityBadge({ timeComplexity, spaceComplexity, bestCase, worstCase }: ComplexityBadgeProps) {
    return (
        <div
            style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
                fontFamily: 'var(--font-code)',
                fontSize: 'var(--font-size-xs)',
            }}
        >
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Time:</span>
                <span style={{ color: 'var(--color-accent-secondary)', fontWeight: 600 }}>{timeComplexity}</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Space:</span>
                <span style={{ color: 'var(--color-accent-primary)', fontWeight: 600 }}>{spaceComplexity}</span>
            </div>
            {bestCase && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Best:</span>
                    <span style={{ color: 'var(--color-accent-success)' }}>{bestCase}</span>
                </div>
            )}
            {worstCase && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Worst:</span>
                    <span style={{ color: 'var(--color-accent-danger)' }}>{worstCase}</span>
                </div>
            )}
        </div>
    );
}
