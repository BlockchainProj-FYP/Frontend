import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Peers() {
  const [peers, setPeers] = useState([]);
  const [addr, setAddr] = useState('');

  const load = async () => setPeers(await rpc('getpeerinfo'));
  useEffect(() => { load(); }, []);

  const addNode = async () => { if (!addr) return; await rpc('addnode', [addr, 'add']); setAddr(''); load(); };

  return (
    <div>
      <h1>Peers</h1>
      <div className="row">
        <input placeholder="127.0.0.1:19555" value={addr} onChange={e => setAddr(e.target.value)} />
        <button onClick={addNode}>Add node</button>
        <button onClick={load}>Refresh</button>
      </div>
      <table className="table">
        <thead><tr><th>addr</th><th>version</th><th>subver</th><th>inbound</th></tr></thead>
        <tbody>
          {peers.map((p, i) => <tr key={i}><td>{p.addr}</td><td>{p.version}</td><td>{p.subver}</td><td>{String(p.inbound)}</td></tr>)}
          {peers.length === 0 && <tr><td colSpan={4}>no peers connected</td></tr>}
        </tbody>
      </table>
    </div>
  );
}