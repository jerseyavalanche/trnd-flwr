import { SignalCard, StatusCard } from '../components/Cards';
import { useRadar } from './useRadar';

export function RadarPage() {
  const { data, loading } = useRadar();

  return (
    <>
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <h2 className="font-semibold">Civilization Regime</h2>
        <p className="text-cyan-300 text-sm mt-1">{data.regime?.label ?? 'Unavailable'}</p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-300">
          <p>Stability: {data.regime?.stability ?? 0}</p><p>Volatility: {data.regime?.volatility ?? 0}</p>
          <p>Mood Temp: {data.regime?.emotionalTemperature ?? 0}</p><p>Fragmentation: {data.regime?.fragmentation ?? 0}</p>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Rising Themes</h2>
        <div className="space-y-2">{data.themes?.slice(0, 6).map((t) => <div key={t.name} className="rounded-lg border border-slate-800 p-3 bg-slate-900"><p className="font-medium">{t.name}</p><p className="text-xs text-slate-400">strength {t.strength} · accel {t.acceleration} · confidence {t.confidence}</p><p className="text-xs text-slate-500 mt-1">{t.evidence.join(' · ')}</p></div>)}</div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Convergence Alerts</h2>
        <div className="space-y-2">{data.collisions?.slice(0, 4).map((c, i) => <div key={i} className="rounded-lg border border-slate-800 p-3 bg-slate-900 text-sm">{c.themes[0]} + {c.themes[1]} <span className="text-amber-300">score {c.score}</span></div>)}</div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Source Health</h2>
        <div className="space-y-2">{data.status.map((s) => <StatusCard key={s.source} item={s} />)}</div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Live Signals</h2>
        {loading && <p className="text-sm text-slate-400">Loading real sources…</p>}
        <div className="space-y-2">{data.signals.map((sig) => <SignalCard key={sig.id} signal={sig} />)}</div>
      </section>
    </>
  );
}
