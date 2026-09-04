import { useEffect, useState } from 'react';
import { rpc } from '../api';

const TYPES = ['legacy', 'p2sh-segwit', 'bech32', 'bech32m', 'p2mr'];
const STORAGE_KEY = 'btq_generated_addresses';

export default function Addresses() {
  const [wallets, setWallets] = useState([]);
  const [wallet, setWallet] = useState('');
  const [addrs, setAddrs] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  const [detail, setDetail] = useState(null);

  useEffect(() => { rpc('listwallets').then(w => { setWallets(w); if (w[0]) setWallet(w[0]); }); }, []);

  const persist = (next) => { setAddrs(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };

  const generate = async (type) => {
    if (!wallet) return;
    const addr = await rpc('getnewaddress', ['', type], wallet);
    persist({ ...addrs, [wallet]: [...(addrs[wallet] || []), { addr, type }] });
  };

  const inspect = async (addr) => setDetail(await rpc('getaddressinfo', [addr], wallet));
  const copy = (addr) => navigator.clipboard.writeText(addr);

  return (
    <div>
      <h1>Addresses</h1>
      <div className="row">
        <select value={wallet} onChange={e => setWallet(e.target.value)}>
          {wallets.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        {TYPES.map(t => <button key={t} onClick={() => generate(t)}>+ {t}</button>)}
      </div>
      <table className="table">
        <thead><tr><th>type</th><th>address</th><th></th></tr></thead>
        <tbody>
          {(addrs[wallet] || []).map((a, i) => (
            <tr key={i} className={a.type === 'p2mr' ? 'row-pqc' : ''}>
              <td><span className={`badge ${a.type === 'p2mr' ? 'badge-pqc' : 'badge-classical'}`}>{a.type}</span></td>
              <td className="mono">{a.addr}</td>
              <td><button onClick={() => copy(a.addr)}>copy</button> <button onClick={() => inspect(a.addr)}>info</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {detail && (
        <div className="panel">
          <h3>Address info</h3>
          <pre className="mono">{JSON.stringify(detail, null, 2)}</pre>
          <button onClick={() => setDetail(null)}>close</button>
        </div>
      )}
    </div>
  );
}