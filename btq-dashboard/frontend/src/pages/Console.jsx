import { useState } from 'react';
import { rpc } from '../api';

export default function Console() {
  const [method, setMethod] = useState('getblockchaininfo');
  const [paramsText, setParamsText] = useState('[]');
  const [wallet, setWallet] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setError(null); setResult(null);
    let params;
    try { params = JSON.parse(paramsText); } catch { setError('params must be valid JSON array, e.g. [] or ["addr", 1.0]'); return; }
    try { setResult(await rpc(method, params, wallet || null)); }
    catch (e) { setError(e.message); }
  };

  return (
    <div>
      <h1>Raw RPC console</h1>
      <p className="small">Run any RPC method BTQ Core exposes — see <code>btq-cli help</code> on the VM for the full list.</p>
      <div className="row">
        <input placeholder="method e.g. getblockchaininfo" value={method} onChange={e => setMethod(e.target.value)} />
        <input placeholder="wallet (optional)" value={wallet} onChange={e => setWallet(e.target.value)} />
      </div>
      <textarea rows={3} value={paramsText} onChange={e => setParamsText(e.target.value)} className="mono" style={{width: '100%'}} />
      <button onClick={run}>Run</button>
      {error && <div className="error">{error}</div>}
      {result !== null && <pre className="mono">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}