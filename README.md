# The Cost of Deadlines

**Empirical Dynamics of Post-Quantum Migration in Blockchain Systems**
*Using Bitcoin's Proposed BIP-360 / BIP-361 Migration Policy as a Controlled Case Study*

Senior Project (SProj) · Computer Science · LUMS · 2026

> Does the timing and enforcement of a post-quantum signature migration change a blockchain network's peak stress and cumulative infrastructure cost — even when two networks end up in exactly the same final, fully-migrated state?

---

## Table of Contents

- [Overview](#overview)
- [Research Question](#research-question)
- [Why This Matters](#why-this-matters)
- [Background](#background)
- [Research Framing](#research-framing)
- [System Architecture](#system-architecture)
- [Experimental Design](#experimental-design)
- [Metrics](#metrics)
- [Repository Structure](#repository-structure)
- [Infrastructure](#infrastructure)
- [Getting Started](#getting-started)
- [Scope Boundaries](#scope-boundaries)
- [Project Timeline](#project-timeline)
- [Team](#team)
- [Status](#status)
- [Citation](#citation)
- [Acknowledgments](#acknowledgments)

---

## Overview

Bitcoin's signatures rely on elliptic curve cryptography (secp256k1), which is secure against every classical computer in existence but is theoretically breakable by a sufficiently powerful quantum computer running Shor's algorithm. In response, Bitcoin developers have proposed a concrete, dated migration plan:

- **[BIP-360](https://github.com/bitcoin/bips)** introduces **P2MR** (Pay to Merkle Root), a new quantum-resistant address type built on the NIST-standardized **ML-DSA / Dilithium** (FIPS 204) lattice-based signature scheme.
- **[BIP-361](https://github.com/bitcoin/bips)** defines a three-phase **retirement plan** for legacy, quantum-vulnerable address types:
  - **Phase A** (~3 years / ~160,000 blocks post-activation): stop accepting *new* payments into legacy address types.
  - **Phase B** (~2 years after Phase A): stop verifying legacy ECDSA/Schnorr signatures entirely — any coins still sitting in a legacy address become **permanently frozen**.
  - **Phase C** (not yet designed): a future recovery mechanism for frozen coins. Out of scope for this project.

Post-quantum signatures are **40–70× larger** and **2–5× more expensive to verify** than what they replace. BIP-361 doesn't let the network absorb that cost gradually forever — it imposes two hard, dated deadlines after which the cost becomes non-negotiable. **Nobody has measured what actually happens to a network as it passes through those deadlines.**

This project builds a real, patched implementation of BIP-361's phased enforcement on top of **[btq-core](https://github.com/btq-ag/btq-core)** (an open-source Bitcoin Core fork implementing BIP-360), deploys it across a live 6-node regtest mesh on real cloud infrastructure, and empirically measures the difference between **gradual, voluntary migration** and **hard-deadline-enforced migration** — holding everything else constant.

---

## Research Question

> **How does the timing and enforcement of post-quantum signature migration affect blockchain block capacity, validation latency, and accumulated data overhead — and how do these effects differ between gradual, voluntary adoption and migration constrained by a hard, protocol-enforced deadline?**

A sharper question sits underneath this one:

> Can two networks that end up in **exactly the same final state** — fully migrated to post-quantum signatures — nonetheless experience very different **peak stress** and very different **cumulative infrastructure cost** along the way, purely as a function of how that migration was paced and enforced?

If so, *the path a migration takes matters just as much as its destination* — with direct implications for how a real deadline-based policy like BIP-361 should be designed.

---

## Why This Matters

- **Harvest now, decrypt later.** Every public key that has ever spent a Bitcoin transaction is visible forever on a public ledger. An adversary can record that data today and wait for a cryptographically relevant quantum computer (CRQC) to decrypt it. Roughly **a third of all circulating bitcoin** sits in addresses BIP-361 would eventually affect.
- **The literature has a gap, and it's a narrow one.** The general cost of post-quantum cryptography (signature sizes, verification overhead) is already well studied. What's missing is empirical measurement of what happens *at the moment a hard migration deadline arrives*, compared to what would have happened under organic, unforced migration. BIP-360 was merged in **February 2026**; BIP-361 followed as a draft in **April 2026** — the research literature has had essentially no time to catch up to a policy this specific.

---

## Background

<details>
<summary><strong>Why blockchains depend on digital signatures</strong></summary>

Every blockchain is fundamentally a decentralized ledger of who is allowed to move what, enforced by digital signatures. Bitcoin's signatures are built on secp256k1 elliptic curve cryptography — small (64–72 bytes), fast to verify, and computationally infeasible to break with any classical computer today.
</details>

<details>
<summary><strong>The quantum threat</strong></summary>

Using Shor's algorithm, a sufficiently powerful quantum computer could derive a private key from its corresponding public key in feasible time. No such computer exists today; credible estimates place its arrival anywhere from the late 2030s to well past 2050. Two things make this a present-tense engineering problem regardless: (1) internet-scale cryptographic migrations take years to design and roll out safely, and (2) the "harvest now, decrypt later" threat model means exposed public keys are already at risk.
</details>

<details>
<summary><strong>The post-quantum response</strong></summary>

NIST finalized its first post-quantum standards in 2024, including **ML-DSA** (FIPS 204, aka Dilithium) — a lattice-based signature scheme with a fundamentally different cost profile: signatures run from ~2,400 to over 4,600 bytes, 40–70× the size of the ECDSA signatures they replace.
</details>

---

## Research Framing

This project is explicit about what kind of evidence it produces:

- **This is a testbed, not a reimplementation.** Every layer except the BIP-361 phase-enforcement patch is consumed as-is from `btq-core` — a real Bitcoin Core fork, not a from-scratch stand-in.
- **The novelty claim is narrow, on purpose.** This project does not claim post-quantum blockchain overhead is unexplored — it isn't. The claim is specifically about *phase-aware, temporal dynamics under a dated enforcement policy*, and the difference between organic and deadline-driven migration.
- **This does not predict Bitcoin's actual future.** No numeric result from this project should be read as "Bitcoin will experience X." What it produces is **causal, relative evidence**: under a controlled abstraction of BIP-361's policy, does enforcement change peak stress and cumulative cost relative to the same migration left to happen gradually — and is that difference robust to reasonable changes in migration speed and adoption assumptions?

---

## System Architecture

| Module | Description |
|---|---|
| **Blockchain core** | `btq-core` — a real Bitcoin Core fork, run as genuine consensus-validating node processes, not an in-process simulation loop. |
| **Cryptographic interface** | `btq-core`'s existing ECDSA/Schnorr and ML-DSA (BIP-360 P2MR) implementations, consumed as-is. |
| **Transaction / UTXO model** | The real UTXO set maintained by each node, queried live over RPC (`gettxoutsetinfo`). |
| **Migration & phase engine** | Generates the adoption trajectory and enforces real Phase A/B consensus rules via a patch to `btq-core`'s validation code. |
| **Metrics & experiment runner** | Polls every node over RPC each round; automates the full experiment matrix across the 6-node mesh. |
| **Python analysis pipeline** | Turns raw logs into the figures and statistics reported in the final paper. |
| **Infrastructure & deployment** | Six free-tier Oracle Cloud VMs, networked as a private regtest mesh. |

**The one piece of consensus logic this project writes by hand** is BIP-361's phased sunset rule, patched directly into `btq-core`'s validation code:

- **Phase A** — added inside `CheckTxInputs`: rejects any transaction that would create a new output to a legacy address.
- **Phase B** — added inside `ConnectBlock` / `CheckInputScripts`: rejects verification of any legacy-signed transaction outright, freezing its UTXOs.

Both phases are gated by a configurable block-height threshold standing in for BIP-361's real-world timings (~160,000 blocks for Phase A, ~5 years total to Phase B), compressed via a documented time-compression constant reported verbatim in the paper.

---

## Experimental Design

### Core Experiments

The heart of the project is a controlled, three-condition comparison. **E1 and E2 share the exact same underlying adoption trajectory** — the only difference is whether Phase A/B enforcement is switched on. This is what makes the comparison causally interpretable.

| ID | Condition | Adoption Trajectory | Enforcement |
|---|---|---|---|
| **E0** | Classical baseline | 0% post-quantum | None |
| **E1** | Gradual migration | Fixed logistic trajectory `A(t)` | None |
| **E2** | Enforced migration | Same trajectory `A(t)` | Phase A + Phase B |

### Sensitivity Experiments

Varied one axis at a time against the fixed baseline (never a full factorial grid) to confirm the core result isn't an artifact of one arbitrary configuration:

| ID | Variable | Levels | Priority |
|---|---|---|---|
| **S1** | Migration speed (curve steepness) | Slow / Medium / Fast | Required |
| **S2** | Adoption curve shape | Logistic / Linear | Required |
| **S3** | System capacity (block/tx limits) | Low / Medium / High | Recommended |

### Reproducibility

Every run records: random seed, cryptographic scheme/parameters, node count and VM shape, adoption curve type and parameters, phase-boundary block heights, capacity settings, the exact Git commit of the BIP-361 patch, and the exact upstream `btq-core` commit/tag it was built against. Every figure in the final paper is traceable back to the exact configuration and code version that produced it.

---

## Metrics

### Three Primary Metrics

1. **Block capacity** — transactions successfully included per block
2. **Validation & consensus performance** — signature verification time and end-to-end consensus round latency (measured and reported *separately*)
3. **Cumulative data overhead** — additional bytes processed as a direct result of migration, under a fixed total transaction demand `D`

### Derived Metrics

```
Latency Amplification:      LA_s = mean(latency_s) / mean(latency_baseline)

Capacity Degradation:       CD_s = 1 − (mean(C_s) / mean(C_baseline))

Phase Shock:                PS = (M[t_p, t_p+w] − M[t_p−w, t_p]) / M[t_p−w, t_p]

Cumulative Migration Overhead:
                             CMO_bytes = TotalBytes_scenario(D) − TotalBytes_baseline(D)

Deadline Amplification:     DA_L = PeakLatency_enforced / PeakLatency_gradual
                             DA_B = PeakBlockSize_enforced / PeakBlockSize_gradual
```

`DA_L` and `DA_B` are the project's most directly novel measurements — quantifying, in a single ratio, how much worse the worst moment of a deadline-enforced migration is compared to the worst moment of the same migration left to happen gradually.

### Statistical Methodology

- Minimum **5 independent repetitions** per configuration
- Mean, standard deviation, and 95% confidence interval reported for every primary metric
- **Mann-Whitney U test** as a non-parametric check for E1 vs. E2
- Significance is interpreted alongside effect size and confidence intervals — never reported as a standalone proof

### Strength of Evidence (cleanest → noisiest)

1. Signature verification cost
2. Block capacity / transaction throughput
3. Block size / cumulative bytes
4. Consensus round latency *(noisiest — includes OS scheduling overhead; corroborating evidence, not the paper's primary load-bearing claim)*

---

## Repository Structure

```
.
├── consensus-patch/        # BIP-361 Phase A/B patch to btq-core (src/validation.cpp)
├── migration-engine/       # Adoption trajectory generator (logistic curve, S1/S2 variants)
├── orchestration/          # RPC-based experiment runner, round-robin block production
├── telemetry/              # Per-node metrics collection (block size, latency, UTXO state)
├── analysis/               # Python/pandas/scipy/matplotlib pipeline → figures + statistics
├── infra/                  # VM provisioning, networking config, btq.conf templates
├── docs/                   # Reference docs: regtest testing guide, P2P setup guide, RPC reference
└── README.md
```

---

## Infrastructure

- **6 nodes** across **3 Oracle Cloud tenancies** (2 VMs per tenancy), Always Free tier
- **Ampere A1 (arm64)** instances run as the full validating nodes used in the E0/E1/E2 comparison
- **AMD micro instances** (1 GB RAM) used only for lightweight roles (RPC clients, orchestration controller) — never counted as validating consensus nodes
- **Networking:** public IP mesh with per-source `/32` security list rules for cross-tenancy peers; private IPs for intra-tenancy communication; reserved (non-ephemeral) public IPs required since `btq.conf` hardcodes peer addresses; RPC ports remain localhost-only, accessed via SSH tunnel
- **Fallback:** if `btq-core` proves unworkable on free-tier ARM hardware, the documented fallback is a networked (not in-process) version of an earlier custom Go blockchain design — still real, distributed processes, at lower engineering risk

---

## Getting Started

> ⚠️ This section will be filled in as infrastructure comes online. Placeholder for now.

```bash
# Clone
git clone https://github.com/abyssnn/<repo-name>.git
cd <repo-name>

# Build btq-core (arm64 target)
# ...

# Provision the 6-node regtest mesh
# ...

# Run the E0 baseline
# ...
```

---

## Scope Boundaries

Explicitly **out of scope**, to keep engineering effort pointed at the research question:

- A full/faithful reimplementation of Bitcoin (only the BIP-361 patch is written by hand)
- Public, internet-scale, or multi-region deployment
- Novel consensus protocol design (no Tendermint, HotStuff, PoW mining)
- Simulation of an actual quantum attack or cryptanalysis
- Design of new cryptographic algorithms
- Modeling BIP-361's Phase C recovery mechanism (no finalized spec exists)
- A full agent-based behavioral adoption model as a Tier 1 requirement (Tier 3 stretch only)
- Modification of `btq-core`'s existing cryptographic or P2MR implementation

---

## Project Timeline

| Tier | Contents | Status if Reached |
|---|---|---|
| **Tier 1 — Required** | 6-node mesh, real ECDSA + ML-DSA signatures, BIP-361 patch, RPC-based measurement, fixed logistic curve, E0/E1/E2 experiments, Python analysis | Project complete and defensible |
| **Tier 2 — Strengthening** | S1/S2 sensitivity, cumulative overhead + phase-shock metrics | Substantially stronger paper |
| **Tier 3 — Stretch** | S3 sensitivity, second ML-DSA parameter set, `perf`-based profiling, behavior-driven agent-based adoption model | Bonus, pursued only after Tiers 1–2 are stable |

- **Semester 1:** Build the core system — VM/quota verification, `btq-core` deployment, BIP-361 patch (tested on 2–3 local nodes before scaling to six), adoption trajectory, RPC telemetry. Target: a complete E0 baseline run across all six real nodes by semester's end.
- **Semester 2:** Run the full experiment matrix, statistical/derived-metric analysis, Tier 2/3 extensions as time allows, and write the final paper.

---

## Team

| Role | Owner | Responsibilities |
|---|---|---|
| **Consensus Lead** | Student 1 | `btq-core` build & VM deployment, BIP-361 patch (`src/validation.cpp`), functional testing on local node set before scaling |
| **Systems Lead** | Student 2 | Adoption trajectory generator, RPC orchestration/telemetry harness, Python analysis pipeline, statistical methodology |

Both students are expected to be able to read and modify the other's core code by the end of Semester 1 — the BIP-361 patch specifically should not become a single-owner black box the whole Semester 2 experiment matrix has to trust blindly.

---

## Status

🚧 **Active development — Semester 1.**

- [x] Dashboard (React/Vite + Express) built and RPC-proxied
- [x] `btq-core` builds from source; regtest tested end-to-end across all address types
- [ ] Node-to-node P2P connectivity across the 6-node mesh
- [ ] BIP-361 Phase A/B consensus patch
- [ ] E0 baseline run across all six live nodes
- [ ] Full E0/E1/E2 experiment matrix
- [ ] Sensitivity analysis (S1–S3)
- [ ] Final paper

---

## Citation

If this work is useful to you, citation details will be added once a preprint/paper is available. For now:

```
Shivjani, A. et al. (2026). The Cost of Deadlines: Empirical Dynamics of
Post-Quantum Migration in Blockchain Systems. Senior Project, Computer
Science, LUMS.
```

---

## Acknowledgments

- **[btq-ag/btq-core](https://github.com/btq-ag/btq-core)** — the BIP-360-implementing Bitcoin Core fork this project builds on
- **Bitcoin Core** and the **BIP-360 / BIP-361** authors
- Oracle Cloud Infrastructure Always Free tier, for making a real multi-node deployment feasible on a student budget
- Project advisor, for the scope change from an in-process simulator to real, patched Bitcoin Core nodes
