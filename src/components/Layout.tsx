import { NavLink, Outlet } from 'react-router-dom';

const links = [
  ['/', 'Radar'],
  ['/themes', 'Themes'],
  ['/streams', 'Streams'],
  ['/decisions', 'Decisions'],
  ['/content', 'Content'],
  ['/export', 'Export']
];

export function Layout() {
  return (
    <div className="max-w-md mx-auto min-h-screen pb-20">
      <header className="p-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur z-20">
        <h1 className="text-xl font-semibold">TRND_FLWR · Phase 1</h1>
        <p className="text-xs text-slate-400">Civilization trend intelligence</p>
      </header>
      <main className="p-4 space-y-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800">
        <div className="max-w-md mx-auto grid grid-cols-6 text-xs">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `p-3 text-center ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
