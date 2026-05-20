export function SimplePage({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-slate-300 mt-2">{body}</p>
    </section>
  );
}
