import { useEffect, useState } from 'react';
import { rpc } from '../api';

export default function Deployments() {
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState(null);
  const [mockDays, setMockDays] = useState(0);

  const load = async () => {
    try { setInfo(await rpc('getdeploymentinfo')); setErr(null); }
    catch { try { setInfo(await rpc('getblockchaininfo')); setErr('getdeploymentinfo not available — showing getblockchaininfo instead'); } catch (e2) { setErr(e2.message); } }
  };

  useEffect(() => { load(); }, []);

  const advanceTime = async () => {
    const seconds = Math.floor(Date.now() / 1000) + mockDays * 86400;
    await rpc('setmocktime', [seconds]);
    const wallets = await rpc('listwallets');
    const addr = await rpc('getnewaddress', ['', 'bech32m'], wallets[0]);
    await rpc('generatetoaddress', [1, addr], wallets[0]);
    load();
  };

  const resetTime = async () => { await rpc('setmocktime', [0]); load(); };

  return (
    <div>
      <h1>Deployments / Consensus</h1>
      {err && <div className="error">{err}</div>}
      <div className="row">
        <input type="number" value={mockDays} onChange={e => setMockDays(Number(e.target.value))} style={{width: 80}} />
        <span>days forward</span>
        <button onClick={advanceTime}>Advance mocktime + mine</button>
        <button onClick={resetTime}>Reset mocktime</button>
        <button onClick={load}>Refresh</button>
      </div>
      <pre className="mono">{JSON.stringify(info, null, 2)}</pre>
    </div>
  );
}