import type { SourceConnectionStatus } from '../types/sources'

const statusClasses: Record<SourceConnectionStatus, string> = {
  live: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
  degraded: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber',
  offline: 'border-offline-red/50 bg-offline-red/10 text-offline-red',
  auth_needed: 'border-auth-amber/50 bg-auth-amber/10 text-auth-amber',
  limited: 'border-limited-blue/50 bg-limited-blue/10 text-limited-blue',
  planned: 'border-planned-gray/40 bg-planned-gray/10 text-planned-gray',
}

const statusLabels: Record<SourceConnectionStatus, string> = {
  live: 'LIVE',
  degraded: 'DEGRADED',
  offline: 'OFFLINE',
  auth_needed: 'AUTH NEEDED',
  limited: 'LIMITED',
  planned: 'PLANNED',
}

type SourceStatusBadgeProps = {
  status: SourceConnectionStatus
}

export function SourceStatusBadge({ status }: SourceStatusBadgeProps) {
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  )
}
