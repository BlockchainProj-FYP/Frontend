import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Blocks() {
  const [tipHeight, setTipHeight] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mineAddr, setMineAddr] = useState('');

  const load = async () => {
    const info = await rpc('getblockchaininfo');
    setTipHeight(info.blocks);
    const start = Math.max(0, info.blocks - 19);
    const out = [];
    for (let h = info.blocks; h >= start; h--) {
      const hash = await rpc('getblockhash', [h]);
      out.push(await rpc('getblock', [hash, 1]));
    }
    setBlocks(out);
  };

  useEffect(() => { load(); }, []);

  const inspectBlock = async (hash) => setSelected(await rpc('getblock', [hash, 2]));

  const mine = async () => {
    if (!mineAddr) return alert('paste an address');
    await rpc('generatetoaddress', [1, mineAddr], null);
    load();
  };

  return (
    <div>
      <h1>Blocks {tipHeight != null && `(tip: ${tipHeight})`}</h1>
      <div className="row">
        <input placeholder="address to mine to" value={mineAddr} onChange={e => setMineAddr(e.target.value)} style={{width: 420}} />
        <button onClick={mine}>Mine 1 block</button>
        <button onClick={load}>Refresh</button>
      </div>
      <div className="chain-scroll">
        {blocks.map((b, i) => (
          <div key={b.hash} className="chain-block" onClick={() => inspectBlock(b.hash)}>
            <div className="chain-block-height">#{b.height}</div>
            <div className="mono small truncate">{b.hash}</div>
            <div className="small">{b.tx.length} tx · {b.size}B</div>
            <div className="small">{new Date(b.time * 1000).toLocaleTimeString()}</div>
            {i < blocks.length - 1 && <div className="chain-link" />}
          </div>
        ))}
      </div>
      {selected && (
        <div className="panel">
          <h3>Block #{selected.height}</h3>
          <div className="mono small">hash: {selected.hash}</div>
          <div className="mono small">merkleroot: {selected.merkleroot}</div>
          <div className="mono small">{selected.tx.length} transactions</div>
          <ul className="mono small">{selected.tx.map(t => <li key={t.txid} className="truncate">{t.txid}</li>)}</ul>
          <button onClick={() => setSelected(null)}>close</button>
        </div>
      )}
    </div>
  );
}