import { useRadar } from './useRadar';

export function ContentPage() {
  const { data } = useRadar();
  const points = data.signals.slice(0,5).map((s)=>`- ${s.title} (${s.source})`);
  return <section className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-semibold">Content Engine</h2><p className="text-sm text-slate-300 mt-2">Brief seed (source-linked):</p><pre className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">{points.join('\n') || 'No live signals available.'}</pre></section>;
}
