import { useRadar } from './useRadar';

export function ExportPage() {
  const { data } = useRadar();
  const json = JSON.stringify(data, null, 2);
  const txt = data.signals.map((s) => `[${s.source.toUpperCase()}] ${s.title} | score ${s.score}`).join('\n');
  const md = `# TRND_FLWR Snapshot\n\nGenerated: ${data.generatedAt}\n\n## Themes\n${data.themes.map((t) => `- ${t.name}: strength ${t.strength}, accel ${t.acceleration}`).join('\n')}\n\n## Signals\n${data.signals.map((s) => `- [${s.title}](${s.url})`).join('\n')}`;

  const save = (content: string, type: string, ext: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `trnd-flwr-${new Date().toISOString()}.${ext}`; a.click(); URL.revokeObjectURL(url);
  };

  return <section className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="font-semibold">Export Center</h2><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><button onClick={()=>navigator.clipboard.writeText(md)} className="rounded bg-slate-700 px-3 py-2">COPY SNAPSHOT</button><button onClick={()=>save(txt,'text/plain','txt')} className="rounded bg-slate-700 px-3 py-2">EXPORT TXT</button><button onClick={()=>save(json,'application/json','json')} className="rounded bg-cyan-500 text-black px-3 py-2 font-medium">EXPORT JSON</button><button onClick={()=>save(md,'text/markdown','md')} className="rounded bg-slate-700 px-3 py-2">EXPORT MARKDOWN</button></div></section>;
}
