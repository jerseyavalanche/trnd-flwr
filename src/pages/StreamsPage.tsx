import { SignalCard, StatusCard } from '../components/Cards';
import { useRadar } from './useRadar';

export function StreamsPage() {
  const { data } = useRadar();
  return (
    <div className="space-y-4">
      <section>
        <h2 className="font-semibold mb-2">Signal Streams</h2>
        <p className="text-xs text-slate-400">Generated {new Date(data.generatedAt).toLocaleString()}</p>
      </section>
      <section className="space-y-2">{data.signals.map((sig) => <SignalCard key={sig.id} signal={sig} />)}</section>
      <section className="space-y-2">{data.status.map((s) => <StatusCard key={s.source} item={s} />)}</section>
    </div>
  );
}
