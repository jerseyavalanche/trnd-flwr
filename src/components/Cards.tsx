import type { Signal, SourceStatus } from '../types';

export function StatusCard({ item }: { item: SourceStatus }) {
  return (
    <div className="rounded-lg border border-slate-800 p-3 bg-slate-900">
      <div className="flex justify-between items-center">
        <span className="uppercase text-xs tracking-wide text-slate-400">{item.source}</span>
        <span className={item.status === 'ok' ? 'text-emerald-400 text-xs' : 'text-rose-400 text-xs'}>{item.status}</span>
      </div>
      <p className="text-sm mt-1">{item.detail}</p>
      <p className="text-[11px] text-slate-500 mt-1">{new Date(item.updatedAt).toLocaleString()}</p>
    </div>
  );
}

export function SignalCard({ signal }: { signal: Signal }) {
  return (
    <a href={signal.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-800 p-3 bg-slate-900">
      <div className="flex justify-between text-xs">
        <span className="text-cyan-400 uppercase">{signal.source}</span>
        <span className="text-slate-400">score {signal.score.toFixed(1)}</span>
      </div>
      <h3 className="font-medium mt-1">{signal.title}</h3>
      <p className="text-sm text-slate-300 mt-1">{signal.summary}</p>
    </a>
  );
}
