import React, { useEffect, useState } from 'react';

export default function History() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);

  const load = async () => setEntries(await (await fetch('/api/history')).json());
  useEffect(() => { load(); }, []);

  const filtered = entries.filter(e =>
    !filter || e.method.toLowerCase().includes(filter.toLowerCase()) || (e.wallet || '').includes(filter)
  );

  return (
    <div>
      <h1>Command history</h1>
      <div className="row">
        <input placeholder="filter by method or wallet" value={filter} onChange={e => setFilter(e.target.value)} />
        <button onClick={load}>Refresh</button>
      </div>
      <table className="table">
        <thead><tr><th>time</th><th>method</th><th>wallet</th><th>status</th><th>ms</th></tr></thead>
        <tbody>
          {filtered.map((e, i) => (
            <React.Fragment key={i}>
              <tr className="clickable" onClick={() => setOpen(open === i ? null : i)}>
                <td className="small">{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td className="mono">{e.method}</td>
                <td>{e.wallet || '—'}</td>
                <td className={e.status === 'ok' ? 'ok' : 'error'}>{e.status}</td>
                <td>{e.durationMs}</td>
              </tr>
              {open === i && (
                <tr>
                  <td colSpan={5}>
                    <pre className="mono small">{JSON.stringify(e.params)}</pre>
                    <pre className="mono small">{JSON.stringify(e.result ?? e.error, null, 2)}</pre>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}