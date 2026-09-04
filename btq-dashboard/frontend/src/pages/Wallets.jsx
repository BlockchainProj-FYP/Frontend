import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [details, setDetails] = useState({});
  const [newName, setNewName] = useState('');

  const load = async () => {
    const list = await rpc('listwallets');
    setWallets(list);
    const d = {};
    for (const w of list) {
      try {
        const [info, bal] = await Promise.all([rpc('getwalletinfo', [], w), rpc('getbalance', [], w)]);
        d[w] = { info, bal };
      } catch { d[w] = null; }
    }
    setDetails(d);
  };

  useEffect(() => { load(); }, []);

  const createWallet = async () => {
    if (!newName) return;
    await rpc('createwallet', [newName]);
    setNewName('');
    load();
  };

  return (
    <div>
      <h1>Wallets</h1>
      <div className="row">
        <input placeholder="new wallet name" value={newName} onChange={e => setNewName(e.target.value)} />
        <button onClick={createWallet}>Create wallet</button>
        <button onClick={load}>Refresh</button>
      </div>
      <div className="stat-grid">
        {wallets.map(w => (
          <div className="card wide" key={w}>
            <div className="card-label">{w}</div>
            <div className="card-value">{details[w]?.bal ?? '…'} BTQ</div>
            <div className="mono small">
              tx count: {details[w]?.info?.txcount ?? '?'} · keypool: {details[w]?.info?.keypoolsize ?? '?'} · descriptors: {String(details[w]?.info?.descriptors)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}