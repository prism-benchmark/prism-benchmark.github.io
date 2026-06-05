---
title: "PRISM Interactive Demo"
description: "Interactive PRISM demo for exploring peer-review benchmark outputs across depth, novelty, flaw detection, and constructiveness."
---

# PRISM Interactive Demo

**Inspect PRISM judgments at paper level.**

Select one representative paper, reviewer source, and dimension to inspect normalized outputs from the depth, novelty, flaw, and constructiveness pipelines.

> This is the markdown companion to the HTML demo at
> `/demo`. The HTML demo is an interactive single-page explorer over the
> static demo dataset under `data_demo/`; it loads JSON fixtures in the
> browser and does not call any backend. The markdown here is the static
> description of what the demo exposes.

## What you can do in the demo

1. **Pick a paper.** The demo bundles a small set of representative papers
   from the PRISM corpus (subset of the 1,000-paper ICLR/ICML/NeurIPS
   sample). Each paper entry exposes its PRISM ground-truth pipeline
   outputs.
2. **Pick a reviewer source.** Human reviews, plus outputs from each
   automated reviewer in the comparison set: Reviewer2, DeepReview, SEA,
   CycleReviewer, TreeReview.
3. **Pick a dimension.** The four PRISM dimensions are individually
   explorable:
   - **Depth of Analysis** — premise ratio, grounding score, DoA.
   - **Novelty Assessment** — extracted novelty claims, retrieved
     prior work, support / contradict labels.
   - **Flaw Identification** — critical vs. minor recall, nCPS
     prioritization.
   - **Constructiveness** — per-ARC scores on actionability,
     specificity, justification, solution, tone.

## Data

The demo loads pre-computed JSON fixtures from `data_demo/`. Each fixture
follows the same shape as the pipeline output:

```json
{
  "paper_id": "iclr2024_...",
  "reviewer": "deepreview",
  "dimensions": {
    "depth": { "doa": 0.483, "premise_ratio": 0.62, "grounding": 0.78 },
    "novelty": { "score": 0.81, "support_rate": 0.74, "strict": 0.69 },
    "flaws": { "critical_recall": 0.51, "minor_recall": 0.42, "ncps": 0.93 },
    "constructiveness": { "mcs": 0.634 }
  }
}
```

(Exact keys vary by dimension; the demo surfaces the canonical metric
plus the supporting sub-scores.)

## How to use the markdown version

If you are an agent that prefers markdown, this page is intentionally
short — the value of the demo is the interactive HTML, not the prose.
For the full PRISM methodology, paper, and the authoritative
machine-readable capability descriptor, see:

- [Main paper page (markdown)](https://prism-benchmark.github.io/prism-page/index.md)
- [Agent card](https://prism-benchmark.github.io/prism-page/.well-known/agent-card.json)
- [API catalog](https://prism-benchmark.github.io/prism-page/.well-known/api-catalog)
- [Skills index](https://prism-benchmark.github.io/prism-page/.well-known/agent-skills/index.json)

## Back to paper

<https://prism-benchmark.github.io/prism-page/>
