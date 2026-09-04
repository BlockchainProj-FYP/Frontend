import { pushCommand } from './commandStore';

function formatParam(p) {
  if (typeof p === 'string') return `"${p}"`;
  if (typeof p === 'object') return `'${JSON.stringify(p)}'`;
  return String(p);
}

export async function rpc(method, params = [], wallet = null) {
  const cliString = (wallet ? `btq-cli -rpcwallet=${wallet} ` : 'btq-cli ') + method + ' ' + params.map(formatParam).join(' ');
  const start = performance.now();
  const res = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params, wallet }),
  });
  const data = await res.json();
  const durationMs = Math.round(performance.now() - start);
  const base = { method, params, wallet, cliString: cliString.trim(), durationMs, timestamp: new Date().toISOString() };
  if (!res.ok) {
    pushCommand({ ...base, status: 'error', result: data.error });
    throw new Error(data.error);
  }
  pushCommand({ ...base, status: 'ok', result: data.result });
  return data.result;
}