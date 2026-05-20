import { useRadar } from './useRadar';

export function DecisionsPage() {
  const { data } = useRadar();
  const top = [...data.signals].sort((a,b)=>b.score-a.score).slice(0,3);
  return <section className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-semibold">Decisions Engine</h2><p className="text-xs text-slate-400 mt-1">Top priority by derived signal score.</p><ul className="mt-2 space-y-2 text-sm">{top.map(s=><li key={s.id}>{s.title} · {s.source} · {s.score.toFixed(2)}</li>)}</ul></section>;
}
