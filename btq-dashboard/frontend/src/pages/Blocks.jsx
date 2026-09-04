import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Blocks() {
  const [tip, setTip] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [mineAddr, setMineAddr] = useState('');

  const load = async () => {
    const res = await fetch('/api/blocks?limit=20');
    const data = await res.json();
    setTip(data.tip);
    setBlocks(data.blocks);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 2500); // picks up newly mined blocks automatically
    return () => clearInterval(id);
  }, []);

  const inspectBlock = (block) => { setSelectedTx(null); setSelected(block); };

  const mine = async () => {
    if (!mineAddr) return alert('paste an address');
    await rpc('generatetoaddress', [1, mineAddr], null);
    setTimeout(load, 500); // small delay so the cache refresh (triggered server-side) lands first
  };

  return (
    <div>
      <h1>Blocks {tip != null && `(tip: ${tip})`}</h1>
      <div className="row">
        <input placeholder="address to mine to" value={mineAddr} onChange={e => setMineAddr(e.target.value)} style={{width: 420}} />
        <button onClick={mine}>Mine 1 block</button>
      </div>
      <div className="chain-scroll">
        {blocks.map((b, i) => (
          <div key={b.hash} className="chain-block" onClick={() => inspectBlock(b)}>
            <div className="chain-block-height">#{b.height}</div>
            <div className="mono small truncate">{b.hash}</div>
            <div className="small">{b.tx.length} tx · {b.size}B</div>
            <div className="small">{new Date(b.time * 1000).toLocaleTimeString()}</div>
            {i < blocks.length - 1 && <div className="chain-link" />}
          </div>
        ))}
      </div>

      {selected && !selectedTx && (
        <div className="panel">
          <h3>Block #{selected.height}</h3>
          <div className="mono small">hash: {selected.hash}</div>
          <div className="mono small">merkleroot: {selected.merkleroot}</div>
          <table className="table">
            <thead><tr><th>txid</th><th>type</th><th>in</th><th>out</th></tr></thead>
            <tbody>
              {selected.tx.map(t => (
                <tr key={t.txid} className="clickable" onClick={() => setSelectedTx(t)}>
                  <td className="mono truncate">{t.txid}</td>
                  <td>{t.vin[0]?.coinbase !== undefined ? 'coinbase' : 'transfer'}</td>
                  <td>{t.vin.length}</td>
                  <td>{t.vout.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setSelected(null)}>close</button>
        </div>
      )}

      {selectedTx && (
        <div className="panel">
          <h3>Transaction detail</h3>
          <div className="mono small">txid: {selectedTx.txid}</div>
          <div className="mono small">size: {selectedTx.size}B · vsize: {selectedTx.vsize}B</div>

          <h4>Inputs (from)</h4>
          {selectedTx.vin[0]?.coinbase !== undefined ? (
            <div className="small">coinbase (newly mined, no source address)</div>
          ) : (
            <table className="table">
              <thead><tr><th>prev txid</th><th>vout</th><th>from address</th><th>amount</th></tr></thead>
              <tbody>
                {selectedTx.vin.map((v, i) => (
                  <tr key={i}>
                    <td className="mono truncate">{v.txid}</td>
                    <td>{v.vout}</td>
                    <td className="mono truncate">{v.prevout?.scriptPubKey?.address ?? '—'}</td>
                    <td>{v.prevout?.value ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4>Outputs (to)</h4>
          <table className="table">
            <thead><tr><th>to address</th><th>amount</th><th>type</th></tr></thead>
            <tbody>
              {selectedTx.vout.map((v, i) => (
                <tr key={i} className={v.scriptPubKey.type === 'witness_v2_p2mr' ? 'row-pqc' : ''}>
                  <td className="mono truncate">{v.scriptPubKey.address ?? '(no address / unspendable)'}</td>
                  <td>{v.value}</td>
                  <td><span className={`badge ${v.scriptPubKey.type === 'witness_v2_p2mr' ? 'badge-pqc' : 'badge-classical'}`}>{v.scriptPubKey.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={() => setSelectedTx(null)}>back to block</button>
          <button onClick={() => { setSelectedTx(null); setSelected(null); }}>close</button>
        </div>
      )}
    </div>
  );
}