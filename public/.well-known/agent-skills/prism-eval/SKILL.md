---
name: prism-eval
description: Evaluate an LLM-generated or human peer review of a machine learning paper using the PRISM benchmark's four-dimensional framework (constructiveness, flaws, depth, novelty). Use when scoring or comparing peer reviews, decomposing reviews into Atomic Review Comments, extracting and prioritizing flaws, or assessing argument grounding and novelty claims against the manuscript.
---

# PRISM Peer Review Evaluation

PRISM (Peer Review Intelligence via Structured Multi-dimensional assessment)
scores a peer review along four orthogonal dimensions. Use this skill when
the task is to evaluate, compare, or critique the quality of a peer review
of a machine learning paper.

## When to use

Activate this skill if the user asks any of:

- "Score this peer review on PRISM."
- "How constructive is this review?"
- "What flaws did the reviewer miss?"
- "Is the review's argument grounded in the paper?"
- "Does the review's novelty assessment hold up?"

Do not use it for non-peer-review writing, for non-ML papers, or for any
task that is not about evaluating a review.

## Inputs

- `review` — the peer review text.
- `manuscript` — the full paper text (abstract, introduction, methods,
  experiments, conclusion). If the manuscript is not available, abort and
  ask for it; every dimension except the constructiveness decomposition
  requires cross-referencing the review against the paper.

## The four dimensions

### 1. Constructiveness — arc-multi-dimensional-score

Decompose the review into **Atomic Review Comments (ARCs)** — the smallest
self-contained units of feedback, typically one observation or one
suggestion per ARC. Score each ARC on five axes:

| Axis              | Question                                                      |
| ----------------- | ------------------------------------------------------------- |
| **Actionability** | Does the ARC tell the author what to do next?                 |
| **Specificity**   | Does it cite a concrete section, equation, figure, or result? |
| **Justification** | Does it give a reason, not just a verdict?                    |
| **Solution**      | Does it propose a fix or a way forward?                       |
| **Tone**          | Is the language professional and respectful?                  |

Each axis is rated 0–2 (or 0–3 — pick the granularity that matches the
length of the review; PRISM paper Table 2 has the canonical scale). The
per-ARC score is the sum, and the review-level score is the mean across
ARCs.

### 2. Flaws — critical-recall

Extract every flaw the reviewer asserts. Two passes:

1. **Extract** — pull each flaw as a verbatim or near-verbatim claim from
   the review. Discard purely stylistic complaints; keep every claim that
   the paper is _wrong_, _unsupported_, _missing_, or _logically broken_.
2. **Verify** — for each extracted flaw, check the manuscript. A flaw is
   _valid_ if the paper's text, equations, figures, or cited references
   support the reviewer's claim; otherwise it is _invalid_ (the reviewer
   is mistaken).
3. **Merge** — collapse semantically equivalent flaws across reviewers
   into a single consensus reference set. Use a lenient similarity
   threshold (cosine ≥ 0.85 on sentence embeddings, or exact match on
   the flawed claim's noun phrase).
4. **Stratify** — label each consensus flaw as **Critical** (blocks
   acceptance: invalidates a main result, breaks a claimed contribution)
   or **Minor** (cosmetic, presentation, or recoverable).

Report **severity-stratified recall**: the fraction of consensus flaws of
each severity that the reviewer surfaced. Also report the **normalized
Critique Prioritization Score (nCPS)** — the weighted harmonic mean of
critical-recall and minor-recall that rewards surfacing critical flaws
more than minor ones.

### 3. Depth — argument-grounding-rate

Extract the reviewer's **argumentative discourse units (ADUs)** — every
discrete claim and every premise. Label each:

- **Claim** — a conclusion the reviewer asserts (e.g., "the method does
  not scale to large graphs").
- **Premise** — a reason offered in support of a claim (e.g., "the
  reported runtime is O(n^3) per epoch").

For each premise, classify the grounding:

- **Manuscript-grounded** — the premise cites or paraphrases a specific
  passage, equation, figure, table, or result in the paper.
- **Literature-grounded** — the premise cites an external paper, theorem,
  or standard result that the manuscript itself does not provide.
- **Ungrounded** — the premise is asserted without a citation or with a
  citation that does not actually support it.

Report **argument-grounding-rate** = (manuscript-grounded + literature-grounded)
premises / total premises. A high rate means the review's reasoning is
auditable; a low rate means the reviewer is hand-waving.

### 4. Novelty — novelty-support

Extract every **novelty claim** the reviewer makes about the paper
(typically phrased as "this is the first to …", "unlike prior work X, …",
"the contribution is Y"). For each claim:

1. **Retrieve** — pull the 5–10 most-related papers from Semantic Scholar
   (or equivalent), starting from the manuscript's own references and
   expanding via forward and backward citation traversal.
2. **Support check** — read the retrieved abstracts/intros and decide
   whether the prior work actually anticipates the claimed novelty.
3. **Label** — **support** (the prior work does not anticipate the
   claim), **contradict** (the prior work clearly anticipates the
   claim), or **partial** (related but not equivalent).

Report the **novelty-support score** (fraction of novelty claims that
hold up) and the **support rate** (fraction of retrieved priors that
support the claim). A low novelty-support score means the reviewer has
over-claimed the paper's novelty; a high score means the reviewer is
correctly contextualizing the work.

## Output format

Return a single JSON object with the four dimension scores, the per-ARC
constructiveness breakdown, the consensus flaw list with severity
labels, the ADU table with grounding labels, and the novelty claim
table with support labels. The exact schema is in
`https://prism-benchmark.github.io/prism-page/.well-known/agent-card.json`
under the matching `id` for each dimension.

## Progressive disclosure

- This `SKILL.md` covers the procedure. Load it when the task matches.
- The PRISM paper, `https://arxiv.org/abs/2605.26730`, has the canonical
  scales and worked examples. Fetch it when you need to disambiguate
  scoring edge cases.
- The interactive demo at
  `https://prism-benchmark.github.io/prism-page/demo` has pre-computed
  scores for a small set of reviews. Use it as a reference for what a
  correctly-scored output looks like.
- The capability descriptor at
  `https://prism-benchmark.github.io/prism-page/.well-known/agent-card.json`
  is the machine-readable index of the four dimensions, their input
  contracts, and their reported metrics.

## Safety

Do not run the PRISM scoring on reviews of papers outside machine
learning — the constructiveness, flaw, depth, and novelty dimensions
were calibrated on ML submissions and will misfire on, e.g., theory
papers with no empirical claims or systems papers with no novel
algorithm. If the paper is not ML, abort and tell the user.
