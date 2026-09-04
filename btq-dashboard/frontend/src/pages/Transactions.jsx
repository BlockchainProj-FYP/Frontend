import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Transactions() {
  const [wallets, setWallets] = useState([]);
  const [wallet, setWallet] = useState('');
  const [txs, setTxs] = useState([]);
  const [decoded, setDecoded] = useState(null);

  useEffect(() => { rpc('listwallets').then(w => { setWallets(w); if (w[0]) setWallet(w[0]); }); }, []);
  useEffect(() => { if (wallet) load(); }, [wallet]);

  const load = async () => setTxs((await rpc('listtransactions', ['*', 30], wallet)).reverse());

  const inspect = async (txid) => {
    const tx = await rpc('gettransaction', [txid], wallet);
    const dec = await rpc('decoderawtransaction', [tx.hex]);
    setDecoded({ tx, dec });
  };

  return (
    <div>
      <h1>Transactions</h1>
      <div className="row">
        <select value={wallet} onChange={e => setWallet(e.target.value)}>
          {wallets.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <button onClick={load}>Refresh</button>
      </div>
      <table className="table">
        <thead><tr><th>category</th><th>amount</th><th>confs</th><th>address</th><th>txid</th></tr></thead>
        <tbody>
          {txs.map((t, i) => (
            <tr key={i} onClick={() => inspect(t.txid)} className="clickable">
              <td>{t.category}</td><td>{t.amount}</td><td>{t.confirmations}</td>
              <td className="mono truncate">{t.address}</td>
              <td className="mono truncate">{t.txid}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {decoded && (
        <div className="panel">
          <h3>Decoded transaction</h3>
          <div className="mono small">
            {decoded.dec.vout.map((v, i) => (
              <div key={i} className={v.scriptPubKey.type === 'witness_v2_p2mr' ? 'row-pqc' : ''}>
                vout {i}: {v.value} BTQ — <span className={`badge ${v.scriptPubKey.type === 'witness_v2_p2mr' ? 'badge-pqc' : 'badge-classical'}`}>{v.scriptPubKey.type}</span>
              </div>
            ))}
          </div>
          <pre className="mono">{JSON.stringify(decoded, null, 2)}</pre>
          <button onClick={() => setDecoded(null)}>close</button>
        </div>
      )}
    </div>
  );
}