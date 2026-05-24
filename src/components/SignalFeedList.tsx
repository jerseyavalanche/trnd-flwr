import type { SignalItem } from '../types/signals'
import { EmptyState } from './EmptyState'
import { SignalFeedItem } from './SignalFeedItem'

type SignalFeedListProps = {
  signals: SignalItem[]
}

export function SignalFeedList({ signals }: SignalFeedListProps) {
  if (signals.length === 0) return <EmptyState />

  return (
    <section className="pb-24">
      {signals.map((signal) => (
        <SignalFeedItem key={signal.id} signal={signal} />
      ))}
    </section>
  )
}
