# BTQ dashboard

The React frontend talks to a local Express proxy, which forwards RPC requests to one BTQ Core regtest node. Each operator keeps their own RPC credentials in `server/.env`; never commit that file.

## Setup on each machine

1. Install Node.js compatible with the versions in the package lockfiles.
2. In `server`, run `npm ci`, copy `.env.example` to `.env`, and set `RPC_USER` and `RPC_PASS` to match that machine's local `btq.conf`. Keep `HOST=127.0.0.1`.
3. In `frontend`, run `npm ci` and `npm run build`.
4. In `server`, run `npm start`. The production dashboard is available at `http://127.0.0.1:4000` on that machine.

For frontend development, start the server first, then run `npm run dev` in `frontend`. Vite proxies `/api` to the local server.

For a remote VM, open an SSH tunnel from your computer:

```bash
ssh -L 4000:127.0.0.1:4000 ubuntu@VM_IP
```

Then open `http://127.0.0.1:4000` locally. If local port 4000 is occupied, use `-L 4001:127.0.0.1:4000` and open port 4001 instead.

The proxy controls one node at a time through `RPC_URL`. It has no user login, so do not expose its port publicly.
