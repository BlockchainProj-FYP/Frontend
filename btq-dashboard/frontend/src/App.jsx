import { Routes, Route, NavLink } from 'react-router-dom';
import { useSyncExternalStore, useState } from 'react';
import { subscribe, getCommands } from './commandStore';
import Overview from './pages/Overview';
import Wallets from './pages/Wallets';
import Addresses from './pages/Addresses';
import Transactions from './pages/Transactions';
import Blocks from './pages/Blocks';
import Mempool from './pages/Mempool';
import Deployments from './pages/Deployments';
import Peers from './pages/Peers';
import Console from './pages/Console';
import History from './pages/History';

const NAV = [
  ['/', 'Overview'], ['/wallets', 'Wallets'], ['/addresses', 'Addresses'],
  ['/transactions', 'Transactions'], ['/blocks', 'Blocks'], ['/mempool', 'Mempool'],
  ['/deployments', 'Deployments'], ['/peers', 'Peers'], ['/console', 'Console'], ['/history', 'History'],
];

export default function App() {
  const commands = useSyncExternalStore(subscribe, getCommands);
  return (
    <div className="layout">
      <nav className="sidenav">
        <div className="brand">BTQ Admin</div>
        {NAV.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => isActive ? 'navlink active' : 'navlink'}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/blocks" element={<Blocks />} />
          <Route path="/mempool" element={<Mempool />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/peers" element={<Peers />} />
          <Route path="/console" element={<Console />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <aside className="cmdbar">
        <div className="cmdbar-title">Recent commands</div>
        {commands.slice(0, 12).map(c => <CommandRow key={c.id} c={c} />)}
        {commands.length === 0 && <div className="cmdbar-empty">Nothing run yet.</div>}
      </aside>
    </div>
  );
}

function CommandRow({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cmdrow ${c.status}`} onClick={() => setOpen(o => !o)}>
      <div className="cmdrow-cli">{c.cliString}</div>
      <div className="cmdrow-meta">{c.durationMs}ms · {c.status}</div>
      {open && <pre className="cmdrow-result">{JSON.stringify(c.result, null, 2)?.slice(0, 800)}</pre>}
    </div>
  );
}