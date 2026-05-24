import { useMemo } from 'react';
import { useRadar } from './useRadar';

export function ThemesPage() {
  const { data } = useRadar();
  const clusters = useMemo(() => {
    const map = new Map<string, number>();
    for (const sig of data.signals) map.set(sig.source, (map.get(sig.source) ?? 0) + 1);
    return [...map.entries()];
  }, [data.signals]);

  return <section className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-semibold">Themes</h2><ul className="mt-2 space-y-1 text-sm">{clusters.map(([k,v])=><li key={k}>{k.toUpperCase()}: {v} active signals</li>)}</ul></section>;
}
