import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Overview() {
  const [info, setInfo] = useState(null);
  const [mempool, setMempool] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [peers, setPeers] = useState([]);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const [i, m, w, p] = await Promise.all([
        rpc('getblockchaininfo'), rpc('getmempoolinfo'), rpc('listwallets'), rpc('getpeerinfo'),
      ]);
      setInfo(i); setMempool(m); setWallets(w); setPeers(p); setErr(null);
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, []);

  return (
    <div>
      <h1>Overview</h1>
      {err && <div className="error">{err}</div>}
      <div className="stat-grid">
        <Stat label="Chain" value={info?.chain} />
        <Stat label="Blocks" value={info?.blocks} />
        <Stat label="Headers" value={info?.headers} />
        <Stat label="Difficulty" value={info?.difficulty?.toExponential(2)} />
        <Stat label="Verification" value={info ? (info.verificationprogress * 100).toFixed(1) + '%' : null} />
        <Stat label="Size on disk" value={info ? (info.size_on_disk / 1024).toFixed(1) + ' KB' : null} />
        <Stat label="Mempool txs" value={mempool?.size} />
        <Stat label="Mempool bytes" value={mempool?.bytes} />
        <Stat label="Wallets loaded" value={wallets.length} />
        <Stat label="Peers connected" value={peers.length} />
      </div>
      <h2>Wallets</h2>
      <div className="stat-grid">
        {wallets.map(w => <WalletMiniCard key={w} name={w} />)}
      </div>
    </div>
  );
}

function WalletMiniCard({ name }) {
  const [bal, setBal] = useState(null);
  useEffect(() => { rpc('getbalance', [], name).then(setBal).catch(() => {}); }, [name]);
  return (
    <div className="card">
      <div className="card-label">{name}</div>
      <div className="card-value">{bal ?? '…'}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value ?? '—'}</div>
    </div>
  );
}