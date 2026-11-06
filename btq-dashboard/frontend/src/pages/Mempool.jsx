import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Mempool() {
  const [entries, setEntries] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setEntries(await rpc('getrawmempool', [true]));
      setError('');
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); const timer = setInterval(load, 5000); return () => clearInterval(timer); }, []);

  return (
    <div>
      <h1>Mempool</h1>
      {error && <div className="error">{error}</div>}
      <button onClick={load}>Refresh</button>
      <table className="table">
        <thead><tr><th>txid</th><th>vsize</th><th>fee</th><th>time</th></tr></thead>
        <tbody>
          {Object.entries(entries).map(([txid, entry]) => (
            <tr key={txid}>
              <td className="mono truncate" title={txid}>{txid}</td>
              <td>{entry.vsize}</td>
              <td>{entry.fees?.base ?? entry.fee ?? '—'}</td>
              <td>{new Date(entry.time * 1000).toLocaleString()}</td>
            </tr>
          ))}
          {Object.keys(entries).length === 0 && <tr><td colSpan={4}>No unconfirmed transactions</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
